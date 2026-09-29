"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export type LoginState = { error: string | null; redirectTo?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get("email") as string | null) ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { error: "Serviço indisponível." };

  const cookieStore = await cookies();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email ou senha incorretos." };

  // Não chamar redirect() aqui — em RSC mode (Next-Action) o redirect()
  // fecha o stream antes de commitar os Set-Cookie, causando 500.
  // O cliente navega após receber o RSC 200 com Set-Cookie já gravado.
  return { error: null, redirectTo: "/pessoas" };
}
