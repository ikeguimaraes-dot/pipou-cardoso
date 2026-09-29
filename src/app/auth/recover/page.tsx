"use client";
import { useState } from "react";
import { getBrowserClient } from "@kph/db/supabase/client";
import { PipouLoginScene } from "../login/PipouLoginScene";

export default function RecoverPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <PipouLoginScene title="Recuperar acesso" description="Receba um link para definir sua nova senha." recoveryHref="">
    <form className="pipou-login-form" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
      try {
        const client = getBrowserClient();
        if (!client) throw new Error("unavailable");
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback` });
        if (error) throw error;
        setMessage("Se houver uma conta para este e-mail, você receberá as instruções de recuperação.");
      } catch { setMessage("Não foi possível solicitar o link agora. Tente novamente em alguns minutos."); }
      finally { setBusy(false); }
    }}>
      <div><label htmlFor="email">E-mail</label><input id="email" name="email" type="email" autoComplete="email" required disabled={busy} /></div>
      <button disabled={busy} type="submit">{busy ? "Enviando…" : "Solicitar link"}</button>
      <p role="status">{message}</p>
      <a href="/auth/login">Voltar ao login</a>
    </form>
  </PipouLoginScene>;
}
