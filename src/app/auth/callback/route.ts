import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!code || !url || !key) return NextResponse.redirect(new URL("/auth/reset-password?invalid=1", req.url));
  const response = NextResponse.redirect(new URL("/auth/reset-password", req.url));
  const client = createServerClient(url, key, { cookies: {
    getAll: () => req.cookies.getAll(),
    setAll: values => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
  } });
  const { error } = await client.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/auth/reset-password?invalid=1", req.url));
  return response;
}
