// Server Component — force-dynamic garante que o HTML é gerado fresh a
// cada request, com o action ID do deploy atual. Sem isso, a página é
// estática (○) e a CDN serve HTML cacheado com action ID antigo → 500.
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { LoginForm } from "./login-form";

// Só destinos internos — evita open redirect via ?next=
function safeNext(next: string | string[] | undefined): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/pessoas";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const destination = safeNext(next);

  // Fast-path: sessão já existe neste domínio → pular o formulário.
  // Sem isso, quem entra pelo hub e já logou vê o form de novo a cada visita.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // Página pública: refresh de token fica por conta do middleware
        setAll: () => {},
      },
    });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) redirect(destination);
  }

  return <LoginForm next={destination} />;
}
