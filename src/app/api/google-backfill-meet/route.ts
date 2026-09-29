import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import { createServiceClient } from '@kph/db/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function autorizado(req: NextRequest): boolean {
  const enviado = req.headers.get('x-kph-backfill-secret');
  const esperado = process.env.BACKFILL_SECRET;
  if (!esperado || !enviado) return false;
  const a = Buffer.from(enviado);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function extractMeetLink(event: calendar_v3.Schema$Event): string | null {
  return (
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ??
    null
  );
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return new Response(null, { status: 404 });

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const calendarId   = process.env.GOOGLE_CALENDAR_ID ?? 'primary';

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({ ok: false, error: 'Credenciais Google ausentes' }, { status: 500 });
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const sb = createServiceClient();

  const { data: orfaos, error: selectErr } = await (sb as any)
    .from('candidate_agendamentos')
    .select('id, google_event_id')
    .not('google_event_id', 'is', null)
    .is('google_meet_link', null);

  if (selectErr) {
    return NextResponse.json({ ok: false, error: selectErr.message }, { status: 500 });
  }

  const total = orfaos?.length ?? 0;
  const resultados: Array<{ id: string; eventId: string; status: 'recuperado' | 'sem_link' | 'erro'; motivo?: string }> = [];

  for (const row of (orfaos ?? [])) {
    try {
      const resp = await calendar.events.get({ calendarId, eventId: row.google_event_id });
      const meetLink = extractMeetLink(resp.data);

      if (meetLink) {
        const { error: updateErr } = await (sb as any)
          .from('candidate_agendamentos')
          .update({ google_meet_link: meetLink })
          .eq('id', row.id);

        if (updateErr) {
          resultados.push({ id: row.id, eventId: row.google_event_id, status: 'erro', motivo: `update falhou: ${updateErr.message}` });
        } else {
          resultados.push({ id: row.id, eventId: row.google_event_id, status: 'recuperado' });
        }
      } else {
        const confStatus = resp.data.conferenceData?.createRequest?.status?.statusCode ?? 'sem_conferenceData';
        resultados.push({ id: row.id, eventId: row.google_event_id, status: 'sem_link', motivo: confStatus });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      resultados.push({ id: row.id, eventId: row.google_event_id, status: 'erro', motivo: msg });
    }
  }

  const recuperados = resultados.filter((r) => r.status === 'recuperado').length;
  const semLink     = resultados.filter((r) => r.status === 'sem_link');
  const erros       = resultados.filter((r) => r.status === 'erro');

  return NextResponse.json({
    ok: true,
    total_encontrado: total,
    total_recuperado: recuperados,
    total_sem_link: semLink.length,
    total_erro: erros.length,
    sem_link: semLink,
    erros,
  });
}
