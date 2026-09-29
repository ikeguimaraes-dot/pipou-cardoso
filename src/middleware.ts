import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { allowedOrigins } from "@/lib/tenant";

const PUBLIC_PREFIXES = ["/auth/", "/api/webhooks/", "/api/portal-pipou/"];
const PUBLIC_PAGES = ["/cadastro", "/vagas"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");
  const cors: Record<string, string> = origin && allowedOrigins().includes(origin) ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  } : {};
  if (req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: cors });
  const serverAction = req.headers.has("next-action");
  if (!serverAction && (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix)) || PUBLIC_PAGES.some(page => pathname === page || pathname.startsWith(`${page}/`)))) return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: "Ambiente ainda não configurado." }, { status: 503 });
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, anonKey, { cookies: {
    getAll: () => req.cookies.getAll(),
    setAll(values) {
      values.forEach(({ name, value }) => req.cookies.set(name, value));
      res = NextResponse.next({ request: req });
      values.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    },
  } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(login);
  }
  // Initial client release is restricted to the two global administrators.
  // Legacy service-role actions must not be reachable by an unassigned account,
  // including a Server Action posted to a public page.
  const { data: admin, error: roleError } = await supabase.rpc("cardoso_is_admin");
  if (roleError || admin !== true) return NextResponse.json({ error: "Acesso operacional ainda não liberado para este perfil." }, { status: 403 });
  for (const [key, value] of Object.entries(cors)) res.headers.set(key, value);
  return res;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf)$).*)",
    { source: "/:path*", has: [{ type: "header", key: "next-action" }] }],
};
