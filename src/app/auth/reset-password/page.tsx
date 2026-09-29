"use client";
import { useState } from "react";
import { getBrowserClient } from "@kph/db/supabase/client";
import { PipouLoginScene } from "../login/PipouLoginScene";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <PipouLoginScene title="Definir nova senha" description="Use pelo menos oito caracteres." recoveryHref="">
    <form className="pipou-login-form" onSubmit={async e => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const password = String(form.get("password") ?? "");
      if (password !== form.get("confirmation")) { setMessage("As senhas precisam ser iguais."); return; }
      setBusy(true);
      try {
        const client = getBrowserClient();
        if (!client) throw new Error();
        const { data: { user } } = await client.auth.getUser();
        if (!user || new URLSearchParams(window.location.search).has("invalid")) {
          setMessage("Link inválido ou expirado. Solicite um novo link de recuperação."); return;
        }
        const { error } = await client.auth.updateUser({ password });
        if (error) { setMessage("Não foi possível atualizar a senha. Confira os requisitos ou solicite um novo link."); return; }
        await client.auth.signOut();
        window.location.assign("/auth/login");
      } catch { setMessage("Não foi possível atualizar a senha. Tente novamente."); }
      finally { setBusy(false); }
    }}>
      <div><label htmlFor="password">Nova senha</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={busy} /></div>
      <div><label htmlFor="confirmation">Repita a nova senha</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required disabled={busy} /></div>
      <button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar senha"}</button>
      <p role="status">{message}</p><a href="/auth/recover">Solicitar novo link</a>
    </form>
  </PipouLoginScene>;
}
