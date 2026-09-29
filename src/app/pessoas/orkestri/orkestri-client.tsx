"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RefreshCw, AudioLines, ChevronDown } from "lucide-react";
import { useUnit } from "@kph/auth/context";
import type { OrkestriSnapshot } from "@/lib/pessoas/orkestri-server";
import { turnover, type OrkestriUnit } from "@/lib/pessoas/orkestri-model";

const number = (value: number | null) => value === null ? "—" : value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export function OrkestriClient({ snapshot }: { snapshot: OrkestriSnapshot }) {
  const router = useRouter();
  const { setUnit } = useUnit();
  const [loading, startTransition] = useTransition();
  const [showAll, setShowAll] = useState(false);
  const { summaries, highlights } = snapshot;
  const total = (key: "active" | "departures" | "overdue") => summaries.length && summaries.every(row => row[key] !== null)
    ? summaries.reduce((sum, row) => sum + row[key]!, 0) : null;
  const title = snapshot.selectedUnit ? snapshot.units.find(unit => unit.id === snapshot.selectedUnit)?.name : "Todas as casas";
  const query = (days: number, all: boolean) => `/pessoas/orkestri?periodo=${days}${all ? "&unidades=todas" : ""}`;
  function openSource(unitId: string, href: string) {
    setUnit(unitId);
    router.push(href === "/pessoas/pendencias" ? `${href}?unidade=${encodeURIComponent(unitId)}` : href);
  }
  function changeUnit(id: string) {
    setShowAll(false);
    if (id) setUnit(id);
    startTransition(() => router.push(query(snapshot.days, !id)));
  }
  return <section className="ork-page" aria-busy={loading}>
    <header className="ork-header"><div><p className="ork-eyebrow"><AudioLines size={18} /> Orkestri / Pessoas</p><h1>O que precisa da sua decisão.</h1><p>Uma leitura dos registros de Pessoas, com evidência e próximo passo.</p></div>
      <button className="ork-button" disabled={loading} onClick={() => startTransition(() => router.refresh())}><RefreshCw size={15} />{loading ? "Conferindo…" : "Atualizar leitura"}</button></header>
    <div className="ork-filters"><label>Casas<select value={snapshot.selectedUnit ?? ""} disabled={loading} onChange={event => changeUnit(event.target.value)}><option value="">Todas as casas autorizadas</option>{snapshot.units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
      <label>Movimentações<select value={snapshot.days} disabled={loading} onChange={event => { setShowAll(false); startTransition(() => router.push(query(Number(event.target.value), !snapshot.selectedUnit))); }}><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option></select></label>
      <p>Consultado em {new Date(snapshot.checkedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}<br />{snapshot.period}</p></div>
    {snapshot.errors.length > 0 && <div className="ork-panel ork-warning" role="alert"><strong>Leitura parcial</strong><p>As fontes abaixo não puderam ser conferidas. Dados indisponíveis aparecem como “—”.</p><ul>{snapshot.errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}
    <div className="ork-stats">{[["Colaboradores ativos", number(total("active"))], ["Desligamentos no período", number(total("departures"))], ["Vagas acima do SLA", number(total("overdue"))], ["Pontos para revisão", String(highlights.length)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="ork-section-title"><h2>Prioridades · {title}</h2><span>{summaries.length} {summaries.length === 1 ? "casa consultada" : "casas consultadas"}</span></div>
    <p className="ork-caption">Ordenação: redução de quadro e vagas acima do prazo primeiro; depois cadastros, ausências e horas adicionais. Sugestões baseadas em regras explícitas, sujeitas à avaliação da gestão.</p>
    {!summaries.length ? <div className="ork-panel"><h2>Nenhuma casa autorizada</h2><p>Confira o vínculo de acesso com a gestão.</p></div> : !highlights.length ? <div className="ork-panel"><h2>Nenhum destaque nas regras consultadas</h2><p>{snapshot.errors.length ? "A leitura ainda está incompleta. Atualize as fontes antes de avaliar o resultado." : "Isso não atesta ausência de riscos. Confira também a cobertura das fontes abaixo."}</p></div> : <div className="ork-highlights">{highlights.slice(0, showAll ? undefined : 6).map((item, index) => <article key={item.id} className="ork-panel ork-highlight"><div className="ork-highlight-top"><span>{String(index + 1).padStart(2, "0")} · {item.unitName}</span><small>{item.priority === 1 ? "Revisar primeiro" : "Acompanhar"}</small></div><h3>{item.title}</h3><p>{item.evidence}</p><div className="ork-recommendation"><strong>Próximo passo sugerido</strong><p>{item.recommendation}</p></div><details><summary>Ver evidência e período <ChevronDown size={13} /></summary><p>{item.source}</p><p>{item.id.endsWith(":vagas") ? "Posições ativas na data da consulta." : item.id.endsWith(":pendencias") ? `Cadastro atual; rotinas em ${snapshot.routinePeriod}.` : item.period}</p></details><button className="ork-source" onClick={() => openSource(item.unitId, item.href)}>Conferir na origem <ArrowUpRight size={15} /></button></article>)}</div>}
    {highlights.length > 6 && <button className="ork-button ork-more" onClick={() => setShowAll(value => !value)}>{showAll ? "Mostrar somente os destaques" : `Ver os ${highlights.length} pontos para revisão`}</button>}
    <div className="ork-section-title"><h2>Leitura por casa</h2><span>Mesma janela de movimentações</span></div>
    <div className="ork-table-wrap"><table><caption className="sr-only">Indicadores por unidade autorizada</caption><thead><tr>{["Casa", "Ativos", "Admissões", "Desligamentos", "Turnover", "Vagas acima do SLA", "Pendências RH"].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{summaries.map((unit: OrkestriUnit) => <tr key={unit.id}><th scope="row"><button className="ork-source" onClick={() => changeUnit(unit.id)}>{unit.name}</button></th><td>{number(unit.active)}</td><td>{number(unit.admissions)}</td><td>{number(unit.departures)}</td><td>{turnover(unit) === null ? "—" : `${number(turnover(unit))}%`}</td><td>{number(unit.overdue)}</td><td>{number(unit.pending)}</td></tr>)}</tbody></table></div>
    <p className="ork-caption">Turnover = ((admissões + desligamentos) ÷ 2) ÷ quadro ativo atual × 100. Quadro, vagas e cadastros refletem a situação atual. Não são feitas médias de taxas entre casas.</p>
    <div className="ork-section-title"><h2>Cobertura e limites da leitura</h2></div>
    <div className="ork-coverage"><article className="ork-panel"><h3>Fontes consultadas</h3><p>Colaboradores, vagas, faltas, horas extras e Central de Pendências. A leitura é refeita ao abrir esta aba ou atualizar.</p><p>Os links abrem a rotina na casa do destaque. Em Faltas e Horas Extras, ajuste o mês da tela para conferir a janela desejada.</p></article><article className="ork-panel"><h3>Informações que ainda precisam de integração</h3><p>Custo total de pessoal e faturamento; aprovação da experiência; resultados de engajamento e eNPS; motivos completos dos desligamentos históricos.</p><p>Os registros de horas e faltas não garantem cobertura integral do ponto importado. Esta leitura não estima absenteísmo nem custo a partir desses totais.</p></article></div>
  </section>;
}
