import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';

// Extrai o meeting code do link e retorna no formato spaces/<code>
function meetLinkToSpaceName(meetLink: string): string | null {
  const match = meetLink.match(/meet\.google\.com\/([a-z0-9\-]+)(?:\?.*)?$/i);
  return match ? `spaces/${match[1]}` : null;
}

// Habilita auto-transcrição, smart notes e gravação no Meet space.
// Falha silenciosa: o agendamento continua válido independente do resultado.
async function configurarMeetArtifacts(
  auth: ReturnType<typeof getOAuth2Client>,
  meetLink: string,
): Promise<void> {
  const pathName = meetLinkToSpaceName(meetLink);
  if (!pathName) {
    console.warn('[Meet:artifacts] Não foi possível extrair space name do link:', meetLink);
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meet = google.meet({ version: 'v2', auth }) as any;

  // GET → nome canônico (ex.: spaces/KlaAPSzax28B), diferente do meeting code
  let canonicalName: string;
  try {
    const getResp = await meet.spaces.get({ name: pathName });
    canonicalName = getResp.data.name;
    if (!canonicalName) throw new Error('name ausente na resposta do spaces.get');
  } catch (err) {
    console.error('[Meet:artifacts] spaces.get falhou, patches cancelados:', (err as Error).message);
    return;
  }

  // Cada artifact tem máscara atômica independente — falha isolada por campo
  const patches: Array<{ label: string; mask: string; body: object }> = [
    {
      label: 'transcrição',
      mask: 'config.artifactConfig.transcriptionConfig.autoTranscriptionGeneration',
      body: { config: { artifactConfig: { transcriptionConfig: { autoTranscriptionGeneration: 'ON' } } } },
    },
    {
      label: 'smart notes',
      mask: 'config.artifactConfig.smartNotesConfig.autoSmartNotesGeneration',
      body: { config: { artifactConfig: { smartNotesConfig: { autoSmartNotesGeneration: 'ON' } } } },
    },
    {
      label: 'gravação',
      mask: 'config.artifactConfig.recordingConfig.autoRecordingGeneration',
      body: { config: { artifactConfig: { recordingConfig: { autoRecordingGeneration: 'ON' } } } },
    },
  ];

  for (const p of patches) {
    try {
      await meet.spaces.patch({
        name: canonicalName,
        updateMask: p.mask,
        requestBody: p.body,
      });
      console.log(`[Meet:artifacts] ${p.label} habilitada em ${canonicalName}`);
    } catch (err) {
      console.error(`[Meet:artifacts] patch ${p.label} falhou:`, (err as Error).message);
    }
  }
}

export function isGoogleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

// Prefer hangoutLink (populated even when entryPoints is still pending)
function extractMeetLink(event: calendar_v3.Schema$Event): string | null {
  return (
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === 'video')?.uri ??
    null
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type CalendarEventParams = {
  titulo: string;
  descricao: string;
  local: string | null;
  dataHoraInicio: string; // ISO string
  duracaoMin: number;
  modalidade: 'presencial' | 'video' | 'telefone' | null;
  convidados: string[]; // emails
};

export async function criarEventoCalendar(
  params: CalendarEventParams
): Promise<{ eventId: string; meetLink: string | null }> {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });
  const calendarId = process.env.GOOGLE_CALENDAR_ID ?? 'primary';

  const inicio = new Date(params.dataHoraInicio);
  const fim = new Date(inicio.getTime() + params.duracaoMin * 60_000);

  const isVideo = params.modalidade === 'video';

  // [DIAG-MEET] ponto 1: valor cru antes de montar o body
  console.log('[DIAG-MEET] 1/3 modalidade:', JSON.stringify(params.modalidade), '| typeof:', typeof params.modalidade, '| isVideo:', isVideo);

  const eventBody: calendar_v3.Schema$Event = {
    summary: params.titulo,
    description: params.descricao,
    start: { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
    end:   { dateTime: fim.toISOString(),   timeZone: 'America/Sao_Paulo' },
    attendees: params.convidados.map((email) => ({ email })),
  };

  if (params.local) eventBody.location = params.local;

  if (isVideo) {
    eventBody.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const insertParams = {
    calendarId,
    requestBody: eventBody,
    conferenceDataVersion: 1 as const, // fixo — passando 1 sem conferenceData no body é inofensivo
    sendUpdates: 'all' as const,
  };

  // [DIAG-MEET] ponto 2: requestBody completo antes do insert
  console.log('[DIAG-MEET] 2/3 insertParams:', JSON.stringify(insertParams));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resp: any;
  try {
    resp = await calendar.events.insert(insertParams);
  } catch (err) {
    console.error('[DIAG-MEET] insert lançou exceção:', err);
    throw err;
  }

  // [DIAG-MEET] ponto 3: resp.data completo após insert
  console.log('[DIAG-MEET] 3/3 resp.data:', JSON.stringify(resp.data));

  const eventId = resp.data.id!;
  let meetLink = extractMeetLink(resp.data);

  // Google provisiona a conferência de forma assíncrona: a resposta do insert pode
  // vir com status "pending" e sem entryPoints. Retry com backoff curto.
  if (isVideo && !meetLink) {
    const delays = [800, 1500, 2500];
    for (const delay of delays) {
      await sleep(delay);
      try {
        const retry = await calendar.events.get({ calendarId, eventId });
        console.log('[DIAG-MEET] retry resp.data:', JSON.stringify(retry.data?.conferenceData ?? null));
        meetLink = extractMeetLink(retry.data);
        if (meetLink) break;
      } catch (err) {
        console.error('[DIAG-MEET] retry events.get falhou:', err);
        break;
      }
    }

    if (!meetLink) {
      const status = resp.data.conferenceData?.createRequest?.status?.statusCode;
      console.warn('[DIAG-MEET] Meet link ausente após retries. eventId=', eventId, 'conferenceStatus=', status);
    }
  }

  // Configura auto-transcrição, smart notes e gravação no space criado.
  // Não bloqueia o retorno — falha no patch não aborta o agendamento.
  if (isVideo && meetLink) {
    configurarMeetArtifacts(auth, meetLink).catch((err) =>
      console.error('[Meet:artifacts] erro inesperado fora dos patches:', (err as Error).message),
    );
  }

  return { eventId, meetLink };
}

export async function atualizarEventoCalendar(
  eventId: string,
  params: {
    dataHoraInicio?: string;
    duracaoMin?: number;
    local?: string | null;
    convidados?: string[];
  }
): Promise<void> {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });

  const patch: calendar_v3.Schema$Event = {};

  if (params.local !== undefined) patch.location = params.local ?? '';
  if (params.convidados) patch.attendees = params.convidados.map((email) => ({ email }));

  if (params.dataHoraInicio && params.duracaoMin) {
    const inicio = new Date(params.dataHoraInicio);
    const fim = new Date(inicio.getTime() + params.duracaoMin * 60_000);
    patch.start = { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' };
    patch.end   = { dateTime: fim.toISOString(),   timeZone: 'America/Sao_Paulo' };
  }

  await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    eventId,
    requestBody: patch,
    sendUpdates: 'all',
  });
}

export async function cancelarEventoCalendar(eventId: string): Promise<void> {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    eventId,
    sendUpdates: 'all',
  });
}

export async function getEventSummary(eventId: string): Promise<string | null> {
  try {
    const auth = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth });
    const resp = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
      eventId,
    });
    return resp.data.summary ?? null;
  } catch {
    return null;
  }
}
