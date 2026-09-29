"use client";

import { useState } from "react";
import { CheckCircle2, Download, Palette, Search } from "lucide-react";
import { ENTREGAS_PUBLICADAS, ENTREGAS_REVIEWED_AT, ENTREGA_STATUS, PENDENCIAS_ENTREGAS } from "@/lib/pessoas/pendencias-entregas";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const PRIORITIES = { urgente: "Urgente", alta: "Alta", normal: "Normal" } as const;
const PRIORITY_ORDER = { urgente: 0, alta: 1, normal: 2 } as const;

export function EntregasClient() {
  const [area, setArea] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const items = PENDENCIAS_ENTREGAS.filter(item => (!area || item.area === area) && (!status || item.status === status) &&
    normalize(`${item.title} ${item.detail} ${item.owner} ${item.nextStep}`).includes(normalize(search.trim())))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  function exportCsv() {
    const cell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [["Área", "Prioridade", "Situação", "Pendência", "Equipe responsável", "Próximo passo", "Critério de conclusão", "Revisão"],
      ...items.map(item => [item.area, PRIORITIES[item.priority], ENTREGA_STATUS[item.status], item.title, item.owner, item.nextStep, item.doneWhen, ENTREGAS_REVIEWED_AT])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `pendencias-plataforma-pipou-${ENTREGAS_REVIEWED_AT}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="rh-deliveries">
    <div className="rh-delivery-heading"><div><h2>O que ainda falta entregar</h2><p>Correções, validações e melhorias que dependem do nosso time e das áreas envolvidas.</p></div>
      <button className="rh-button secondary" onClick={exportCsv} disabled={!items.length}><Download size={16} /> Exportar acompanhamento</button></div>
    <div className="rh-delivery-overview">
      <div><strong>{PENDENCIAS_ENTREGAS.length}</strong><span>Itens acompanhados</span></div>
      <div><strong>{PENDENCIAS_ENTREGAS.filter(item => item.priority === "urgente").length}</strong><span>Correções urgentes</span></div>
      <div><strong>{PENDENCIAS_ENTREGAS.filter(item => item.status === "bloqueado").length}</strong><span>Aguardando liberação</span></div>
    </div>
    <aside className="rh-how rh-brand-status"><Palette size={18} /><p><strong>Identidade visual PIPOU.</strong> A plataforma usa o logo original, Raleway, amarelo e carvão. O portal foi alinhado a esse padrão no código e aguarda acesso ao Netlify para publicação.</p></aside>
    <div className="rh-filters rh-delivery-filters">
      <label className="rh-search"><span className="sr-only">Buscar entrega ou equipe</span><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar entrega ou equipe…" /></label>
      <label>Ambiente<select aria-label="Ambiente" value={area} onChange={event => setArea(event.target.value)}><option value="">Todos os ambientes</option>{["Plataforma", "Portal", "Integração"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Situação<select aria-label="Situação" value={status} onChange={event => setStatus(event.target.value)}><option value="">Todas as situações</option>{Object.entries(ENTREGA_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <div className="rh-list-heading"><h3 aria-live="polite">{items.length} {items.length === 1 ? "item neste filtro" : "itens neste filtro"}</h3>{(area || status || search) && <button className="rh-text-button" onClick={() => { setArea(""); setStatus(""); setSearch(""); }}>Limpar acompanhamento</button>}</div>
    <div className="rh-delivery-list">{items.map(item => <article className="rh-delivery-card" key={item.id}>
      <div className="rh-card-top"><span className={`rh-priority ${item.priority === "normal" ? "media" : "alta"}`}>{PRIORITIES[item.priority]}</span><span>{item.area}</span><span className={`rh-delivery-status ${item.status}`}>{ENTREGA_STATUS[item.status]}</span></div>
      <h3>{item.title}</h3><p>{item.detail}</p>
      <dl><div><dt>Equipe responsável</dt><dd>{item.owner}</dd></div><div><dt>Próximo passo</dt><dd>{item.nextStep}</dd></div></dl>
      <details><summary>Quando considerar concluído</summary><p>{item.doneWhen}</p></details>
    </article>)}</div>
    {!items.length && <div className="rh-empty"><h3>Nenhuma entrega neste filtro</h3><p>Experimente outro ambiente, situação ou termo de busca.</p></div>}
    <section className="rh-delivered" aria-labelledby="rh-delivered-title"><h3 id="rh-delivered-title">Já disponível para o RH</h3><ul>{ENTREGAS_PUBLICADAS.map(item => <li key={item}><CheckCircle2 size={16} />{item}</li>)}</ul></section>
    <footer className="rh-footer">Revisão de {ENTREGAS_REVIEWED_AT.split("-").reverse().join("/")}. Este acompanhamento é atualizado a cada entrega e validação; não é uma verificação automática em tempo real. As pendências de cada colaborador e da competência estão em Rotina do RH.</footer>
  </div>;
}
