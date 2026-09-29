import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return new NextResponse(
      `<html><body style="font-family:monospace;padding:40px;background:#1a1a1a;color:#e2e2e2;">
        <h2>Erro: ${error}</h2>
        <p>Verifique as configurações e tente novamente em <a href="/api/google-auth/start" style="color:#60a5fa">/api/google-auth/start</a>.</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code) {
    return new NextResponse('Parâmetro code ausente', { status: 400 });
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/google-auth/callback';

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  try {
    const { tokens } = await client.getToken(code);

    const refreshTokenHtml = tokens.refresh_token
      ? `<pre style="background:#0d2d0d;border:1px solid #22c55e;padding:20px;border-radius:8px;word-break:break-all;font-size:13px;color:#4ade80;">${tokens.refresh_token}</pre>`
      : `<div style="background:#2d1a00;border:1px solid #f59e0b;padding:16px;border-radius:8px;color:#fbbf24;">
          refresh_token não retornado. Isso acontece quando o app já foi autorizado antes.<br><br>
          Solução: <a href="https://myaccount.google.com/permissions" target="_blank" style="color:#60a5fa">revogue o acesso em myaccount.google.com/permissions</a> e tente novamente em modo incógnito.
        </div>`;

    return new NextResponse(
      `<html><body style="font-family:monospace;padding:40px;background:#111;color:#e2e2e2;max-width:900px;margin:0 auto;">
        <h2 style="color:#4ade80;">Autorização concluída!</h2>
        <p>Copie o <strong>GOOGLE_REFRESH_TOKEN</strong> abaixo e adicione como variável de ambiente no Vercel e no <code>.env.local</code>:</p>
        ${refreshTokenHtml}
        <p style="margin-top:24px;color:#888;font-size:12px;">
          Variáveis necessárias no Vercel:<br>
          GOOGLE_CLIENT_ID &middot; GOOGLE_CLIENT_SECRET &middot; GOOGLE_REFRESH_TOKEN &middot; GOOGLE_CALENDAR_ID (= primary) &middot; GOOGLE_REDIRECT_URI
        </p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new NextResponse(
      `<html><body style="font-family:monospace;padding:40px;background:#1a0a0a;color:#fca5a5;">
        <h2>Erro ao trocar código por token</h2>
        <pre>${msg}</pre>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    );
  }
}
