"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { pendenciasContext, EMPLOYEE_PENDING_COLUMNS } from "@/lib/pessoas/pendencias-server";
import { type PendenciaEmployee } from "@/lib/pessoas/pendencias-model";
import { BULK_COLUMNS, MAX_BULK_ROWS, buildBulkPreview, parseBulkMatrix, cpfDigits, type BulkPreviewRow } from "@/lib/pessoas/bulk-model";
import { completarPendencia } from "../pendencias/actions";

const previewSchema = z.object({ unitId: z.string().uuid(), matrix: z.array(z.array(z.string().max(250)).max(17)).min(2).max(MAX_BULK_ROWS + 1) }).strict();
const field = z.enum(BULK_COLUMNS as [typeof BULK_COLUMNS[number], ...typeof BULK_COLUMNS[number][]]);
const commitSchema = z.object({ unitId: z.string().uuid(), rows: z.array(z.object({
  line: z.number().int().min(2).max(MAX_BULK_ROWS + 1), cpf: z.string().regex(/^\d{11}$/), employeeId: z.string().uuid(),
  values: z.partialRecord(field, z.string().trim().min(1).max(250)), expected: z.partialRecord(field, z.string().nullable()),
}).strict()).min(1).max(10) }).strict();
export type BulkResult = { line: number; status: "importado" | "erro"; message: string };

export async function previewBulk(input: unknown): Promise<{ ok: true; rows: BulkPreviewRow[] } | { ok: false; error: string }> {
  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Planilha fora do modelo ou do limite de 200 linhas e 250 caracteres por célula." };
  try {
    const { client, units } = await pendenciasContext();
    const unit = units.find(u => u.id === parsed.data.unitId);
    if (!unit) return { ok: false, error: "Sem permissão de RH para esta unidade." };
    let rows;
    try { rows = parseBulkMatrix(parsed.data.matrix); }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Confira os títulos das colunas do modelo." }; }
    if (!rows.length) return { ok: false, error: "A planilha não contém dados para conferir." };
    const employees: PendenciaEmployee[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from("employees").select(EMPLOYEE_PENDING_COLUMNS).eq("unit_id", unit.id).eq("ativo", true).order("id").range(offset, offset + 499);
      if (error) return { ok: false, error: "Não foi possível conferir os cadastros. Nenhum dado foi gravado." };
      employees.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) break;
    }
    return { ok: true, rows: buildBulkPreview(rows, employees, unit) };
  } catch { return { ok: false, error: "Confira o modelo do arquivo e seu acesso à unidade. Não foi possível gerar a prévia." }; }
}

export async function commitBulk(input: unknown): Promise<{ ok: true; results: BulkResult[] } | { ok: false; error: string }> {
  const parsed = commitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Lote inválido. Gere uma nova prévia." };
  const { rows, unitId } = parsed.data;
  if (new Set(rows.map(r => r.employeeId)).size !== rows.length || new Set(rows.map(r => r.line)).size !== rows.length || rows.some(r => "cpf" in r.values))
    return { ok: false, error: "Lote repetido ou tentativa de alterar o identificador. Gere uma nova prévia." };
  try {
    const { client, units } = await pendenciasContext();
    if (!units.some(u => u.id === unitId)) return { ok: false, error: "Sem permissão de RH para esta unidade." };
    // Resolve by unit and CPF again. The preview sent by the browser is not authority.
    const { data, error } = await client.from("employees").select("id, cpf").eq("unit_id", unitId).eq("ativo", true).in("id", rows.map(r => r.employeeId));
    if (error) return { ok: false, error: "Falha ao conferir o lote. Nenhum item deste lote foi gravado." };
    const results: BulkResult[] = [];
    for (const row of rows) {
      if (!data?.some(e => e.id === row.employeeId && cpfDigits(e.cpf ?? "") === row.cpf)) {
        results.push({ line: row.line, status: "erro", message: "O vínculo não corresponde mais à unidade e ao CPF conferidos." }); continue;
      }
      // Existing action verifies current identity, pending fields and atomic expected values.
      const result = await completarPendencia({ employeeId: row.employeeId, values: row.values, expected: row.expected,
        scope: { unitId, cpf: data.find(e => e.id === row.employeeId)!.cpf } });
      results.push({ line: row.line, status: result.ok ? "importado" : "erro", message: result.ok ? "Campos pendentes preenchidos." : result.error });
    }
    revalidatePath("/pessoas"); revalidatePath("/pessoas/pendencias");
    return { ok: true, results };
  } catch { return { ok: false, error: "Não foi possível confirmar o resultado deste lote. Gere nova prévia antes de reenviar." }; }
}
