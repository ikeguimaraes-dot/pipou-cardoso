// POST /api/agentes/[agent]/send
// Proxy para Railway — injeta mensagem do operador e envia via Twilio

import { NextRequest, NextResponse } from "next/server";
import { requireRoleApi } from "@kph/auth/server";
import { corsHeaders } from "@/lib/pessoas/cors";

const BACKEND_URLS: Record<string, string> = {
  maya: process.env.MAYA_BACKEND_URL ?? "",
  theo: process.env.THEO_BACKEND_URL ?? "",
};

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin, "POST, OPTIONS") });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agent: string }> },
) {
  const origin = req.headers.get("origin");
  const ch = corsHeaders(origin, "POST, OPTIONS");
  const guard = await requireRoleApi(["founder", "cfo", "gm", "pessoas"]);
  if (!guard.ok) return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: guard.status, headers: ch });

  const { agent } = await params;
  const backendUrl = BACKEND_URLS[agent];

  if (!backendUrl) {
    return NextResponse.json({ ok: false, error: "Agente não configurado para este cliente" }, { status: 503, headers: ch });
  }

  const body = await req.json();

  try {
    const res = await fetch(`${backendUrl}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status, headers: ch });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro de conexão" },
      { status: 502, headers: ch },
    );
  }
}
