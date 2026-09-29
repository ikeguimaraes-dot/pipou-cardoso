"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizePendingValues } from "@/lib/pessoas/pendencias-validation";
import { CAMPOS_PENDENCIA, employeePendencias, type CampoPendencia } from "@/lib/pessoas/pendencias-model";
import { EMPLOYEE_PENDING_COLUMNS, pendenciasContext } from "@/lib/pessoas/pendencias-server";

const fieldKey = z.enum(Object.keys(CAMPOS_PENDENCIA) as [CampoPendencia, ...CampoPendencia[]]);
const requestSchema = z.object({
  employeeId: z.string().uuid(),
  values: z.partialRecord(fieldKey, z.string().trim().min(1).max(250)),
  expected: z.partialRecord(fieldKey, z.string().nullable()),
  scope: z.object({ unitId: z.string().uuid(), cpf: z.string() }).strict().optional(),
}).strict();

/** Fill only pending fields, with verified identity, scoped access, and compare-and-set. */
export async function completarPendencia(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confira os campos informados e tente novamente." };
  const { employeeId, values, expected, scope } = parsed.data;
  const keys = Object.keys(values) as CampoPendencia[];
  if (!keys.length || keys.some(key => !(key in expected))) return { ok: false, error: "Preencha pelo menos uma informação pendente." };
  const normalized = normalizePendingValues(values);
  if (!normalized.ok) return normalized;
  Object.assign(values, normalized.values);
  try {
    const { client, units } = await pendenciasContext();
    if (!units.length) return { ok: false, error: "Você não tem unidade autorizada para esta alteração." };
    const { data: employee, error } = await client.from("employees").select(EMPLOYEE_PENDING_COLUMNS)
      .eq("id", employeeId).in("unit_id", units.map(u => u.id)).eq("ativo", true).maybeSingle();
    if (error || !employee) return { ok: false, error: "Cadastro não disponível para alteração." };
    if (scope && (employee.unit_id !== scope.unitId || employee.cpf !== scope.cpf))
      return { ok: false, error: "O vínculo mudou desde a prévia. Confira novamente a unidade e o CPF." };
    const unit = units.find(u => u.id === employee.unit_id)!;
    const pendingKeys = new Set(employeePendencias(employee, unit).flatMap(item => Object.keys(item.fields)));
    if (keys.some(key => !pendingKeys.has(key) || employee[key] !== expected[key]))
      return { ok: false, error: "Este cadastro foi atualizado por outra pessoa. Atualize a central antes de continuar." };
    let query = client.from("employees").update(values).eq("id", employeeId).eq("unit_id", unit.id).eq("ativo", true);
    if (scope) query = query.eq("cpf", scope.cpf);
    for (const key of keys) query = expected[key] === null ? query.is(key, null) : query.eq(key, expected[key]!);
    const { data: updated, error: updateError } = await query.select("id").maybeSingle();
    if (updateError) {
      console.error("[pendencias] Falha ao completar cadastro:", updateError.code);
      return { ok: false, error: "Não foi possível salvar. Confira os dados e sua permissão de edição." };
    }
    if (!updated) return { ok: false, error: "O cadastro mudou durante a edição. Atualize a central e tente novamente." };
    revalidatePath("/pessoas/pendencias");
    revalidatePath("/pessoas/colaboradores");
    revalidatePath(`/pessoas/colaboradores/${employeeId}`);
    revalidatePath(`/pessoas/colaboradores/${employeeId}/editar`);
    return { ok: true };
  } catch (error) {
    console.error("[pendencias] Não foi possível validar a alteração:", error instanceof Error ? error.name : "unknown");
    return { ok: false, error: "Não foi possível validar seu acesso. Atualize a página ou entre novamente." };
  }
}
