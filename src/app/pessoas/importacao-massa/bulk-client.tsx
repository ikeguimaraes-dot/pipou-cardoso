"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useUnit } from "@kph/auth/context";
import { ArrowUpRight, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { CAMPOS_PENDENCIA, type PendenciaUnit } from "@/lib/pessoas/pendencias-model";
import { BULK_COLUMNS, MAX_BULK_ROWS, bulkCsv, readBulkCsv, type BulkPreviewRow } from "@/lib/pessoas/bulk-model";
import { previewBulk, commitBulk, type BulkResult } from "./actions";

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const STATUS = { ready: "Pronto", invalid: "Corrigir", unchanged: "Sem alteração", importado: "Importado", erro: "Não confirmado" };

export function BulkClient({ units }: { units: PendenciaUnit[] }) {
  const { unit, setUnit } = useUnit();
  const [selectedUnit, setSelectedUnit] = useState("");
  const unitId = selectedUnit || (units.some(u => u.id === unit?.id) ? unit!.id : "");
  const [matrix, setMatrix] = useState<string[][] | null>(null);
  const [filename, setFilename] = useState("");
  const [preview, setPreview] = useState<{ unitId: string; rows: BulkPreviewRow[] } | null>(null);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const rows = preview?.unitId === unitId ? preview.rows : [];
  const ready = rows.filter(r => r.status === "ready");
  const readyLabel = `${ready.length} ${ready.length === 1 ? "cadastro" : "cadastros"}`;
  const finished = results.length > 0;
  const unitName = units.find(u => u.id === unitId)?.name ?? "";

  function clearPreview() { setPreview(null); setResults([]); setConfirmed(false); setNotice(""); setError(""); }
  async function read(file: File) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); clearPreview(); setMatrix(null); setFilename(file.name);
    try {
      if (file.size > 2 * 1024 * 1024) throw Error("O arquivo deve ter até 2 MB.");
      let cells: string[][];
      if (/\.csv$/i.test(file.name)) {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
        cells = readBulkCsv(text);
      } else if (/\.xlsx$/i.test(file.name)) {
        const XLSX = await import("xlsx");
        const book = XLSX.read(await file.arrayBuffer(), { type: "array", sheetRows: MAX_BULK_ROWS + 2, cellFormula: true, dateNF: "yyyy-mm-dd" });
        if (book.SheetNames.length !== 1) throw Error("Use um arquivo com apenas uma aba de dados. Baixe o modelo para começar.");
        const sheet = book.Sheets[book.SheetNames[0]!]!;
        const range = XLSX.utils.decode_range(sheet["!fullref"] ?? sheet["!ref"] ?? "A1");
        if (range.e.r > MAX_BULK_ROWS || range.e.c >= 17) throw Error("A planilha ultrapassa o limite de 200 linhas ou as colunas do modelo.");
        if (Object.values(sheet).some(cell => cell && typeof cell === "object" && "f" in cell)) throw Error("A planilha contém fórmulas. Cole somente os valores antes de enviar.");
        cells = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "", blankrows: true });
      } else throw Error("Selecione CSV UTF-8 ou Excel .xlsx.");
      while (cells.length && cells.at(-1)!.every(v => !String(v).trim())) cells.pop();
      if (cells.length < 2 || cells.length > MAX_BULK_ROWS + 1) throw Error("Use entre 1 e 200 linhas de dados por arquivo.");
      if (new TextEncoder().encode(JSON.stringify(cells)).length > 450_000) throw Error("O conteúdo do arquivo é muito grande. Divida em lotes menores.");
      setMatrix(cells);
    } catch (e) { setError(e instanceof Error ? (e instanceof TypeError ? "Não foi possível ler o arquivo. Salve como CSV UTF-8 ou .xlsx e tente novamente." : e.message) : "Não foi possível ler o arquivo."); }
    finally { busyRef.current = false; setBusy(false); if (input.current) input.current.value = ""; }
  }
  async function check() {
    if (!matrix || !unitId || busyRef.current) return;
    setSelectedUnit(unitId);
    busyRef.current = true; setBusy(true); clearPreview();
    try {
      const result = await previewBulk({ unitId, matrix });
      if (!result.ok) setError(result.error);
      else { setPreview({ unitId, rows: result.rows }); setNotice("Prévia conferida. Nenhuma informação foi gravada."); }
    } catch { setError("A consulta não foi concluída. Tente conferir novamente; nenhum dado foi enviado para gravação."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  async function save() {
    if (!confirmed || !ready.length || !preview || preview.unitId !== unitId || finished || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    const collected: BulkResult[] = [];
    try {
      for (let i = 0; i < ready.length; i += 10) {
        const batch = ready.slice(i, i + 10).map(({ line, cpf, employeeId, values, expected }) => ({ line, cpf, employeeId, values, expected }));
        setNotice(`Processando ${i + 1}–${Math.min(i + 10, ready.length)} de ${ready.length}. Mantenha esta página aberta.`);
        const result = await commitBulk({ unitId: preview.unitId, rows: batch });
        if (!result.ok) throw Error(result.error);
        collected.push(...result.results); setResults([...collected]);
      }
      setNotice(`Conferência concluída: ${collected.filter(r => r.status === "importado").length} de ${ready.length} cadastros atualizados. Veja o resultado por linha.`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Não foi possível confirmar o envio.";
      setError(`${message} Os itens já confirmados foram mantidos. Gere nova prévia antes de reenviar.`);
      setResults([...collected, ...ready.filter(r => !collected.some(c => c.line === r.line)).map(r => ({ line: r.line, status: "erro" as const, message: "Resultado não confirmado. Gere nova prévia para conferir o cadastro atual." }))]);
    } finally { setConfirmed(false); busyRef.current = false; setBusy(false); }
  }
  function report() {
    download("resultado-importacao-pipou.csv", bulkCsv([["Linha", "Unidade", "Colaborador", "CPF", "Situação", "Detalhes"], ...rows.map(r => {
      const result = results.find(x => x.line === r.line);
      return [String(r.line), unitName, r.name ?? "", r.cpf, STATUS[result?.status ?? r.status], result?.message ?? r.message];
    })]));
  }
  return <section className="rh-bulk" aria-busy={busy}>
    <header className="bulk-header"><div><p className="bulk-eyebrow">Pipou / Pessoas / RH</p><h1>Importação em massa</h1><p>Uma planilha, vários cadastros completos. Confira antes de salvar.</p></div><Link className="bulk-button secondary" href="/pessoas/pendencias">Voltar às pendências <ArrowUpRight size={16} /></Link></header>
    <div className="bulk-steps" aria-label="Etapas"><span>01 · Escolher unidade e arquivo</span><span>02 · Conferir a prévia</span><span>03 · Confirmar e acompanhar</span></div>
    <div className="bulk-panel"><div className="bulk-section-title"><FileSpreadsheet size={22} /><div><h2>Completar cadastros</h2><p>CPF identifica os colaboradores ativos da unidade. Esta carga preenche campos pendentes; os dados já preenchidos são preservados. Novas admissões e correções de CPF são feitas em Colaboradores.</p></div></div>
      <div className="bulk-controls"><label>Unidade do arquivo<select value={unitId} disabled={busy} onChange={e => { setSelectedUnit(e.target.value); clearPreview(); }}><option value="">Escolha a unidade</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
      <button className="bulk-button secondary" onClick={() => download("modelo-cadastros-pipou.csv", bulkCsv([BULK_COLUMNS]))}><Download size={16} /> Baixar modelo CSV</button></div>
      {!units.length && <p role="alert">Nenhuma unidade disponível com permissão de RH.</p>}
      <div className="bulk-drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length !== 1) { if (!busy) setError("Envie um arquivo por vez."); return; } void read(e.dataTransfer.files[0]!); }}>
        <Upload size={28} /><strong>{filename || "Arraste sua planilha para cá"}</strong><p>CSV UTF-8 ou Excel .xlsx · até 2 MB e 200 colaboradores · uma unidade por arquivo</p>
        <button className="bulk-button secondary" disabled={busy} onClick={() => input.current?.click()}>Selecionar arquivo</button><input ref={input} type="file" accept=".csv,.xlsx" aria-label="Arquivo de cadastros" onChange={e => { const file = e.target.files?.[0]; if (file) void read(file); }} hidden />
      </div>
      <p className="bulk-help">Use os títulos do modelo. Mantenha CPF, PIS, telefones e CEP como texto para preservar zeros. Datas: DD/MM/AAAA ou AAAA-MM-DD. Células vazias não apagam dados. Arquivos com fórmulas não são aceitos.</p>
      <button className="bulk-button" disabled={busy || !matrix || !unitId} onClick={check}>{busy ? "Processando…" : finished ? "Gerar nova prévia" : "Conferir arquivo"}</button>
    </div>
    {error && <p className="bulk-alert" role="alert">{error}</p>}{notice && <p className="bulk-notice" role="status">{notice}</p>}
    {!!rows.length && <section className="bulk-panel" aria-label="Prévia da importação"><div className="bulk-header"><div><h2>Prévia · {unitName}</h2><p>Prontos: {ready.length} · Corrigir: {rows.filter(r => r.status === "invalid").length} · Sem alteração: {rows.filter(r => r.status === "unchanged").length}</p></div><button className="bulk-button secondary" disabled={busy} onClick={report}><Download size={16} /> Exportar conferência</button></div>
      <div className="bulk-table-wrap" tabIndex={0} role="region" aria-label="Linhas da planilha"><table><thead><tr><th>Linha / colaborador</th><th>Campos que serão preenchidos</th><th>Situação</th></tr></thead><tbody>{rows.map(r => {
        const result = results.find(x => x.line === r.line); const status = result?.status ?? r.status;
        return <tr key={r.line}><td><strong>{r.line} · {r.name || "Confira o CPF"}</strong><small>{r.cpf}</small></td><td>{Object.entries(r.values).map(([k, value]) => <div key={k}><span>{CAMPOS_PENDENCIA[k as keyof typeof CAMPOS_PENDENCIA].label}: </span><strong>{value}</strong></div>)}{!Object.keys(r.values).length && "—"}</td><td><span className={`bulk-status ${status}`}>{STATUS[status]}</span><p>{result?.message ?? r.message}</p></td></tr>;
      })}</tbody></table></div>
      {!finished && <div className="bulk-confirm"><label><input type="checkbox" checked={confirmed} disabled={busy || !ready.length} onChange={e => setConfirmed(e.target.checked)} />Conferi a unidade {unitName} e os campos de {readyLabel}. Linhas com erro não serão importadas.</label><button className="bulk-button" disabled={busy || !confirmed || !ready.length} onClick={save}><CheckCircle2 size={17} /> Confirmar {readyLabel}</button></div>}
      {finished && <p className="bulk-help">Os resultados são por linha. Cadastros confirmados já alimentam a Central de Pendências. Exporte a conferência antes de sair; esta tela não guarda um histórico de lotes.</p>}
    </section>}
    <section className="bulk-other"><h2>Outros arquivos de Pessoas</h2><p>Use o importador específico de cada rotina e confira o formato solicitado.</p><div>{([
      ["Relatório de ponto", "Resumos mensais em CSV", "/pessoas/relatorio-ponto"],
      ["Ponto Totvs", "Arquivo CSV do Totvs", "/pessoas/importacao"],
      ["Gorjetas", "Planilhas Excel na aba Importar Excel", "/pessoas/gorjetas"],
      ["Currículos", "Envio de currículos ao recrutamento", "/pessoas/recrutamento/importar-cvs"],
    ] as const).map(([title, detail, href]) => <Link key={href} href={href} onClick={() => { if (unitId) setUnit(unitId); }}><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={18} /></Link>)}</div></section>
  </section>;
}
