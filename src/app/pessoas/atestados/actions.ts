"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createServiceClient } from "@kph/db/supabase/server";
import { requireUser } from "@kph/auth/server";
import type { ActionResult } from "@/lib/result";

const BUCKET = "employee-docs";

/**
 * Upload de atestado pelo próprio colaborador (T1).
 * Armazena em employee-docs/{nome}/atestados/{filename} via service role.
 * Insere registro em sick_leaves com employee_id resolvido pelo auth.uid().
 */
export async function uploadMySickLeave(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createSupabaseServerClient();
    const service = createServiceClient();
    if (!supabase || !service) return { ok: false, error: "Supabase indisponível" };

    // Resolve employee do colaborador autenticado
    const { data: empData, error: empErr } = await supabase
      .from("employees")
      .select("id, nome, sobrenome, unit_id")
      .maybeSingle();
    if (empErr || !empData)
      return { ok: false, error: "Colaborador não encontrado para este usuário" };

    const emp = empData as { id: string; nome: string; sobrenome: string | null; unit_id: string | null };
    const nomeCompleto = [emp.nome, emp.sobrenome].filter(Boolean).join(" ");

    // Dados do form
    const file = formData.get("file") as File | null;
    const dataInicio = formData.get("data_inicio") as string | null;
    const dataFim = formData.get("data_fim") as string | null;
    const medico = formData.get("medico") as string | null;
    const cid = formData.get("cid") as string | null;

    if (!file || file.size === 0) return { ok: false, error: "Arquivo obrigatório" };
    if (!dataInicio) return { ok: false, error: "Data de início obrigatória" };

    const fim = dataFim || dataInicio;
    const inicio = new Date(dataInicio);
    const fimDate = new Date(fim);
    const totalDias = Math.max(
      1,
      Math.round((fimDate.getTime() - inicio.getTime()) / 86400000) + 1,
    );

    // Upload pro storage via service role
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const slug = dataInicio.replace(/-/g, "");
    const storageKey = `${nomeCompleto}/atestados/ATESTADO_${slug}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadErr } = await service.storage
      .from(BUCKET)
      .upload(storageKey, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
    if (uploadErr) return { ok: false, error: `Upload falhou: ${uploadErr.message}` };

    // Insere no banco via client autenticado (RLS t3_dept/t4 permite INSERT, T1 não)
    // Usa service role para garantir o insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svcAny = service;
    const { data: inserted, error: insertErr } = await svcAny
      .from("sick_leaves")
      .insert({
        unit_id: emp.unit_id,
        employee_id: emp.id,
        nome: nomeCompleto,
        data_inicio: dataInicio,
        data_fim: fim,
        total_dias: totalDias,
        tipo: "atestado",
        cid: cid || null,
        medico: medico || null,
        documento_ref: storageKey,
      })
      .select("id")
      .single();

    if (insertErr) return { ok: false, error: `Registro falhou: ${insertErr.message}` };

    revalidatePath("/pessoas/atestados");
    return { ok: true, data: { id: (inserted as { id: string }).id } };
  } catch (e) {
    console.error("[uploadMySickLeave]", e);
    return { ok: false, error: "Erro inesperado ao enviar atestado" };
  }
}
