import { NextResponse } from "next/server";
import { createServiceClient } from "@kph/db/supabase/server";
import { requireRoleApi } from "@kph/auth/server";
import { normalizarTelefone } from "@/lib/pessoas/utils";

export const dynamic = "force-dynamic";

// Status válidos no pipeline (candidates_status_check).
const STATUS_PIPELINE = ["novo", "triagem", "entrevista", "aprovado", "reprovado", "desistiu"];

type CandidatoMaya = {
  id: string;
  nome: string | null;
  telefone: string | null;
  area_interesse: string | null;
  cargo_interesse: string | null;
  status: string | null;
};

async function sync() {
  const sb = createServiceClient();
  if (!sb) return NextResponse.json({ ok: false, error: "Sem conexão" }, { status: 500 });

  // 1) Candidatos que a Maya criou (tabela própria do bot — fonte limpa e estruturada).
  const { data: mayaRaw, error: errMaya } = await sb
    .from("candidatos_maya")
    .select("id, nome, telefone, area_interesse, cargo_interesse, status")
    .order("created_at", { ascending: true });

  if (errMaya) return NextResponse.json({ ok: false, error: errMaya.message }, { status: 500 });

  const maya = (mayaRaw ?? []) as CandidatoMaya[];
  if (maya.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, mensagem: "Nenhum candidato da Maya" });
  }

  // 2) Telefones já presentes em candidates (dedupe).
  const { data: existing } = await sb.from("candidates").select("phone").not("phone", "is", null);
  const existingPhones = new Set(((existing ?? []) as { phone: string | null }[]).map((e) => normalizarTelefone(e.phone)));

  // 3) Monta payloads só dos que ainda não estão no pipeline.
  const novos: {
    full_name: string;
    phone: string;
    area_interesse: string | null;
    origem: string;
    status: string;
    updated_at: string;
  }[] = [];
  for (const m of maya) {
    const phone = normalizarTelefone(m.telefone);
    if (!phone || existingPhones.has(phone)) continue;

    const cargo = (m.cargo_interesse ?? "").trim();
    const area = (m.area_interesse ?? "").trim();
    // cargo_interesse é o cargo específico; area_interesse o macro. Combina os dois.
    const area_interesse = cargo && area ? `${cargo} · ${area}` : cargo || area || null;
    const status = STATUS_PIPELINE.includes((m.status ?? "").trim()) ? (m.status as string).trim() : "novo";

    novos.push({
      full_name: (m.nome ?? "Candidato Maya").trim() || "Candidato Maya",
      phone,
      area_interesse,
      origem: "maya",
      status,
      updated_at: new Date().toISOString(),
    });
    existingPhones.add(phone); // evita duplicar dentro do mesmo batch
  }

  if (novos.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, mensagem: "Todos os candidatos da Maya já estão no pipeline" });
  }

  // 4) Upsert por telefone (idempotente).
  const { error: upErr } = await sb.from("candidates").upsert(novos, { onConflict: "phone" });
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, synced: novos.length });
}

export async function POST() {
  const guard = await requireRoleApi(["founder", "cfo", "gm", "pessoas"]);
  if (!guard.ok) return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: guard.status });
  try {
    return await sync();
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// GET como alias (compatibilidade).
export async function GET() {
  const guard = await requireRoleApi(["founder", "cfo", "gm", "pessoas"]);
  if (!guard.ok) return NextResponse.json({ ok: false, error: "Sem permissão" }, { status: guard.status });
  try {
    return await sync();
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
