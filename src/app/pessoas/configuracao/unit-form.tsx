"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUnit } from "./actions";
export function UnitForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  return <form className="grid max-w-xl gap-4 rounded-xl border border-[var(--border)] p-6" onSubmit={async e => {
    e.preventDefault(); const el = e.currentTarget; setBusy(true);
    try {
      const result = await createUnit(new FormData(el));
      setMessage(result.error ?? "Unidade cadastrada. Ela já está disponível no seletor lateral.");
      if (result.ok) { el.reset(); router.refresh(); }
    } catch { setMessage("Não foi possível cadastrar a unidade. Tente novamente."); }
    finally { setBusy(false); }
  }}>
    <h2 className="text-xl font-semibold">Cadastrar unidade</h2>
    {[['brand','Empresa ou marca'],['name','Nome da unidade'],['cnpj','CNPJ (opcional)']].map(([key,label]) => <label className="grid gap-2" key={key}>{label}<input className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3" name={key} required={key !== 'cnpj'} maxLength={key === 'cnpj' ? 18 : 120} disabled={busy} /></label>)}
    <button className="rounded-lg bg-[var(--brand)] p-3 font-semibold text-black" disabled={busy}>{busy ? "Salvando…" : "Cadastrar unidade"}</button>
    <p role="status">{message}</p>
  </form>;
}
