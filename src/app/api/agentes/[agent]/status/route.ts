// PATCH /api/agentes/[agent]/status
// Atualiza status da conversa diretamente no Supabase (assumida | ativa | encerrada)

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@kph/db/supabase/server";
import { requireRoleApi } from "@kph/auth/server";
import { corsHeaders } from "@/lib/pessoas/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin, "PATCH, OPTIONS") });
}

const VALID_STATUSES = ["ativa", "assumida", "encerrada"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ agent: string }> },
) {
  const origin = req.headers.get("origin");
  const ch = corsHeaders(origin, "PATCH, OPTIONS");
  const guard = await requireRoleApi(["founder", "cfo", "gm", "pessoas"]);
  if (!guard.ok) return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: guard.status, headers: ch });

  const { agent } = await params;

  if (!["maya", "theo"].includes(agent)) {
    return NextResponse.json({ ok: false, error: "Agente inválido" }, { status: 400, headers: ch });
  }

  const { id, status, operator_name, operator_id } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ ok: false, error: "id e status obrigatórios" }, { status: 400, headers: ch });
  }

  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ ok: false, error: `Status inválido: ${status}` }, { status: 400, headers: ch });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase indisponível" }, { status: 500, headers: ch });
  }

  const update: Record<string, unknown> = { status };
  if (operator_name !== undefined) update.operator_name = operator_name;
  if (operator_id !== undefined) update.operator_id = operator_id;

  // agent_conversations não consta nos tipos gerados (colunas novas via migration)
  const sb = supabase as unknown as { from: (t: string) => any };
  const { error } = await sb
    .from("agent_conversations")
    .update(update)
    .eq("id", id)
    .eq("agent", agent);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: ch });
  }

  return NextResponse.json({ ok: true }, { headers: ch });
}
