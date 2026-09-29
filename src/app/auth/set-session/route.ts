import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Route público (/auth/ prefix) — exchangia tokens do browser por Set-Cookie server-side.
// Resolve race condition onde document.cookie do browser client não chega no middleware
// antes da navegação window.location.href = "/".
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const access_token: string | undefined = body?.access_token;
  const refresh_token: string | undefined = body?.refresh_token;

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "tokens required" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return res;
}
