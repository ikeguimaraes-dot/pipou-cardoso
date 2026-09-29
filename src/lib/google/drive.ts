import { google } from 'googleapis';

const MEET_ROOT_FOLDER_ID = '15KXGUYKudMuv9-3rWky1wwD8mQxkLh8x';

function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

// Separa Observações e Transcrição usando o emoji 📖 como marcador de aba.
// Fallback 1: \n📖 (variação de whitespace)
// Fallback 2: padrão "- Transcrição\r?\n00:00:"
// Retorna null se nenhum separador for encontrado — o caller deve lançar erro explícito.
function splitAbas(text: string): { observacoes: string; transcricao: string } | null {
  const emojiIdx = text.indexOf('📖');
  if (emojiIdx !== -1) {
    return { observacoes: text.slice(0, emojiIdx).trim(), transcricao: text.slice(emojiIdx).trim() };
  }
  const nlIdx = text.indexOf('\n📖');
  if (nlIdx !== -1) {
    return { observacoes: text.slice(0, nlIdx).trim(), transcricao: text.slice(nlIdx + 1).trim() };
  }
  const m = text.match(/- Transcrição\r?\n00:00:/);
  if (m?.index !== undefined) {
    return { observacoes: text.slice(0, m.index).trim(), transcricao: text.slice(m.index).trim() };
  }
  return null;
}

export type TranscricaoResult = {
  docId: string;
  observacoes: string;
  transcricao: string;
};

// Converte ISO UTC em "YYYY/MM/DD HH:MM" no fuso UTC-3 (padrão do nome de pasta do Google Meet).
// Usado como fallback quando o título do evento não bate (ex: evento criado antes do fix do título).
function dataHoraParaSufixoPasta(dataHoraUtc: string): string {
  const d = new Date(dataHoraUtc);
  const br = new Date(d.getTime() - 3 * 60 * 60 * 1000); // UTC-3
  const yyyy = br.getUTCFullYear();
  const mm   = String(br.getUTCMonth() + 1).padStart(2, '0');
  const dd   = String(br.getUTCDate()).padStart(2, '0');
  const hh   = String(br.getUTCHours()).padStart(2, '0');
  const min  = String(br.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

// Dado o título do evento do Google Calendar (ex: "[Pipou] Entrevista — Pich Rich — Chef de Bar"),
// localiza a subpasta no Meet root cujo nome começa com esse título, encontra o Doc
// "... - Anotações do Gemini" dentro dela e exporta o conteúdo como texto puro, splitado por aba.
// Fallback: se o match por título falhar, casa pelo sufixo de data/hora do agendamento
// (formato "YYYY/MM/DD HH:MM" que o Google Meet sempre inclui no nome da pasta).
export async function encontrarEExportarTranscricao(
  eventoTitulo: string,
  dataHoraUtc?: string,
): Promise<TranscricaoResult> {
  const auth = getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });

  // Passo 1: listar subpastas no Meet root e encontrar a que corresponde ao evento
  const foldersResp = await drive.files.list({
    q: `'${MEET_ROOT_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'createdTime desc',
    pageSize: 100,
  });

  const subfolders = foldersResp.data.files ?? [];

  // Tentativa 1: match pelo título do evento (prefixo do nome da pasta)
  let subfolder = subfolders.find((f) => f.name?.startsWith(eventoTitulo));

  // Tentativa 2: match pelo sufixo de data/hora (YYYY/MM/DD HH:MM) — mais estável que o título
  if (!subfolder && dataHoraUtc) {
    const sufixo = dataHoraParaSufixoPasta(dataHoraUtc);
    subfolder = subfolders.find((f) => f.name?.includes(sufixo));
  }

  if (!subfolder?.id) {
    const preview = subfolders.slice(0, 5).map((f) => `"${f.name}"`).join(', ');
    const fallbackInfo = dataHoraUtc ? ` | Sufixo data/hora tentado: "${dataHoraParaSufixoPasta(dataHoraUtc)}"` : '';
    throw new Error(
      `Subpasta não encontrada para o evento "${eventoTitulo}"${fallbackInfo}. ` +
      `Pastas mais recentes: ${preview || '(nenhuma)'}. Verifique se o Gemini já gerou o Doc.`,
    );
  }

  // Passo 2: dentro da subpasta, localizar o Doc Anotações do Gemini
  const filesResp = await drive.files.list({
    q: `'${subfolder.id}' in parents and mimeType = 'application/vnd.google-apps.document' and trashed = false`,
    fields: 'files(id, name)',
  });

  const doc = (filesResp.data.files ?? []).find((f) => f.name?.includes('Anotações do Gemini'));
  if (!doc?.id) {
    throw new Error(
      `Doc "Anotações do Gemini" não encontrado em "${subfolder.name}". ` +
      `A reunião pode ter sido muito curta ou o Gemini não estava ativo.`,
    );
  }

  // Passo 3: exportar como texto puro (drive.readonly basta, sem Docs API)
  const exportResp = await drive.files.export(
    { fileId: doc.id, mimeType: 'text/plain' },
    { responseType: 'text' },
  );
  const text = exportResp.data as string;

  // Passo 4: separar abas pelo emoji 📖 (marcador da aba Transcrição)
  const abas = splitAbas(text);
  if (!abas) {
    throw new Error(
      `Separador de aba (📖) não encontrado no Doc "${doc.name}". ` +
      `O Google pode ter alterado o formato de exportação do Doc.`,
    );
  }

  return { docId: doc.id, observacoes: abas.observacoes, transcricao: abas.transcricao };
}
