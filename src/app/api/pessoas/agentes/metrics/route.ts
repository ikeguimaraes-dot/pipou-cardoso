/**
 * GET /api/pessoas/agentes/metrics
 * Métricas ao vivo de Maya e Theo — usadas pelo AgentesClient (polling 30s).
 * Cache: 20s via revalidate.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@kph/db/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any;

  // Busca em paralelo
  const [mayaConvRes, mayaCandRes, theoRes, theoMetricsRes] = await Promise.allSettled([
    supabase
      .from("agent_conversations")
      .select("id, status, operator_id")
      .eq("agent", "maya"),

    supabase
      .from("candidatos_maya")
      .select("id"),

    supabase
      .from("theo_tickets")
      .select("id, status"),

    supabase
      .from("agent_metrics")
      .select("intencao")
      .eq("agent", "theo")
      .not("intencao", "is", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // ─── Maya ─────────────────────────────────────────────────────
  const mayaConvs = mayaConvRes.status === "fulfilled" ? (mayaConvRes.value.data ?? []) : [];
  const mayaCands = mayaCandRes.status === "fulfilled" ? (mayaCandRes.value.data ?? []) : [];

  const mayaAtivas = mayaConvs.filter((c: { status?: string }) => (c.status ?? "ativa") === "ativa").length;
  const mayaEnc = mayaConvs.filter((c: { status?: string }) => c.status === "encerrada");
  const mayaAutonom = mayaEnc.filter((c: { operator_id?: string | null }) => !c.operator_id).length;
  const taxaAutonoma = mayaEnc.length > 0 ? Math.round((mayaAutonom / mayaEnc.length) * 100) : 0;

  // ─── Theo ─────────────────────────────────────────────────────
  const theoTickets = theoRes.status === "fulfilled" ? (theoRes.value.data ?? []) : [];
  const theoMetrics = theoMetricsRes.status === "fulfilled" ? (theoMetricsRes.value.data ?? []) : [];

  const theoAbertos = theoTickets.filter((t: { status?: string }) => t.status?.toLowerCase() === "aberto").length;

  // Top intenção
  const intMap: Record<string, number> = {};
  for (const m of theoMetrics) {
    const int = String(m.intencao ?? "");
    if (int) intMap[int] = (intMap[int] ?? 0) + 1;
  }
  const topIntencao = Object.entries(intMap).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  // Fricções = métricas sem intenção detectada
  const { data: allTheoMetrics } = await supabase
    .from("agent_metrics")
    .select("intencao")
    .eq("agent", "theo")
    .is("intencao", null)
    .limit(1000);
  const friccoes = (allTheoMetrics ?? []).length;

  return NextResponse.json({
    maya: {
      conversasAtivas: mayaAtivas,
      candidatosTotal: mayaCands.length,
      taxaAutonoma,
    },
    theo: {
      ticketsAbertos: theoAbertos,
      friccoes,
      topIntencao,
    },
    lastUpdated: Date.now(),
  });
}
