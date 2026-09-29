"use server";
import { z } from "zod";
import { requireRole } from "@kph/auth/server";
import { createSupabaseServerClient } from "@kph/db/supabase/server";
import { parseInitialImport } from "@/lib/pessoas/initial-import";
import { revalidatePath } from "next/cache";
const inputSchema = z.object({unitId:z.string().uuid(),text:z.string().max(500000)}).strict();
export async function initialImport(input: unknown, commit = false) {
  await requireRole(["founder"]);
  try {
    const data = inputSchema.parse(input);
    const client = await createSupabaseServerClient();
    if (!client) throw new Error("Serviço indisponível.");
    const { data: unit, error: unitError } = await client.from("units").select("id").eq("id",data.unitId).eq("active",true).maybeSingle();
    if (unitError || !unit) throw new Error("Unidade indisponível.");
    const rows = parseInitialImport(data.text);
    const { data: existing, error } = await client.from("employees").select("cpf").in("cpf",rows.map(r => r.cpf));
    if (error) throw new Error("Não foi possível conferir duplicidades.");
    if (existing?.length) throw new Error(`${existing.length} CPF(s) já cadastrado(s). Use a importação de pendências para completar cadastros existentes.`);
    if (commit) {
      const { error: insertError } = await client.from("employees").insert(rows.map(row => ({...row,unit_id:unit.id})) as never);
      if (insertError) throw new Error("Lote não importado. Confira os dados e gere nova prévia; pode haver um cadastro criado simultaneamente.");
      revalidatePath("/pessoas","layout");
    }
    return {ok:true as const,count:rows.length,preview:rows.map(r => ({nome:`${r.nome} ${r.sobrenome}`.trim(),funcao:r.funcao,admissao:r.data_admissao})),committed:commit};
  } catch (error) { return {ok:false as const,error:error instanceof z.ZodError ? "Arquivo ou unidade inválidos." : error instanceof Error ? error.message : "Não foi possível importar."}; }
}
