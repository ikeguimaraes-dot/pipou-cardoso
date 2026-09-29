"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { PipouLoginScene } from "./PipouLoginScene";

export function LoginForm({ next = "/pessoas" }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/auth/login-action", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Erro ao fazer login.");
        setPending(false);
        return;
      }

      // Navegação completa (relativa — permanece no domínio de entrada,
      // hub ou subdomínio) — garante que o cookie recém-gravado seja enviado
      window.location.href = next;
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setPending(false);
    }
  }

  return <PipouLoginScene>
    <form className="pipou-login-form" onSubmit={handleSubmit} aria-busy={pending}>
      <div><label htmlFor="pipou-email">E-mail</label><input id="pipou-email" type="email" name="email" autoComplete="email" required disabled={pending} placeholder="voce@empresa.com.br" /></div>
      <div><label htmlFor="pipou-password">Senha</label><div className="pipou-login-password">
        <input id="pipou-password" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" required disabled={pending} placeholder="Digite sua senha" />
        <button type="button" disabled={pending} onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </div></div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={pending}><span>{pending ? "Entrando…" : "Entrar"}</span>{pending ? <Loader2 size={17} /> : <ArrowRight size={17} aria-hidden="true" />}</button>
    </form>
  </PipouLoginScene>;
}
