"use server";

import { createServiceClient } from "@kph/db/supabase/server";
import type { ActionResult } from "@/lib/result";

export interface LearningProposal {
  id: string;
  modulo: string;
  tipo: "faq" | "prompt" | "processo" | "integracao";
  prioridade: "alta" | "media" | "baixa";
  titulo: string;
  descricao: string;
  evidencia: string | null;
  impacto_estimado: string | null;
  status: "pending" | "approved" | "dismissed";
  created_at: string;
}

/** Busca propostas pendentes de um módulo */
export async function getProposals(
  modulo: string,
  status: "pending" | "approved" | "dismissed" = "pending",
): Promise<LearningProposal[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from("kph_learning_proposals")
    .select("id, modulo, tipo, prioridade, titulo, descricao, evidencia, impacto_estimado, status, created_at")
    .eq("modulo", modulo)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data as LearningProposal[];
}

/** Aprova uma proposta */
export async function approveProposal(id: string): Promise<ActionResult<void>> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, error: "Supabase indisponível" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from("kph_learning_proposals")
    .update({ status: "approved", executed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

/** Descarta uma proposta */
export async function dismissProposal(id: string): Promise<ActionResult<void>> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, error: "Supabase indisponível" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from("kph_learning_proposals")
    .update({ status: "dismissed", executed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
