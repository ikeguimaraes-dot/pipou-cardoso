import { toE164Br, isNumeroWhatsAppValido } from './utils';

type SendResult = { ok: boolean; messageSid?: string };

/**
 * Envia mensagem WhatsApp via Maya backend usando Twilio Content API.
 * Nunca lança exceção — falhas são logadas e retornam { ok: false }.
 *
 * @param telefone  Número canônico BR (11 dígitos, saída de normalizarTelefone)
 * @param templateEnvVar  Nome da env var que contém o Twilio Content SID
 * @param variables  Variáveis do template (chaves "1", "2", ... conforme posições)
 */
export async function enviarWhatsApp({
  telefone,
  templateEnvVar,
  variables,
}: {
  telefone: string;
  templateEnvVar: string;
  variables: Record<string, string>;
}): Promise<SendResult> {
  if (!isNumeroWhatsAppValido(telefone)) {
    console.warn(`[enviarWhatsApp] número inválido: ${telefone}`);
    return { ok: false };
  }

  const templateSid = process.env[templateEnvVar];
  if (!templateSid) {
    console.warn(`[enviarWhatsApp] ${templateEnvVar} não configurado — envio ignorado`);
    return { ok: false };
  }

  const mayaUrl = process.env.MAYA_BACKEND_URL;
  const statusCallback = process.env.TWILIO_STATUS_CALLBACK_URL;
  if (!mayaUrl || !statusCallback) return { ok: false };

  try {
    const res = await fetch(`${mayaUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: toE164Br(telefone),
        operator_name: 'Pipou',
        content_sid: templateSid,
        content_variables: variables,
        status_callback: statusCallback,
      }),
    });

    if (!res.ok) {
      console.error(`[enviarWhatsApp] Maya ${res.status} — ${templateEnvVar}`);
      return { ok: false };
    }

    const data = await res.json() as { ok: boolean; message_sid?: string };
    return { ok: data.ok, messageSid: data.message_sid };
  } catch (err) {
    console.error(`[enviarWhatsApp] erro (${templateEnvVar}):`, err);
    return { ok: false };
  }
}
