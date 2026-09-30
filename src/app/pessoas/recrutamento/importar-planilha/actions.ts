"use server";
import { z } from "zod";
import { requireRole } from "@kph/auth/server";
import { createSupabaseServerClient } from "@kph/db/supabase/server";
import { talentRowSchema, TALENT_BATCH_ROWS } from "@/lib/pessoas/talent-import";
import { revalidatePath } from "next/cache";
const inputSchema=z.object({unitId:z.string().uuid(),rows:z.array(talentRowSchema).min(1).max(TALENT_BATCH_ROWS),commit:z.boolean()}).strict();
export async function importTalentBatch(input:unknown){
  await requireRole(["founder"]);
  try{
    const data=inputSchema.parse(input);
    const client=await createSupabaseServerClient();
    if(!client)throw Error("Serviço indisponível.");
    const {data:result,error}=await client.rpc("cardoso_import_talents" as never,{p_unit_id:data.unitId,p_rows:data.rows,p_commit:data.commit} as never);
    if(error)throw Error("Não foi possível processar este lote. Confira a unidade e tente novamente.");
    const parsed=z.object({created:z.number().int().nonnegative(),skipped:z.number().int().nonnegative(),rows:z.array(z.object({row:z.number().int(),status:z.enum(["created","ready","existing"])}))}).parse(result);
    if(data.commit)revalidatePath("/pessoas/recrutamento/banco-talentos");
    return {ok:true as const,...parsed};
  }catch(e){return {ok:false as const,error:e instanceof z.ZodError?"Dados inválidos no lote. Confira o mapeamento e as linhas.":e instanceof Error?e.message:"Falha ao importar."};}
}
