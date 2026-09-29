import { allowedOrigins } from "@/lib/tenant";
import { NextResponse } from 'next/server';
import { createServiceClient } from '@kph/db/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED = allowedOrigins();

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const ok = ALLOWED.includes(origin) || (process.env.NODE_ENV === 'development' && /^http:\/\/localhost/.test(origin));
  return ok
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' }
    : {};
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: cors(req) });
}

export async function GET(req: Request) {
  const sb = createServiceClient();
  const { data, error } = await (sb as any)
    .from('cargos')
    .select('id, nome, setor, tem_nivel')
    .eq('ativo', true)
    .order('setor')
    .order('nome');

  if (error) {
    return NextResponse.json({ ok: false, error: 'Erro ao buscar cargos.' }, { status: 500, headers: cors(req) });
  }
  return NextResponse.json({ ok: true, cargos: data ?? [] }, { headers: cors(req) });
}
