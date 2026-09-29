import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configurados' },
      { status: 500 }
    );
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/google-auth/callback';

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );

  const url = client.generateAuthUrl({
    access_type: 'offline',  // obrigatório para receber refresh_token
    prompt: 'consent',       // obrigatório: força Google a devolver refresh_token mesmo que já autorizado antes
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/meetings.space.settings', // ler/editar configurações de espaços
      'https://www.googleapis.com/auth/meetings.space.created',  // criar e gerenciar espaços criados via Meet API
    ],
  });

  return NextResponse.redirect(url);
}
