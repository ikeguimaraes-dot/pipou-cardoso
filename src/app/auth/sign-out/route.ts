// GET /auth/sign-out
// Invalida a sessão Supabase e redireciona para /auth/login.
// Chamado pelo <a href="/auth/sign-out"> do Sidebar e pelo signOut() do AuthContext.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // CRÍTICO: prefetch NÃO pode deslogar. O Next prefetcha Links visíveis e o
  // Chrome pré-carrega URLs da omnibox — um GET executado por prefetch aqui
  // destruía a sessão ~1s depois do login (bug caçado em 2026-07-13).
  const isPrefetch =
    req.headers.get("next-router-prefetch") !== null ||
    req.headers.get("purpose") === "prefetch" ||
    (req.headers.get("sec-purpose") ?? "").includes("prefetch") ||
    req.nextUrl.searchParams.has("_rsc");
  if (isPrefetch) {
    return new NextResponse(null, { status: 204 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Multi-zone: redireciona no host de entrada (hub ou subdomínio)
  const entryHost =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? req.nextUrl.host;
  const entryProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
  const loginUrl = new URL(`${entryProto}://${entryHost}/auth/login`);

  if (url && anonKey) {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    });
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(loginUrl);
}
