// POST /api/webhooks/twilio-status
// Twilio statusCallback — atualiza status de entrega da boas-vindas em candidates.
//
// SEGURANÇA: valida X-Twilio-Signature via HMAC-SHA1. Fail-closed: 403 se inválida.
// Nunca autenticar via requireRoleApi — Twilio não manda cookies.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@kph/db/supabase/server";

export const dynamic = "force-dynamic";

function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  const sorted = Object.keys(params).sort();
  const str = url + sorted.map((k) => k + params[k]).join("");
  const expected = crypto.createHmac("sha1", authToken).update(str, "utf8").digest("base64");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("[twilio-status] TWILIO_AUTH_TOKEN não configurado");
    return new NextResponse("Configuração incompleta", { status: 500 });
  }

  // Reconstrói URL exata que Twilio assinou (host vem do header)
  const host = req.headers.get("host") ?? "";
  const url = `https://${host}/api/webhooks/twilio-status`;
  const signature = req.headers.get("x-twilio-signature") ?? "";

  // Twilio envia form-urlencoded
  const text = await req.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(text).entries()) {
    params[k] = v;
  }

  if (!validateTwilioSignature(authToken, signature, url, params)) {
    console.warn("[twilio-status] assinatura inválida — rejeitado");
    return new NextResponse("Forbidden", { status: 403 });
  }

  const messageSid = params["MessageSid"];
  const messageStatus = params["MessageStatus"];
  const errorCode = params["ErrorCode"] ?? null;

  if (!messageSid || !messageStatus) {
    return new NextResponse("Parâmetros obrigatórios ausentes", { status: 400 });
  }

  // Só persiste status finais (evita ruído de eventos intermediários "sent")
  const FINAL_STATUSES = new Set(["delivered", "read", "undelivered", "failed"]);
  if (!FINAL_STATUSES.has(messageStatus)) {
    return new NextResponse("OK", { status: 200 });
  }

  const sb = createServiceClient();
  if (!sb) {
    console.error("[twilio-status] service client indisponível");
    return new NextResponse("Serviço indisponível", { status: 500 });
  }

  const { error } = await (sb as unknown as { from: (t: string) => any })
    .from("candidates")
    .update({
      welcome_delivery_status: messageStatus,
      welcome_error_code: errorCode,
    })
    .eq("welcome_message_sid", messageSid);

  if (error) {
    console.error("[twilio-status] update falhou:", error.message);
    return new NextResponse("Erro interno", { status: 500 });
  }

  console.info(`[twilio-status] ${messageSid} → ${messageStatus}${errorCode ? ` (${errorCode})` : ""}`);
  return new NextResponse("OK", { status: 200 });
}
