"use client";
import { useEffect, useRef, useState } from "react";
import { importTalentBatch } from "./actions";
import { readBulkCsv, bulkCsv } from "@/lib/pessoas/bulk-model";
import { TALENT_FIELDS, TALENT_FILE_BYTES, TALENT_FILE_ROWS, TALENT_BATCH_ROWS, planTalentFile, guessTalentColumns, type TalentPlan, type TalentIssue } from "@/lib/pessoas/talent-import";

export function TalentImportClient({units}:{units:{id:string;name:string}[]}) {
  const [unitId,setUnit] = useState("");
  const [sheets,setSheets] = useState<Record<string,string[][]>>({});
  const [sheetName,setSheetName] = useState("");
  const [mapping,setMapping] = useState<string[]>([]);
  const [report,setReport] = useState<TalentIssue[]>([]);
  const [plan,setPlan] = useState<TalentPlan|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [progress,setProgress] = useState(0);
  const [checked,setChecked] = useState(false);
  const [done,setDone] = useState(false);
  const [totals,setTotals] = useState({created:0,skipped:0});
  const stop = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error || (!busy && plan?.issues.length)) feedback.current?.focus();
  }, [error, busy, plan]);
  const style = "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3";
  function clear() {setReport([]);setPlan(null);setChecked(false);setDone(false);setError("");setMessage("");setProgress(0);setTotals({created:0,skipped:0});}
  async function read(file?:File) {
    clear();setSheets({});setSheetName("");if(!file)return;
    setMessage("Lendo a planilha… Aguarde antes de conferir a prévia.");
    setBusy(true);
    try {
      if(file.size>TALENT_FILE_BYTES) throw Error("Limite de 10 MB por arquivo.");
      let next:Record<string,string[][]>;
      if(/\.csv$/i.test(file.name)) next={"CSV":readBulkCsv(await file.text())};
      else if(/\.xlsx$/i.test(file.name)) {
        const XLSX=await import("xlsx");
        const workbook=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true,sheetRows:TALENT_FILE_ROWS+2});
        if(workbook.SheetNames.length>20) throw Error("Use um arquivo com até 20 abas ou salve a aba desejada como CSV.");
        next={};
        for(const name of workbook.SheetNames) {
          const sheet=workbook.Sheets[name];if(!sheet)continue;
          const range=XLSX.utils.decode_range(sheet["!fullref"] ?? sheet["!ref"] ?? "A1");
          if(range.e.r>TALENT_FILE_ROWS || range.e.c>50) throw Error("Uma aba excede 25.000 linhas de dados ou 51 colunas. Remova áreas extras ou exporte apenas a aba desejada.");
          if(Object.values(sheet).some(cell=>cell && typeof cell==="object" && "f" in cell)) throw Error("A planilha contém fórmulas. Salve uma cópia somente com os valores antes de importar.");
          next[name]=XLSX.utils.sheet_to_json<string[]>(sheet,{header:1,raw:false,defval:"",blankrows:true,dateNF:"yyyy-mm-dd"});
        }
      } else throw Error("Selecione CSV UTF-8 ou Excel .xlsx.");
      const first=Object.keys(next)[0];if(!first)throw Error("Arquivo sem planilha.");
      setSheets(next);setSheetName(first);setMapping(guessTalentColumns(next[first]?.[0]??[]));
      setMessage("Arquivo lido. Selecione a unidade e confira a prévia antes de gravar.");
    } catch(e) {setError(e instanceof Error?e.message:"Não foi possível ler o arquivo.");}
    finally {setBusy(false);}
  }
  async function run(commit:boolean) {
    setError("");
    if (!unitId) {setError("Selecione a unidade responsável pelos candidatos antes de conferir a prévia.");return;}
    if (!sheetName) {setError("Selecione um arquivo CSV ou Excel e aguarde a leitura antes de conferir a prévia.");return;}
    setBusy(true);setMessage(commit?"Preparando a importação…":"Validando as colunas e os contatos…");setProgress(0);stop.current=false;
    feedback.current?.scrollIntoView({block:"center",behavior:"smooth"});
    await new Promise<void>(resolve=>setTimeout(resolve,0));
    if(!commit) {setChecked(false);setDone(false);setTotals({created:0,skipped:0});}
    let created=0,skipped=0;
    try {
      const current=commit?plan:planTalentFile(sheets[sheetName]??[],mapping);
      if(!current)throw Error("Confira a prévia primeiro.");
      setPlan(current);
      if(current.issues.length){setMessage("Corrija as linhas indicadas e envie o arquivo novamente. Nenhum cadastro foi gravado.");return;}
      const batches=Array.from({length:Math.ceil(current.rows.length/TALENT_BATCH_ROWS)},(_,i)=>current.rows.slice(i*TALENT_BATCH_ROWS,(i+1)*TALENT_BATCH_ROWS));
      skipped=current.duplicates.length;
      const results:TalentIssue[]=[...current.duplicates];
      setReport(results);
      for(let i=0;i<batches.length;i++) {
        if(stop.current){setMessage("Processamento pausado. Os lotes concluídos foram preservados. Confira a prévia novamente para continuar sem duplicar.");setChecked(false);return;}
        setMessage(`${commit?"Importando":"Conferindo"} lote ${i+1} de ${batches.length}. Mantenha esta página aberta.`);
        const batch=batches[i]!;
        const result=await importTalentBatch({unitId,rows:batch.map(r=>r.values),commit});
        if(!result.ok) throw Error(`Lote ${i+1}: ${result.error}`);
        created+=result.created;skipped+=result.skipped;
        result.rows.forEach(r=>results.push({line:batch[r.row-1]!.line,message:r.status==="existing"?"Já cadastrado por e-mail ou telefone; preservado.":r.status==="created"?"Importado no Banco de Talentos.":"Pronto para importar."}));
        setReport([...results]);
        setTotals({created,skipped});setProgress(i+1);
      }
      setChecked(!commit);setDone(commit);
      setMessage(commit?`Importação concluída: ${created} novos candidatos; ${skipped} já cadastrados, preservados.`:`Prévia conferida: ${created} novos candidatos e ${skipped} já cadastrados, que serão preservados.`);
    } catch(e) {
      setChecked(false);
      setError((e instanceof Error?e.message:"Falha de conexão.")+(commit?" Os lotes já concluídos permanecem salvos. Confira a prévia novamente para retomar; os contatos existentes serão preservados.":" Nenhum cadastro foi gravado nesta conferência."));
    } finally {setBusy(false);}
  }
  function downloadIssues() {
    if(!plan)return;
    const url=URL.createObjectURL(new Blob([bulkCsv([["linha","problema"],...[...plan.issues,...report].map(i=>[String(i.line),i.message])])],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download="problemas-importacao.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <div className="grid max-w-4xl gap-5">
    <p>Envie uma única planilha CSV ou Excel de até <strong>10 MB e 25.000 candidatos</strong>. O processamento em lotes é automático, com conferência antes da gravação.</p>
    <p className="text-sm text-[var(--muted)]">Os registros entram no Banco de Talentos, sem vincular vaga, criar colaboradores ou enviar mensagens aos candidatos.</p>
    <a className="text-[var(--brand)]" download="modelo-candidatos.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent('\uFEFF'+Object.keys(TALENT_FIELDS).join(';')+'\r\n')}`}>Baixar modelo de colunas</a>
    <label htmlFor="initial-unit">Unidade</label><select id="initial-unit" className={style} disabled={busy} value={unitId} onChange={e=>{setUnit(e.target.value);clear();}}><option value="">Selecione</option>{units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
    <label htmlFor="initial-file">Arquivo CSV UTF-8 ou Excel</label><input id="initial-file" type="file" accept=".csv,.xlsx" disabled={busy} onChange={e=>void read(e.target.files?.[0])}/>
    {Object.keys(sheets).length>1&&<><label htmlFor="initial-sheet">Aba da planilha</label><select id="initial-sheet" className={style} value={sheetName} disabled={busy} onChange={e=>{setSheetName(e.target.value);setMapping(guessTalentColumns(sheets[e.target.value]?.[0]??[]));clear();}}>{Object.keys(sheets).map(name=><option key={name}>{name}</option>)}</select></>}
    <p className="text-sm">Mapeie Nome completo e pelo menos E-mail ou Telefone com DDD. Colunas marcadas como Ignorar não serão importadas. E-mails ou telefones repetidos são preservados sem sobrescrever cadastros existentes. Cada lote é salvo separadamente; mantenha esta página aberta até concluir.</p>
    {!!sheets[sheetName]?.length&&<fieldset className={style} disabled={busy}><legend className="px-2 font-semibold">Correspondência das colunas</legend><div className="grid gap-3 sm:grid-cols-2">{(sheets[sheetName]?.[0]??[]).map((header,i)=><label className="grid gap-1" key={i}>{header||`Coluna ${i+1}`}<select aria-label={`Destino da coluna ${header||i+1}`} className={style} value={mapping[i]??""} onChange={e=>{setMapping(old=>old.map((f,j)=>i===j?e.target.value:f));clear();}}><option value="">Ignorar coluna</option>{Object.entries(TALENT_FIELDS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>)}</div></fieldset>}
    <div className="flex flex-wrap gap-3"><button className={style} disabled={busy} onClick={()=>void run(false)}>{busy?"Processando…":"Conferir prévia"}</button>
    {checked&&!done&&<button className="rounded-lg bg-[var(--brand)] p-3 font-semibold text-black" disabled={busy||totals.created===0} onClick={()=>void run(true)}>Confirmar importação de {totals.created} candidatos</button>}
    {busy&&plan&&<button className={style} onClick={()=>{stop.current=true;setMessage("Pausa solicitada. Aguardando o lote em andamento terminar.");}}>Pausar após este lote</button>}</div>
    <div ref={feedback} tabIndex={-1} className="rounded-lg border border-[var(--border)] p-4 focus:outline-2 focus:outline-[var(--brand)]">
      <p role="status" aria-live="polite">{message || "Selecione a unidade e o arquivo. Depois, confira a prévia."}</p>
      {error&&<p role="alert" className="mt-2 font-semibold">{error}</p>}
    </div>
    {!!plan?.rows.length&&<div><progress className="w-full accent-[var(--brand)]" aria-label="Lotes processados" max={Math.ceil(plan.rows.length/TALENT_BATCH_ROWS)} value={progress}/><p className="text-sm">{progress} de {Math.ceil(plan.rows.length/TALENT_BATCH_ROWS)} lotes · {plan.total.toLocaleString("pt-BR")} registros no arquivo</p></div>}
    {!!report.length&&<button className="text-left underline" onClick={downloadIssues}>Baixar relatório por linha</button>}
    {!!plan?.issues.length&&<section className={style}><h2 className="font-semibold">{plan.issues.length} problemas para corrigir</h2><button className="my-3 underline" onClick={downloadIssues}>Baixar relatório completo de erros</button><ul>{plan.issues.slice(0,20).map((issue,i)=><li key={i}>Linha {issue.line}: {issue.message}</li>)}</ul></section>}
    {!!plan?.rows.length&&<div className="overflow-x-auto"><p className="mb-3 text-sm">Amostra das primeiras {Math.min(plan.rows.length,20)} linhas válidas do arquivo</p><table className="w-full text-left"><thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th></tr></thead><tbody>{plan.rows.slice(0,20).map(({values:r},i)=><tr key={i}><td className="py-2">{r.full_name}</td><td>{r.email}</td><td>{r.phone}</td></tr>)}</tbody></table></div>}
  </div>;
}
