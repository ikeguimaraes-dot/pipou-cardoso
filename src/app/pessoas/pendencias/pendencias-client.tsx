"use client";

import Link from "next/link";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, CheckCircle2, ClipboardList, Download, Layers3, Loader2, RefreshCw, Search, X } from "lucide-react";
import { useUnit } from "@kph/auth/context";
import { CAMPOS_PENDENCIA, periodLabel, validPeriod, type CampoPendencia, type Pendencia, type PendenciasSnapshot, type Rotina } from "@/lib/pessoas/pendencias-model";
import { completarPendencia } from "./actions";
import { EntregasClient } from "./entregas-client";
import { PENDENCIAS_ENTREGAS } from "@/lib/pessoas/pendencias-entregas";

const CATEGORIES = [{ id: "resumo", label: "Por problema" }, { id: "todas", label: "Todas" }, { id: "cadastro", label: "Cadastros" }, { id: "documentos", label: "Documentos" }, { id: "rotinas", label: "Rotinas do mês" }] as const;
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const STATUS: Record<Rotina["status"], string> = { sem_registro: "Sem registro", parcial: "Parcial", registrado: "Com registros", conferir: "Conferir", indisponivel: "Indisponível" };

export function PendenciasClient({ snapshot, initialView = "rh", initialUnit = "" }: { snapshot: PendenciasSnapshot; initialView?: "rh" | "plataforma"; initialUnit?: string }) {
  const [view, setView] = useState(initialView);
  function changeView(next: "rh" | "plataforma") {
    setView(next);
    const url = new URL(window.location.href);
    if (next === "plataforma") url.searchParams.set("visao", next);
    else url.searchParams.delete("visao");
    window.history.replaceState(null, "", url);
  }
  const router = useRouter();
  const { setUnit } = useUnit();
  const [refreshing, startRefresh] = useTransition();
  const [unitId, setUnitId] = useState(initialUnit);
  const [category, setCategory] = useState<string>("todas");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [problemCode, setProblemCode] = useState("");
  const [edit, setEdit] = useState<Pendencia | null>(null);
  const [notice, setNotice] = useState("");
  const [visible, setVisible] = useState(40);

  const scoped = useMemo(() => snapshot.items.filter(item => !unitId || item.unitId === unitId), [snapshot.items, unitId]);
  const filtered = useMemo(() => scoped.filter(item => (category === "todas" || category === "resumo" || item.category === category) && (!problemCode || item.code === problemCode) && (!priority || item.priority === priority) &&
    (!search.trim() || normalize(`${item.employeeName} ${item.title} ${item.unitName} ${item.detail}`).includes(normalize(search.trim())))), [scoped, category, problemCode, priority, search]);
  const problemGroups = useMemo(() => {
    const groups = new Map<string, { code: string; category: Pendencia["category"]; title: string; detail: string; items: Pendencia[] }>();
    for (const item of filtered) {
      const key = `${item.category}:${item.code}:${item.title}`;
      const group = groups.get(key) ?? { code: item.code, category: item.category, title: item.title, detail: item.detail, items: [] };
      group.items.push(item); groups.set(key, group);
    }
    return [...groups.values()].sort((a, b) => b.items.length - a.items.length || a.title.localeCompare(b.title));
  }, [filtered]);
  const routines = snapshot.routines.filter(r => !unitId || r.unitId === unitId);
  const employeeCount = unitId ? snapshot.employeeCounts[unitId] ?? 0 : snapshot.employeeCount;
  const incomplete = new Set(scoped.filter(i => i.category === "cadastro").map(i => i.employeeId)).size;
  const complete = Math.max(0, employeeCount - incomplete);
  const completion = employeeCount ? Math.round(100 * complete / employeeCount) : 0;
  const high = scoped.filter(i => i.priority === "alta").length;

  function navigate(item: Pick<Pendencia, "unitId" | "href">) {
    setUnit(item.unitId);
    router.push(item.href);
  }
  function resetFilters() { setCategory("todas"); setProblemCode(""); setPriority(""); setSearch(""); setVisible(40); }
  function exportCsv(items = filtered, suffix = "fila") {
    const cell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? "'" : "") + value.replace(/"/g, '""')}"`;
    const lines = [["Unidade", "Colaborador / rotina", "Frente", "Prioridade", "Pendência", "Orientação", "Equipe de referência"],
      ...items.map(i => [i.unitName, i.employeeName, i.category, i.priority, i.title, i.detail, i.owner])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + lines.map(row => row.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `pendencias-rh-${suffix}-${snapshot.period}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="rh-pendencias" aria-busy={refreshing}>
    <header className="rh-header"><div><p className="rh-eyebrow">Pipou / Pessoas / RH</p><h1>Central de Pendências</h1>
      <p className="rh-intro">O que falta, onde completar e por onde começar.</p></div>
      <div className="rh-header-actions"><Link className="rh-button secondary" href="/pessoas/importacao-massa">Importar planilha <ArrowUpRight size={16} /></Link><button className="rh-button secondary" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>
        <RefreshCw size={16} className={refreshing ? "rh-spin" : ""} /> Atualizar</button>
        {view === "rh" && <button className="rh-button secondary" disabled={!filtered.length} onClick={() => exportCsv()}><Download size={16} /> Exportar fila</button>}</div>
    </header>

    <nav className="rh-workspace-nav" aria-label="Visões da central">
      <button aria-pressed={view === "rh"} onClick={() => changeView("rh")}><ClipboardList size={17} /><span>Rotina do RH<small>Cadastros, documentos e rotinas do mês</small></span></button>
      <button aria-pressed={view === "plataforma"} onClick={() => changeView("plataforma")}><ArrowUpRight size={17} /><span>Plataforma e portal<small>{PENDENCIAS_ENTREGAS.length} correções, validações e melhorias</small></span></button>
    </nav>
    {view === "plataforma" ? <EntregasClient /> : <>
    {snapshot.errors.length > 0 && <div role="alert" className="rh-alert"><strong>Conferência parcial</strong>{snapshot.errors.map(error => <p key={error}>{error}</p>)}</div>}
    <p className="rh-notice" role="status" aria-live="polite">{notice}</p>
    <div className="rh-summary">
      <div className="rh-metric"><span>Pendências encontradas</span><strong>{scoped.length}</strong><small>Na unidade selecionada ou em toda a sua abrangência</small></div>
      <button className="rh-metric rh-metric-button" onClick={() => { setPriority("alta"); setCategory("todas"); setVisible(40); }}><span>Prioridade alta</span><strong className="rh-high-number">{high}</strong><small>Conferir primeiro <ArrowUpRight size={13} /></small></button>
      <div className="rh-metric"><span>Colaboradores na fila</span><strong>{new Set(scoped.filter(i => i.employeeId).map(i => i.employeeId)).size}</strong><small>De {employeeCount} colaboradores ativos</small></div>
      <div className="rh-metric rh-progress-card"><span>Cadastro básico preenchido</span><strong>{complete}<em> / {employeeCount}</em></strong><progress aria-label="Cadastros sem pendências básicas" max={100} value={completion} /><small>{completion}% sem pendências nas regras de cadastro</small></div>
    </div>

    <div className="rh-how"><CheckCircle2 size={18} /><p><strong>Preencheu, saiu da fila.</strong> As pendências são conferidas nos cadastros e registros. Após completar, atualize a central. Nível de estrutura e divergências de vínculo devem ser conferidos com a gestão.</p></div>

    <div className="rh-filters">
      <label className="rh-search"><span className="sr-only">Buscar colaborador ou pendência</span><Search size={17} /><input value={search} onChange={e => { setSearch(e.target.value); setVisible(40); }} placeholder="Buscar colaborador ou pendência…" /></label>
      <label>Unidade<select aria-label="Unidade" value={unitId} onChange={e => { setUnitId(e.target.value); setVisible(40); }}><option value="">Todas as unidades permitidas</option>{snapshot.units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
      <label>Prioridade<select aria-label="Prioridade" value={priority} onChange={e => { setPriority(e.target.value); setVisible(40); }}><option value="">Todas</option><option value="alta">Alta</option><option value="media">Normal</option></select></label>
      <label>Competência das rotinas<input aria-label="Competência das rotinas" type="month" value={snapshot.period} disabled={refreshing} onChange={e => { if (validPeriod(e.target.value)) startRefresh(() => router.replace(`/pessoas/pendencias?competencia=${e.target.value}`)); }} /></label>
    </div>
    <nav className="rh-tabs" aria-label="Frentes de trabalho">{CATEGORIES.map(tab => <button key={tab.id} aria-pressed={category === tab.id} onClick={() => { setCategory(tab.id); setProblemCode(""); setVisible(40); }}>
      {tab.label}<span>{tab.id === "resumo" ? problemGroups.length : tab.id === "todas" ? scoped.length : scoped.filter(i => i.category === tab.id).length}</span></button>)}</nav>

    {category === "resumo" && <div className="rh-routines"><p className="rh-muted">Pendências iguais agrupadas para priorização e execução em lote. Exporte um grupo para trabalhar externamente ou use a importação em massa quando a correção estiver em uma planilha.</p>
      <div className="rh-routine-grid">{problemGroups.map(group => {
        const people = new Set(group.items.map(item => item.employeeId).filter(Boolean)).size;
        const units = new Set(group.items.map(item => item.unitName));
        const bulk = group.items.some(item => Object.keys(item.fields).length > 0);
        return <article key={`${group.category}:${group.code}:${group.title}`}><div className="rh-card-top"><span>{group.category === "cadastro" ? "Cadastro" : group.category === "documentos" ? "Documentos" : "Rotina mensal"}</span><span className={`rh-priority ${group.items.some(item => item.priority === "alta") ? "alta" : "media"}`}>{group.items.some(item => item.priority === "alta") ? "Alta prioridade" : "Normal"}</span></div><h3>{group.title}</h3><p>{group.items.length} ocorrências · {people || group.items.length} {people === 1 ? "pessoa" : "pessoas/rotinas"} · {units.size} {units.size === 1 ? "unidade" : "unidades"}</p><div className="rh-dialog-actions"><button className="rh-text-button" onClick={() => { setCategory(group.category); setProblemCode(group.code); setVisible(40); }}>Ver casos <ArrowUpRight size={14} /></button><button className="rh-text-button" onClick={() => exportCsv(group.items, group.code)}><Download size={14} /> Exportar</button>{bulk && <Link className="rh-text-button" href={`/pessoas/importacao-massa?pendencia=${encodeURIComponent(group.code)}`}>Corrigir em lote <Layers3 size={14} /></Link>}</div></article>;
      })}</div>
    </div>}

    {category !== "resumo" && <>{category === "rotinas" && <div className="rh-routines"><p className="rh-muted">Competência {periodLabel(snapshot.period)}. Cobertura dos colaboradores atualmente ativos, não PJ, admitidos até o período. Registros não confirmam fechamento, conferência ou pagamento. Gorjetas são acompanhadas nas unidades com histórico.</p>
      <div className="rh-routine-grid">{routines.map(r => <article key={r.id}><div className="rh-card-top"><span>{r.unitName}</span><span className={`rh-status ${r.status}`}>{STATUS[r.status]}</span></div><h3>{r.title}</h3><p>{r.detail}</p><button className="rh-text-button" onClick={() => navigate(r)}>Abrir rotina <ArrowUpRight size={14} /></button></article>)}</div>
    </div>}

    <div className="rh-list-heading"><h2>{category === "rotinas" ? "Rotinas que precisam de atenção" : "Fila de trabalho"} <span>{filtered.length}</span></h2>
      {(search || priority || category !== "todas") && <button className="rh-text-button" onClick={resetFilters}>Limpar filtros <X size={14} /></button>}</div>
    {!snapshot.units.length ? <div className="rh-empty"><h2>Nenhuma unidade autorizada</h2><p>Peça à gestão para conferir o vínculo de acesso do seu usuário.</p></div> : !filtered.length ? <div className="rh-empty"><CheckCircle2 size={30} /><h2>{scoped.length ? "Nenhuma pendência neste filtro" : snapshot.errors.length ? "Conferência ainda incompleta" : "Nenhuma pendência encontrada"}</h2><p>{scoped.length ? "Experimente outra unidade, frente ou termo de busca." : snapshot.errors.length ? "Atualize para tentar carregar as frentes indisponíveis." : "Não há pendências nas regras verificadas para os colaboradores desta abrangência."}</p></div> :
      <div className="rh-work-list">{filtered.slice(0, visible).map(item => <article key={item.id} className="rh-work-card">
        <div className="rh-person"><div className="rh-avatar" aria-hidden="true">{item.employeeId ? item.employeeName.split(" ").slice(0, 2).map(s => s[0]).join("") : <ClipboardList size={20} />}</div><div><strong>{item.employeeName}</strong><span>{item.unitName}</span></div></div>
        <div className="rh-task"><div className="rh-card-top"><span className={`rh-priority ${item.priority}`}>{item.priority === "alta" ? "Alta prioridade" : "Normal"}</span><span>{item.owner}</span></div><h3>{item.title}</h3><p>{item.detail}</p></div>
        <button className="rh-button rh-resolve" onClick={() => Object.keys(item.fields).length ? setEdit(item) : navigate(item)}>{item.action}<ArrowUpRight size={15} /></button>
      </article>)}</div>}
    {filtered.length > visible && <button className="rh-button secondary rh-more" onClick={() => setVisible(v => v + 40)}>Mostrar mais ({filtered.length - visible} restantes)</button>}
    </>}
    <footer className="rh-footer">Conferido em {new Date(snapshot.checkedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · Cadastros e documentos refletem a situação atual; a competência filtra apenas as rotinas. As equipes indicadas são referências de trabalho, sem atribuição individual.</footer>
    </>}
    {edit && <CompletarDialog item={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); setNotice("Informações salvas. Conferindo as pendências restantes…"); startRefresh(() => router.refresh()); }} />}
  </section>;
}

function CompletarDialog({ item, onClose, onSaved }: { item: Pendencia; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const keys = Object.keys(item.fields) as CampoPendencia[];
  const [values, setValues] = useState<Partial<Record<CampoPendencia, string>>>(() => Object.fromEntries(keys.map(key => [key, item.fields[key] ?? ""])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="rh-dialog" aria-labelledby="rh-edit-title" onCancel={e => { e.preventDefault(); if (!saving) onClose(); }}>
    <form onSubmit={async event => {
      event.preventDefault(); setError(""); setSaving(true);
      try {
        const changed = Object.fromEntries(keys.filter(key => values[key]?.trim() && values[key] !== item.fields[key]).map(key => [key, values[key]!]));
        const result = await completarPendencia({ employeeId: item.employeeId, values: changed, expected: item.fields });
        if (result.ok) onSaved(); else setError(result.error);
      } catch { setError("Não foi possível salvar. Tente novamente."); }
      finally { setSaving(false); }
    }}>
      <div className="rh-dialog-header"><div><p className="rh-eyebrow">{item.employeeName}</p><h2 id="rh-edit-title">{item.title}</h2></div><button type="button" className="rh-icon-button" aria-label="Fechar edição" disabled={saving} onClick={onClose}><X size={20} /></button></div>
      <p className="rh-muted">{item.detail}</p><div className="rh-edit-fields">{keys.map(key => <label key={key} htmlFor={`rh-field-${key}`}>{CAMPOS_PENDENCIA[key].label}
        {key === "tipo_contrato" ? <select id={`rh-field-${key}`} value={values[key] ?? ""} disabled={saving} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}><option value="">Selecione</option><option value="CLT">CLT</option><option value="PJ">PJ</option><option value="temporario">Temporário</option><option value="estagiario">Estagiário</option></select> :
          <input id={`rh-field-${key}`} type={CAMPOS_PENDENCIA[key].type} autoComplete="off" maxLength={250} value={values[key] ?? ""} disabled={saving} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} />}</label>)}</div>
      {error && <p className="rh-error" role="alert">{error}</p>}
      <div className="rh-dialog-actions"><button type="button" className="rh-button secondary" disabled={saving} onClick={onClose}>Cancelar</button><button className="rh-button" type="submit" disabled={saving}>{saving ? <Loader2 size={16} className="rh-spin" /> : <Check size={16} />}{saving ? "Salvando…" : "Salvar informações"}</button></div>
    </form>
  </dialog>;
}
