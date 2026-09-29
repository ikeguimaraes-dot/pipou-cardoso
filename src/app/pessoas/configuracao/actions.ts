"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "@kph/auth/server";
import { createSupabaseServerClient } from "@kph/db/supabase/server";

export async function createUnit(form: FormData): Promise<{ error?: string; ok?: boolean }> {
  await requireRole(["founder"]);
  const brand = String(form.get("brand") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const cnpj = String(form.get("cnpj") ?? "").replace(/\D/g, "") || null;
  if (!brand || !name || brand.length > 120 || name.length > 120 || (cnpj && cnpj.length !== 14)) return { error: "Confira empresa, unidade e CNPJ." };
  const client = await createSupabaseServerClient();
  if (!client) return { error: "Serviço indisponível." };
  const { error } = await client.rpc("cardoso_create_unit" as never, { p_brand: brand, p_name: name, p_cnpj: cnpj } as never);
  if (error) return { error: error.message.includes("já cadastrada") ? "Esta unidade já está cadastrada." : "Não foi possível cadastrar a unidade." };
  revalidatePath("/pessoas", "layout");
  return { ok: true };
}
