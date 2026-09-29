import { allowedOrigins } from "@/lib/tenant";
import { NextResponse } from 'next/server';
import { createServiceClient } from '@kph/db/supabase/server';
import { normalizarTelefone, isNumeroWhatsAppValido } from '@/lib/pessoas/utils';
import { enviarWhatsApp } from '@/lib/pessoas/whatsapp';

export const dynamic = 'force-dynamic';

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = allowedOrigins();

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const ok =
    ALLOWED_ORIGINS.includes(origin) ||
    (process.env.NODE_ENV === 'development' && /^http:\/\/localhost/.test(origin));
  return ok
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      }
    : {};
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

// ── Rate limit por IP (in-memory, por instância) ──────────────────────────────
const ipMap = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

function isRateLimited(req: Request): boolean {
  const ip = req.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() ?? 'unknown';
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    ipMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const ch = corsHeaders(req);

  if (isRateLimited(req)) {
    return NextResponse.json(
      { ok: false, error: 'Muitas tentativas. Aguarde um instante.' },
      { status: 429, headers: ch }
    );
  }

  let body: FormData;
  try {
    body = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida.' }, { status: 400, headers: ch });
  }

  // Honeypot — bots preenchem campos ocultos; retornar 200 sem processar
  if (body.get('website')) {
    return NextResponse.json({ ok: true }, { headers: ch });
  }

  // ── Campos ──────────────────────────────────────────────────────────────────
  const nome             = (body.get('nome')            as string | null)?.trim();
  const whatsapp         = (body.get('whatsapp')        as string | null)?.trim();
  const email            = (body.get('email')           as string | null)?.trim().toLowerCase();
  const dataNascimento   = (body.get('data_nascimento') as string | null)?.trim(); // YYYY-MM-DD
  const cidade           = (body.get('cidade')          as string | null)?.trim();
  const bairro           = (body.get('bairro')          as string | null)?.trim() || null;
  const cargoId          = (body.get('cargo_id')        as string | null)?.trim();
  const nivel            = (body.get('nivel')           as string | null)?.trim() || null;
  const cv               = body.get('cv') as File | null;

  // ── Validação server-side ────────────────────────────────────────────────────
  if (!nome)         return NextResponse.json({ ok: false, error: 'Nome é obrigatório.' },               { status: 422, headers: ch });
  if (!whatsapp)     return NextResponse.json({ ok: false, error: 'WhatsApp é obrigatório.' },           { status: 422, headers: ch });
  if (!email || !email.includes('@')) return NextResponse.json({ ok: false, error: 'E-mail inválido.' }, { status: 422, headers: ch });
  if (!dataNascimento) return NextResponse.json({ ok: false, error: 'Data de nascimento é obrigatória.' }, { status: 422, headers: ch });
  if (!cidade)       return NextResponse.json({ ok: false, error: 'Cidade é obrigatória.' },             { status: 422, headers: ch });
  if (!cargoId)      return NextResponse.json({ ok: false, error: 'Cargo pretendido é obrigatório.' },   { status: 422, headers: ch });

  const telefone = normalizarTelefone(whatsapp);
  if (!isNumeroWhatsAppValido(telefone)) {
    return NextResponse.json({ ok: false, error: 'WhatsApp inválido. Use o formato (11) 99999-9999.' }, { status: 422, headers: ch });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
    return NextResponse.json({ ok: false, error: 'Data de nascimento inválida.' }, { status: 422, headers: ch });
  }

  if (nivel && !['I', 'II', 'III'].includes(nivel)) {
    return NextResponse.json({ ok: false, error: 'Nível inválido.' }, { status: 422, headers: ch });
  }

  const sb = createServiceClient();

  // ── Valida cargo ─────────────────────────────────────────────────────────────
  const { data: cargo, error: cargoErr } = await (sb as any)
    .from('cargos')
    .select('id, nome, tem_nivel')
    .eq('id', cargoId)
    .eq('ativo', true)
    .maybeSingle();

  if (cargoErr || !cargo) {
    return NextResponse.json({ ok: false, error: 'Cargo inválido.' }, { status: 422, headers: ch });
  }

  // ── Observações: campos sem coluna própria armazenados como texto estruturado ──
  const nivelDesc =
    nivel === 'I'   ? 'I (Sênior)'  :
    nivel === 'II'  ? 'II (Pleno)'  :
    nivel === 'III' ? 'III (Entrada)' : null;

  const obs = [
    '[Pipou Portal]',
    `Nascimento: ${dataNascimento}`,
    nivelDesc && (cargo as { tem_nivel: boolean }).tem_nivel ? `Nível: ${nivelDesc}` : null,
  ].filter(Boolean).join('\n');

  // ── Duplicate check ──────────────────────────────────────────────────────────
  const { data: existing } = await (sb as any)
    .from('candidates')
    .select('id, status')
    .eq('phone', telefone)
    .maybeSingle();

  let candidateId: string;

  if (existing) {
    // Candidato já existe — registrar nova manifestação de interesse sem sobrescrever dados
    await (sb as any)
      .from('candidates')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', (existing as { id: string }).id);
    candidateId = (existing as { id: string }).id;
  } else {
    // Novo candidato
    const { data: inserted, error: insertErr } = await (sb as any)
      .from('candidates')
      .insert({
        full_name: nome,
        email,
        phone: telefone,
        cidade,
        bairro,
        cargo_id: cargoId,
        area_interesse: (cargo as { nome: string }).nome,
        origem: 'portal',
        status: 'banco_talentos',
        observacoes: obs,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr || !inserted) {
      console.error('[portal-pipou/candidatura] insert falhou:', insertErr);
      return NextResponse.json(
        { ok: false, error: 'Erro ao processar cadastro. Tente novamente.' },
        { status: 500, headers: ch }
      );
    }
    candidateId = (inserted as { id: string }).id;
  }

  // ── Upload CV ────────────────────────────────────────────────────────────────
  if (cv && cv.size > 0 && cv.size < 10 * 1024 * 1024) { // max 10 MB
    try {
      const buf = Buffer.from(await cv.arrayBuffer());
      const { error: upErr } = await (sb as any).storage
        .from('candidate-cvs')
        .upload(`${candidateId}/cv`, buf, { contentType: cv.type || 'application/pdf', upsert: true });

      if (upErr) {
        console.error('[portal-pipou/candidatura] CV upload falhou:', upErr.message);
      } else {
        await (sb as any)
          .from('candidates')
          .update({ cv_storage_path: `${candidateId}/cv` })
          .eq('id', candidateId);
      }
    } catch (err) {
      console.error('[portal-pipou/candidatura] CV upload exceção:', err);
    }
  }

  // ── WhatsApp — template 1 cadastro (fire-and-forget) ─────────────────────────
  enviarWhatsApp({
    telefone,
    templateEnvVar: 'TWILIO_TEMPLATE_CADASTRO_SID',
    variables: { '1': nome },
  }).catch(err => console.error('[portal-pipou/candidatura] WA falhou:', err));

  return NextResponse.json({ ok: true, id: candidateId }, { headers: ch });
}
