"use client";
import { useState } from "react";
import { initialImport } from "./actions";
import { INITIAL_COLUMNS } from "@/lib/pessoas/initial-import";
export function InitialImportClient({units}:{units:{id:string;name:string}[]}) {
  const [unitId,setUnit]=useState(""); const [text,setText]=useState(""); const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<Awaited<ReturnType<typeof initialImport>>|null>(null);
  async function run(commit:boolean) {setBusy(true);try{setResult(await initialImport({unitId,text},commit));}catch{setResult({ok:false,error:"Não foi possível concluir. Tente novamente."});}finally{setBusy(false);}}
  return <div className="grid max-w-3xl gap-5">
    <a className="text-[var(--brand)]" download="modelo-colaboradores.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent('\uFEFF'+INITIAL_COLUMNS.join(';')+'\r\n')}`}>Baixar modelo CSV</a>
    <label className="grid gap-2">Unidade<select className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3" disabled={busy} value={unitId} onChange={e=>{setUnit(e.target.value);setResult(null);}}><option value="">Selecione</option>{units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
    <label className="grid gap-2">Arquivo CSV UTF-8<input type="file" accept=".csv,text/csv" disabled={busy} onChange={async e=>{setResult(null);setText("");const f=e.target.files?.[0];if(f){if(f.size>500000){setResult({ok:false,error:"Limite de 500 KB."});return;}setText(await f.text());}}}/></label>
    <p>Até 200 novos colaboradores ativos por arquivo. Admissão em DD/MM/AAAA ou AAAA-MM-DD. Salário sem separador de milhar; se não informado, será registrado como zero e deverá ser revisado antes da folha. Cadastros existentes são preservados; este fluxo não importa desligados nem históricos de ponto.</p>
    <button className="rounded-lg border border-[var(--border)] p-3" disabled={busy||!unitId||!text} onClick={()=>run(false)}>Conferir prévia</button>
    {result && !result.ok && <p role="alert">{result.error}</p>}
    {result?.ok && <><p role="status">{result.committed ? `${result.count} colaboradores importados.` : `${result.count} novos colaboradores prontos para conferência.`}</p>
      <table><thead><tr><th>Nome</th><th>Função</th><th>Admissão</th></tr></thead><tbody>{result.preview.map((r,i)=><tr key={i}><td>{r.nome}</td><td>{r.funcao}</td><td>{r.admissao}</td></tr>)}</tbody></table>
      {!result.committed && <button className="rounded-lg bg-[var(--brand)] p-3 font-semibold text-black" disabled={busy} onClick={()=>run(true)}>Confirmar importação de {result.count} colaboradores</button>}</>}
  </div>;
}
