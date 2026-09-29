"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { diasUteisDesde } from "@/lib/pessoas/recrutamento-config";
import "./vagas.css";
import { camposVagaDoJD } from "@/lib/pessoas/vaga-jd";
import { MOTIVOS_VAGA, MOTIVO_VAGA_LABEL, isMotivoVaga, normalizeMotivoVaga } from "@/lib/pessoas/motivos-vaga";
import { Trash2, Briefcase, FileText, Plus, X, ChevronDown, ChevronRight, CheckCircle2, Users, Calendar, TrendingUp } from "lucide-react";
import {
  criarVaga,
  atualizarStatusVaga,
  congelarVaga,
  cancelarVaga,
  descongelarVaga,
  criarJobDescription,
  excluirJobDescription,
  parseJobDescription,
  type VagaRow,
  type VagaStatus,
  type JDRow,
  type JDParsed,
  type DashboardRS,
  type CargoGrupoSel,
  type MotivoEstruturado,
  type FormaContratacao,
} from "./actions";

type Brand = { id: string; name: string };
type EmpSel = { id: string; nome: string };
type Unit = { id: string; name: string };

type Props = {
  vagas: VagaRow[];
  jds: JDRow[];
  brands: Brand[];
  dashboard: DashboardRS;
  candidatesByVaga: Record<string, number>;
  employees: EmpSel[];
  cargoGrupos: CargoGrupoSel[];
  units: Unit[];
};

const AREAS = [
  "Cozinha", "Salão", "Bar", "Gestão", "Administrativo",
  "Compras", "Marketing", "Apoio", "Recepção", "Limpeza", "Outros",
];

const STATUS_OPTIONS: VagaStatus[] = ["aberta", "em_admissao", "congelada", "teste", "fechada", "cancelada"];

const STATUS_LABEL: Record<string, string> = {
  aberta:      "Aberta",
  em_admissao: "Em admissão",
  congelada:   "Congelada",
  teste:       "Teste",
  fechada:     "Fechada",
  cancelada:   "Cancelada",
};

// Turnos disponíveis para seleção múltipla (chips)
const TURNOS_VAGA = ["Manhã", "Tarde", "Noite", "Intermediário", "Madrugada"] as const;

// Motivos ativos no formulário (ordem do dropdown)
const MOTIVOS_FORM = MOTIVOS_VAGA;

// Record<string, string> para acomodar valores legados de registros antigos
const MOTIVO_LABEL: Record<string, string> = MOTIVO_VAGA_LABEL;

const FORMA_LABEL: Record<FormaContratacao, string> = {
  CLT:        "CLT",
  PJ:         "PJ",
  freelance:  "Freelance",
  temporario: "Temporário",
  estagio:    "Estágio",
};

export function VagasClient({ vagas, jds, brands, dashboard, candidatesByVaga, employees, cargoGrupos, units }: Props) {
  const [tab, setTab] = useState<"painel" | "jd" | "requisitar">("painel");
  const [initialJD, setInitialJD] = useState<JDRow | null>(null);
  const abertas = vagas.filter((v) => ["aberta", "em_admissao", "teste"].includes(v.status ?? "") && !v.congelada && !v.cancelada).length;

  const tabs = [
    { key: "painel"     as const, label: `Vagas (${abertas} ativas)`,        icon: <Briefcase size={14} /> },
    { key: "jd"         as const, label: `Job Descriptions (${jds.length})`,  icon: <FileText size={14} />  },
    { key: "requisitar" as const, label: "Nova vaga",                          icon: <Plus size={14} />      },
  ];

  return (
    <div>
      <DashboardWidget dashboard={dashboard} />
      <div className="vagas-navigation">
        <div className="vagas-tabs" aria-label="Visões de recrutamento">
          {tabs.filter(t => t.key !== "requisitar").map(t => <button type="button" key={t.key} aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</button>)}
        </div>
        <button type="button" className="vagas-new" aria-pressed={tab === "requisitar"} onClick={() => { if(tab !== "requisitar") setInitialJD(null); setTab("requisitar"); }}><Plus size={15} aria-hidden="true" />Nova vaga</button>
      </div>
      {tab === "painel"     && <PainelVagas vagas={vagas} brands={brands} candidatesByVaga={candidatesByVaga} employees={employees} />}
      {tab === "jd"         && <BibliotecaJD jds={jds} brands={brands} onUseJD={(jd) => { setInitialJD(jd); setTab("requisitar"); }} />}
      {tab === "requisitar" && <FormRequisicao jds={jds} initialJD={initialJD} brands={brands} employees={employees} cargoGrupos={cargoGrupos} units={units} onSuccess={() => { setInitialJD(null); setTab("painel"); }} />}
    </div>
  );
}

function DashboardWidget({ dashboard }: { dashboard: DashboardRS }) {
  return (
    <div className="vagas-kpis">
      <KpiCard label="Vagas abertas" value={dashboard.abertas} icon={<Briefcase size={16} />} accent />
      <KpiCard label="Candidatos em pipeline" value={dashboard.candidatos} icon={<Users size={16} />} />
      <KpiCard label="Entrevistas esta semana" value={dashboard.entrevistas_semana} icon={<Calendar size={16} />} />
      <KpiCard label="Admissões 90 dias" value={dashboard.admissoes_90d} icon={<TrendingUp size={16} />} />
    </div>
  );
}

function PainelVagas({ vagas, brands, candidatesByVaga, employees }: { vagas: VagaRow[]; brands: Brand[]; candidatesByVaga: Record<string, number>; employees: EmpSel[] }) {
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e.nome]));
  const [search, setSearch] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filterStatus, setFilterStatus] = useState<"ativas" | "todas" | VagaStatus>("ativas");
  const [filterArea, setFilterArea] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [congelarModal, setCongelarModal] = useState<VagaRow | null>(null);
  const [cancelarModal, setCancelarModal] = useState<VagaRow | null>(null);

  function diasAberta(vaga: VagaRow) {
    const ref = vaga.data_solicitacao ?? vaga.created_at;
    return diasUteisDesde(ref?.length === 10 ? `${ref}T12:00:00` : ref);
  }
  function atrasada(vaga: VagaRow) {
    return ["aberta", "em_admissao", "teste"].includes(vaga.status ?? "") && !vaga.congelada && !vaga.cancelada &&
      diasAberta(vaga) > (vaga.cargo_grupos?.sla_dias_uteis ?? vaga.sla_dias ?? 30);
  }
  const overdueCount = vagas.filter(atrasada).length;

  const displayed = vagas.filter((v) => {
    const statusAtivo = ["aberta", "em_admissao", "teste"].includes(v.status ?? "") && !v.congelada && !v.cancelada;
    if (filterStatus === "ativas" && !statusAtivo) return false;
    if (filterStatus !== "ativas" && filterStatus !== "todas" && v.status !== filterStatus) return false;
    if (onlyOverdue && !atrasada(v)) return false;
    if (search && ![v.cargo, v.title, v.units?.name, v.recrutador].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))) return false;
    if (filterArea && v.area !== filterArea) return false;
    if (filterBrand && v.brand_id !== filterBrand) return false;
    return true;
  });

  const areas = [...new Set(vagas.map((v) => v.area).filter(Boolean))].sort() as string[];

  function handleStatus(id: string, newStatus: VagaStatus) {
    setUpdating(id);
    startTransition(async () => { const result = await atualizarStatusVaga(id, newStatus); setActionError(result.ok ? "" : result.error ?? "Não foi possível atualizar a vaga."); setUpdating(null); });
  }

  function handleDescongelar(id: string) {
    setUpdating(id);
    startTransition(async () => { const result = await descongelarVaga(id); setActionError(result.ok ? "" : result.error ?? "Não foi possível retomar a vaga."); setUpdating(null); });
  }

  return (
    <div>
      {/* Modais de congelar / cancelar */}
      {congelarModal && (
        <MotivoModal
          titulo="Congelar vaga"
          descricao={`Vaga "${congelarModal.cargo ?? congelarModal.title}" será congelada e removida do kanban ativo.`}
          acaoBotao="Congelar"
          corBotao="#CA8A04"
          onConfirm={async (motivo) => {
            const r = await congelarVaga(congelarModal.id, motivo);
            if (!r.ok) console.error("[congelarVaga]", r.error);
            setCongelarModal(null);
          }}
          onClose={() => setCongelarModal(null)}
        />
      )}
      {cancelarModal && (
        <MotivoModal
          titulo="Cancelar vaga"
          descricao={`Vaga "${cancelarModal.cargo ?? cancelarModal.title}" será cancelada permanentemente.`}
          acaoBotao="Cancelar vaga"
          corBotao="#DC2626"
          onConfirm={async (motivo) => {
            const r = await cancelarVaga(cancelarModal.id, motivo);
            if (!r.ok) console.error("[cancelarVaga]", r.error);
            setCancelarModal(null);
          }}
          onClose={() => setCancelarModal(null)}
        />
      )}

      <div className="vagas-toolbar">
        <input aria-label="Buscar vagas" placeholder="Buscar cargo, unidade ou responsável" value={search} onChange={e => setSearch(e.target.value)} />
        <select aria-label="Filtrar por status" value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}>
          <option value="ativas">Vagas ativas</option><option value="todas">Todos os status</option>
          {STATUS_OPTIONS.map(status => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
        </select>
        <select aria-label="Filtrar por área" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
          <option value="">Todas as áreas</option>{areas.map(area => <option key={area}>{area}</option>)}
        </select>
        <select aria-label="Filtrar por marca" value={filterBrand} onChange={e => setFilterBrand(e.target.value)}>
          <option value="">Todas as marcas</option>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
      </div>
      <div className="vagas-list-caption">
        <span>{displayed.length} vaga{displayed.length !== 1 ? "s" : ""} encontrada{displayed.length !== 1 ? "s" : ""}</span>
        <button type="button" aria-pressed={onlyOverdue} onClick={() => setOnlyOverdue(!onlyOverdue)} className="vagas-overdue-filter">{onlyOverdue ? "Mostrar todas" : `Prazos vencidos · ${overdueCount}`}</button>
      </div>
      {actionError && <p role="alert" className="vagas-error">{actionError}</p>}
      {displayed.length === 0 ? (
        <EmptyState icon={<Briefcase size={20} />} title="Nenhuma vaga encontrada" desc="Ajuste os filtros ou clique em 'Nova vaga'." />
      ) : (
        <div className="vagas-table-scroll" role="region" aria-label="Lista de vagas" tabIndex={0}>
          <table className="vagas-table">
            <thead><tr>{["Vaga", "Unidade e responsável", "Situação", "Prazo", "Candidatos", "Ações"].map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead>
            <tbody>{displayed.map(v => {
              const cargo = v.cargo ?? v.title ?? "—";
              const dias = diasAberta(v);
              const sla = v.cargo_grupos?.sla_dias_uteis ?? v.sla_dias ?? 30;
              const overdue = atrasada(v);
              const active = ["aberta", "em_admissao", "teste"].includes(v.status ?? "") && !v.congelada && !v.cancelada;
              const cands = candidatesByVaga[v.id] ?? 0;
              return <tr key={v.id}>
                <td className="vagas-role-cell">
                  <div className="vagas-role-title">{cargo}</div>
                  <div className="vagas-secondary">{[v.area, v.forma_contratacao && (FORMA_LABEL[v.forma_contratacao] ?? v.forma_contratacao)].filter(Boolean).join(" · ")}</div>
                  <details className="vagas-details"><summary>Detalhes da vaga</summary><dl>
                    <dt>Motivo</dt><dd>{v.motivo_estruturado ? MOTIVO_LABEL[v.motivo_estruturado] ?? v.motivo_estruturado : v.motivo ?? "Não informado"}</dd>
                    <dt>Prioridade</dt><dd>{{alta:"Alta",media:"Média",baixa:"Baixa"}[v.prioridade ?? "media"] ?? "Média"}</dd>
                    <dt>Grupo</dt><dd>{v.cargo_grupos?.nome ?? "Não informado"}</dd>
                    {v.responsavel_id && <><dt>Responsável</dt><dd>{empMap[v.responsavel_id] ?? "Não informado"}</dd></>}
                    {v.description && <><dt>Descrição</dt><dd>{v.description}</dd></>}
                    {v.must_have && <><dt>Requisitos</dt><dd>{v.must_have}</dd></>}
                    {v.nice_to_have && <><dt>Diferenciais</dt><dd>{v.nice_to_have}</dd></>}
                    {v.observacao && <><dt>Observação</dt><dd>{v.observacao}</dd></>}
                    {v.motivo_congelamento && <><dt>Motivo da pausa / cancelamento</dt><dd>{v.motivo_congelamento}</dd></>}
                  </dl></details>
                </td>
                <td><div>{v.units?.name ?? v.brands?.name ?? "—"}</div><div className="vagas-secondary">{v.recrutador ?? "R&S não definido"}</div></td>
                <td>{v.congelada ? <span className="vagas-neutral-status">Congelada</span> :
                  <select aria-label={`Situação de ${cargo}`} value={v.status ?? "aberta"} disabled={updating === v.id || !!v.cancelada} onChange={e => handleStatus(v.id, e.target.value as VagaStatus)}>
                    {STATUS_OPTIONS.map(status => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                  </select>}
                </td>
                <td className="vagas-deadline" title="Contagem de segunda a sexta, sem descontar feriados.">
                  <div className={overdue ? "vagas-overdue" : ""}>{overdue ? `${dias - sla} dias úteis em atraso` : active ? dias === sla ? "Vence hoje" : `${sla - dias} dias úteis restantes` : v.congelada ? "Pausada" : "Encerrada"}</div>
                  <div className="vagas-secondary">{active ? `${dias} de ${sla} dias úteis` : `SLA previsto: ${sla} dias úteis`}</div>
                </td>
                <td><button type="button" className="vagas-pipeline" aria-label={`Ver ${cands} candidatos de ${cargo}`} onClick={() => router.push(`/pessoas/recrutamento?vaga=${v.id}`)}><span>{cands}</span><span aria-hidden="true">↗</span></button></td>
                <td>{!v.cancelada && <select aria-label={`Ações de ${cargo}`} value="" disabled={updating === v.id} onChange={e => { if(e.target.value === "retomar") handleDescongelar(v.id); if(e.target.value === "congelar") setCongelarModal(v); if(e.target.value === "cancelar") setCancelarModal(v); }}>
                  <option value="" disabled>Mais ações</option>
                  {v.congelada ? <option value="retomar">Retomar vaga</option> : <option value="congelar">Congelar vaga</option>}
                  <option value="cancelar">Cancelar vaga</option>
                </select>}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      )}

    </div>
  );
}

function MotivoModal({ titulo, descricao, acaoBotao, corBotao, onConfirm, onClose }: {
  titulo: string; descricao: string; acaoBotao: string; corBotao: string;
  onConfirm: (motivo: string) => Promise<void>; onClose: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function handleConfirm() {
    if (!motivo.trim()) { setErro("Informe o motivo"); return; }
    setSaving(true);
    await onConfirm(motivo.trim());
    setSaving(false);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, width: "100%", maxWidth: 400 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{titulo}</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>{descricao}</p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 5 }}>Motivo *</label>
          <textarea value={motivo} onChange={(e) => { setMotivo(e.target.value); setErro(""); }} rows={3} placeholder="Descreva o motivo…" style={{ ...inputStyleModal, resize: "vertical" }} />
          {erro && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>{erro}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, background: "transparent", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={saving} style={{ flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, background: corBotao, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Salvando…" : acaoBotao}</button>
        </div>
      </div>
    </div>
  );
}

function BibliotecaJD({ jds, brands, onUseJD }: { jds: JDRow[]; brands: Brand[]; onUseJD: (jd: JDRow) => void }) {
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = jds.filter((j) => {
    const q = search.toLowerCase();
    return (!q || j.cargo.toLowerCase().includes(q) || j.area.toLowerCase().includes(q)) && (!filterArea || j.area === filterArea);
  });

  function handleExcluir(id: string) { setDeleting(id); startTransition(async () => { await excluirJobDescription(id); setDeleting(null); }); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cargo…" style={{ ...inputStyle, width: 200, padding: "7px 12px" }} />
          <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} style={selectStyle}>
            <option value="">Todas as áreas</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--brand)", color: "var(--primary-foreground)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Nova JD
        </button>
      </div>
      {showForm && <FormNovaJD brands={brands} onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />}
      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={20} />} title="Nenhuma job description" desc={'Clica em "Nova JD" para adicionar.'} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((j) => {
            const isOpen = expandedId === j.id;
            const brandName = brands.find((b) => b.id === j.brand_id)?.name;
            return (
              <div key={j.id} style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)", overflow: "hidden" }}>
                {!isOpen ? (
                  /* COLLAPSED */
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }} onClick={() => setExpandedId(j.id)}>
                    <ChevronRight size={14} color="var(--text-3)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{j.cargo}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{j.area}{brandName ? ` · ${brandName}` : ""}</div>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onUseJD(j); }} style={{ ...selectStyle, color: "var(--brand)", cursor: "pointer" }}>Usar para abrir vaga</button>
                    <button onClick={(e) => { e.stopPropagation(); handleExcluir(j.id); }} disabled={deleting === j.id} title="Excluir JD" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4, opacity: deleting === j.id ? 0.4 : 0.5, display: "flex", alignItems: "center" }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  /* EXPANDED */
                  <div>
                    {/* Cabeçalho */}
                    <div style={{ padding: "20px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 500, color: "var(--text)", lineHeight: 1.2, marginBottom: 12 }}>{j.cargo}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: "rgba(217,119,6,0.08)", color: "#D97706", border: "1px solid rgba(217,119,6,0.2)" }}>{j.area}</span>
                          {j.reporte_direto && (
                            <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 99, background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>Reporta a {j.reporte_direto}</span>
                          )}
                          {brandName ? (
                            <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 99, background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>{brandName}</span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 99, background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>Todas as marcas</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setExpandedId(null)} title="Fechar" style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4, flexShrink: 0, display: "flex", alignItems: "center" }}>
                        <ChevronDown size={18} />
                      </button>
                    </div>

                    <div style={{ padding: "0 20px 16px" }}><button type="button" onClick={() => onUseJD(j)} style={{ ...selectStyle, color: "var(--brand)", cursor: "pointer" }}>Usar para abrir vaga</button></div>
                    {/* Conteúdo */}
                    <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)" }}>
                      {/* Objetivo — lead */}
                      {j.objetivo_cargo && (
                        <div style={{ borderLeft: "2px solid var(--brasa)", paddingLeft: 14, marginTop: 20 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" as const, color: "var(--brasa)", marginBottom: 6 }}>Objetivo do Cargo</div>
                          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{j.objetivo_cargo}</div>
                        </div>
                      )}

                      {/* Responsabilidades */}
                      {(j.resp_gestao_operacional || j.resp_gestao_pessoas || j.resp_estoque_custos || j.resp_qualidade_experiencia) && (
                        <JDSectionGroup title="Responsabilidades">
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {j.resp_gestao_operacional && <JDSubitem title="Operacional" content={j.resp_gestao_operacional} />}
                            {j.resp_gestao_pessoas && <JDSubitem title="Gestão de Pessoas" content={j.resp_gestao_pessoas} />}
                            {j.resp_estoque_custos && <JDSubitem title="Estoque e Custos" content={j.resp_estoque_custos} />}
                            {j.resp_qualidade_experiencia && <JDSubitem title="Qualidade e Experiência" content={j.resp_qualidade_experiencia} />}
                          </div>
                        </JDSectionGroup>
                      )}

                      {/* Requisitos */}
                      {(j.req_formacao || j.req_experiencia || j.req_conhecimentos_tecnicos || j.req_competencias_comportamentais) && (
                        <JDSectionGroup title="Requisitos">
                          {(j.req_formacao || j.req_experiencia) && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: (j.req_conhecimentos_tecnicos || j.req_competencias_comportamentais) ? 14 : 0 }}>
                              {j.req_formacao && <JDSubitem title="Formação" content={j.req_formacao} />}
                              {j.req_experiencia && <JDSubitem title="Experiência" content={j.req_experiencia} />}
                            </div>
                          )}
                          {(j.req_conhecimentos_tecnicos || j.req_competencias_comportamentais) && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                              {j.req_conhecimentos_tecnicos && <JDSubitem title="Conhecimentos Técnicos" content={j.req_conhecimentos_tecnicos} />}
                              {j.req_competencias_comportamentais && <JDSubitem title="Competências Comportamentais" content={j.req_competencias_comportamentais} />}
                            </div>
                          )}
                        </JDSectionGroup>
                      )}

                      {/* Performance e Pessoas */}
                      {(j.indicadores_performance || j.indicadores_sucesso || j.responsabilidades_sobre_pessoas || j.condicoes_trabalho) && (
                        <JDSectionGroup title="Performance e Pessoas">
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {j.indicadores_performance && <JDSubitem title="Indicadores de Performance" content={j.indicadores_performance} />}
                            {j.indicadores_sucesso && <JDSubitem title="Indicadores de Sucesso" content={j.indicadores_sucesso} />}
                            {j.responsabilidades_sobre_pessoas && <JDSubitem title="Escopo de Liderança" content={j.responsabilidades_sobre_pessoas} />}
                            {j.condicoes_trabalho && <JDSubitem title="Condições de Trabalho" content={j.condicoes_trabalho} />}
                          </div>
                        </JDSectionGroup>
                      )}

                      {/* Benefícios */}
                      {j.beneficios && (
                        <JDSectionGroup title="Benefícios">
                          <JDSubitem title="" content={j.beneficios} />
                        </JDSectionGroup>
                      )}

                      {/* Legado: exibe se novos campos vazios */}
                      {!j.resp_gestao_operacional && j.responsabilidades && (
                        <JDSectionGroup title="Responsabilidades">
                          <JDSubitem title="" content={j.responsabilidades} />
                        </JDSectionGroup>
                      )}
                      {!j.req_formacao && j.requisitos && (
                        <JDSectionGroup title="Requisitos">
                          <JDSubitem title="" content={j.requisitos} />
                        </JDSectionGroup>
                      )}

                      {/* Delete */}
                      <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 14, display: "flex", justifyContent: "flex-end" }}>
                        <button onClick={() => handleExcluir(j.id)} disabled={deleting === j.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", fontSize: 11, background: "rgba(220,38,38,0.06)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 6, cursor: "pointer", opacity: deleting === j.id ? 0.4 : 1 }}>
                          <Trash2 size={11} /> Excluir JD
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JDSectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: "var(--brasa)", textTransform: "uppercase" as const, letterSpacing: "0.05em", paddingBottom: 5, borderBottom: "1.5px solid var(--brasa)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function JDSubitem({ title, content }: { title: string; content: string }) {
  const lines = content.split("\n").filter((l) => l.trim());
  return (
    <div>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" as const, color: "#EF9F27", marginBottom: 6 }}>{title}</div>
      )}
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
        {lines.map((line, i) => (
          <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "var(--text-2)", lineHeight: 1.55 }}>
            <span style={{ color: "var(--brand)", marginTop: 3, flexShrink: 0, fontSize: 10 }}>•</span>
            {line.replace(/^[-•·]\s*/, "")}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormRequisicao({ jds, initialJD, brands, employees, cargoGrupos, units, onSuccess }: {
  jds: JDRow[]; initialJD: JDRow | null; brands: Brand[]; employees: EmpSel[]; cargoGrupos: CargoGrupoSel[]; units: Unit[]; onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [jdId, setJdId] = useState(initialJD?.id ?? "");
  const [appliedJD, setAppliedJD] = useState(initialJD?.cargo ?? "");
  const [confirmJD, setConfirmJD] = useState(false);
  const [form, setForm] = useState(() => ({
    description: "",
    cargo: "",
    cargo_grupo_id: "",
    area: "",
    motivo_estruturado: "" as MotivoEstruturado | "",
    horario_escala: "",
    forma_contratacao: "" as FormaContratacao | "",
    periodo_exp_dias: "90",
    substituido_id: "",
    unit_id: "",
    brand_id: "",
    recrutador: "",
    observacao: "",
    prioridade: "media",
    salario_min: "",
    salario_max: "",
    must_have: "",
    nice_to_have: "",
    ...(initialJD ? camposVagaDoJD(initialJD, brands.map(b => b.id)) : {}),
  }));
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const selectedJD = jds.find(j => j.id === jdId);
  function applyJD() {
    if (!selectedJD || pending) return;
    setForm(p => ({ ...p, ...camposVagaDoJD(selectedJD, brands.map(b => b.id)) }));
    setAppliedJD(selectedJD.cargo);
    setConfirmJD(false);
    setError("");
  }
  function requestApplyJD() {
    if (form.cargo || form.area || form.brand_id || form.forma_contratacao || form.must_have || form.description) setConfirmJD(true);
    else applyJD();
  }

  const grupoSelecionado = cargoGrupos.find((g) => g.id === form.cargo_grupo_id);
  const ehSubstituicao =
    form.motivo_estruturado === "substituicao_licenca" ||
    form.motivo_estruturado === "substituicao_promocao" ||
    form.motivo_estruturado === "substituicao_desligamento";
  const turnosSel = new Set(form.horario_escala ? form.horario_escala.split(",").map(t => t.trim()).filter(Boolean) : []);
  function toggleTurno(turno: string) {
    const next = new Set(turnosSel);
    if (next.has(turno)) next.delete(turno); else next.add(turno);
    set("horario_escala", [...next].join(","));
  }

  function set(field: keyof typeof form, value: string) { setForm((p) => ({ ...p, [field]: value })); setError(""); }

  function handleSubmit() {
    if (pending) return;
    const motivoEstruturado = normalizeMotivoVaga(form.motivo_estruturado);
    if (!isMotivoVaga(motivoEstruturado)) { setError("Selecione o motivo da abertura. Este campo é obrigatório."); return; }
    if (!form.cargo.trim()) { setError("Informe o cargo"); return; }
    if (!form.cargo_grupo_id) { setError("Grupo de cargo é obrigatório — define o SLA"); return; }
    startTransition(async () => {
      const result = await criarVaga({
        cargo: form.cargo.trim(),
        description: form.description || undefined,
        cargo_grupo_id: form.cargo_grupo_id,
        area: form.area || undefined,
        motivo_estruturado: motivoEstruturado,
        horario_escala: form.horario_escala || undefined,
        forma_contratacao: (form.forma_contratacao as FormaContratacao) || undefined,
        periodo_exp_dias: form.periodo_exp_dias ? Number(form.periodo_exp_dias) : undefined,
        substituido_id: ehSubstituicao && form.substituido_id ? form.substituido_id : undefined,
        brand_id: form.brand_id || undefined,
        unit_id: form.unit_id || undefined,
        recrutador: form.recrutador || undefined,
        observacao: form.observacao || undefined,
        prioridade: form.prioridade || "media",
        salario_min: form.salario_min ? Number(form.salario_min) : undefined,
        salario_max: form.salario_max ? Number(form.salario_max) : undefined,
        must_have: form.must_have || undefined,
        nice_to_have: form.nice_to_have || undefined,
      });
      if (!result.ok) { setError(result.error ?? "Erro"); return; }
      setDone(true);
      setTimeout(() => { setDone(false); onSuccess(); }, 1600);
    });
  }

  if (done) return (
    <div style={{ padding: "56px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <CheckCircle2 size={36} color="var(--brand)" />
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Vaga aberta com sucesso!</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 28 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 20 }}>Nova Requisição de Vaga</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface-2)" }}>
          <FieldGroup label="Preencher a partir de um JD">
            <select aria-label="Job Description" value={jdId} disabled={pending} onChange={e => { setJdId(e.target.value); setConfirmJD(false); }} style={inputStyle}>
              <option value="">{jds.length ? "Selecione uma descrição de cargo…" : "Nenhum JD cadastrado"}</option>
              {jds.map(j => <option key={j.id} value={j.id}>{j.cargo} · {j.area}{j.brand_id ? ` · ${brands.find(b => b.id === j.brand_id)?.name ?? "Marca específica"}` : ""}</option>)}
            </select>
          </FieldGroup>
          <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>Importa cargo, área, marca disponível, contratação, requisitos e descrição. Revise os dados e complete unidade, grupo de cargo e motivo da abertura.</p>
          <button type="button" disabled={!selectedJD || pending || confirmJD} onClick={requestApplyJD} style={{ ...selectStyle, color: "var(--brand)", cursor: "pointer" }}>Aplicar JD</button>
          {confirmJD && <div role="alert" style={{ marginTop: 12, fontSize: 12 }}>
            <p>Substituir cargo, área, marca, contratação, requisitos e descrição pelos dados deste JD? Os demais campos serão mantidos.</p>
            <button type="button" disabled={pending} onClick={applyJD} style={selectStyle}>Substituir pelos dados do JD</button>{" "}
            <button type="button" onClick={() => setConfirmJD(false)} style={selectStyle}>Manter preenchimento</button>
          </div>}
          {appliedJD && <p role="status" style={{ fontSize: 12, color: "var(--brand)", marginBottom: 0 }}>Dados importados de {appliedJD}. Todos os campos continuam editáveis.</p>}
        </div>

        {/* ── Dados básicos ── */}
        <SectionTitle>Dados</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldGroup label="Cargo *">
            <input value={form.cargo} onChange={(e) => set("cargo", e.target.value)} placeholder="Cozinheiro II, Garçom…" style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Área">
            <select value={form.area} onChange={(e) => set("area", e.target.value)} style={inputStyle}>
              <option value="">Selecione…</option>
              {form.area && !AREAS.includes(form.area) && <option value={form.area}>{form.area}</option>}
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Grupo de cargo (SLA) *">
            <select value={form.cargo_grupo_id} onChange={(e) => set("cargo_grupo_id", e.target.value)} style={{ ...inputStyle, borderColor: !form.cargo_grupo_id ? "#CA8A04" : undefined }}>
              <option value="">Selecione o grupo…</option>
              {cargoGrupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nome}</option>
              ))}
            </select>
            {grupoSelecionado && (
              <div style={{ fontSize: 11, color: "var(--brand)", marginTop: 4, fontWeight: 600 }}>
                SLA: {grupoSelecionado.sla_dias_uteis} dias úteis
              </div>
            )}
          </FieldGroup>
          <FieldGroup label="Unidade">
            <select value={form.unit_id} onChange={(e) => set("unit_id", e.target.value)} style={inputStyle}>
              <option value="">Selecione…</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Prioridade">
            <select value={form.prioridade} onChange={(e) => set("prioridade", e.target.value)} style={inputStyle}>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </FieldGroup>
          <FieldGroup label="Marca">
            <select value={form.brand_id} onChange={(e) => set("brand_id", e.target.value)} style={inputStyle}>
              <option value="">Selecione…</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FieldGroup>
        </div>

        {/* ── Condições ── */}
        <SectionTitle>Condições</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldGroup label="Forma de contratação">
            <select value={form.forma_contratacao} onChange={(e) => set("forma_contratacao", e.target.value)} style={inputStyle}>
              <option value="">Selecione…</option>
              {(Object.keys(FORMA_LABEL) as FormaContratacao[]).map((f) => (
                <option key={f} value={f}>{FORMA_LABEL[f]}</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup label="Período de experiência (dias)">
            <input type="number" value={form.periodo_exp_dias} onChange={(e) => set("periodo_exp_dias", e.target.value)} placeholder="90" style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Salário base mínimo (R$)">
            <input type="number" value={form.salario_min} onChange={(e) => set("salario_min", e.target.value)} placeholder="R$" style={inputStyle} />
          </FieldGroup>
          <FieldGroup label="Salário base máximo (R$)">
            <input type="number" value={form.salario_max} onChange={(e) => set("salario_max", e.target.value)} placeholder="R$" style={inputStyle} />
          </FieldGroup>
        </div>
        <FieldGroup label="Horário / escala">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TURNOS_VAGA.map(turno => {
              const ativo = turnosSel.has(turno);
              return (
                <button
                  key={turno}
                  type="button"
                  onClick={() => toggleTurno(turno)}
                  style={{ padding: "6px 16px", fontSize: 12, fontWeight: 600, borderRadius: 99, border: ativo ? "1px solid var(--brasa)" : "1px solid var(--border)", background: ativo ? "var(--brasa)" : "var(--surface-2)", color: ativo ? "var(--primary-foreground)" : "var(--text-2)", cursor: "pointer" }}
                >
                  {turno}
                </button>
              );
            })}
          </div>
        </FieldGroup>

        {/* ── Contexto ── */}
        <SectionTitle>Contexto</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FieldGroup label="Motivo da abertura *">
            <select aria-label="Motivo da abertura" required disabled={pending} value={form.motivo_estruturado} onChange={(e) => set("motivo_estruturado", e.target.value)} style={inputStyle}>
              <option value="" disabled>Selecione…</option>
              {MOTIVOS_FORM.map(v => (
                <option key={v} value={v}>{MOTIVO_LABEL[v]}</option>
              ))}
            </select>
          </FieldGroup>
          {ehSubstituicao && (
            <FieldGroup label="Colaborador substituído">
              <select value={form.substituido_id} onChange={(e) => set("substituido_id", e.target.value)} style={inputStyle}>
                <option value="">Selecione…</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </FieldGroup>
          )}
          <FieldGroup label="Responsável pelo R&S">
            <input value={form.recrutador} onChange={(e) => set("recrutador", e.target.value)} placeholder="Amanda, Dayane…" style={inputStyle} />
          </FieldGroup>
        </div>
        <FieldGroup label="Descrição da vaga">
          <textarea aria-label="Descrição da vaga" value={form.description} onChange={e => set("description", e.target.value)} rows={7} placeholder="Objetivo do cargo, responsabilidades, condições e benefícios…" style={{ ...inputStyle, resize: "vertical" }} />
        </FieldGroup>
        <FieldGroup label="Requisitos — must have">
          <textarea value={form.must_have} onChange={(e) => set("must_have", e.target.value)} rows={2} placeholder="Experiência comprovada, disponibilidade…" style={{ ...inputStyle, resize: "vertical" }} />
        </FieldGroup>
        <FieldGroup label="Requisitos — nice to have">
          <textarea value={form.nice_to_have} onChange={(e) => set("nice_to_have", e.target.value)} rows={2} placeholder="Diferenciais desejáveis…" style={{ ...inputStyle, resize: "vertical" }} />
        </FieldGroup>
        <FieldGroup label="Observação">
          <textarea value={form.observacao} onChange={(e) => set("observacao", e.target.value)} rows={3} placeholder="Candidatos em processo, urgência…" style={{ ...inputStyle, resize: "vertical" }} />
        </FieldGroup>

        {error && <div style={{ fontSize: 12, color: "#DC2626", padding: "8px 12px", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 6 }}>{error}</div>}
        <button disabled={pending || !isMotivoVaga(form.motivo_estruturado)} onClick={handleSubmit} style={{ padding: "10px 20px", background: "var(--brand)", color: "var(--primary-foreground)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: pending || !form.motivo_estruturado ? "not-allowed" : "pointer", opacity: pending || !form.motivo_estruturado ? 0.5 : 1, alignSelf: "flex-start" }}>{pending ? "Abrindo…" : "Abrir vaga"}</button>
      </div>
    </div>
  );
}

function FormNovaJD({ brands, onSuccess, onCancel }: { brands: Brand[]; onSuccess: () => void; onCancel: () => void }) {
  const [, startTransition] = useTransition();
  const [form, setForm] = useState({
    cargo: "", area: AREAS[0] ?? "Outros", brand_id: "",
    reporte_direto: "", objetivo_cargo: "",
    resp_gestao_operacional: "", resp_gestao_pessoas: "",
    resp_estoque_custos: "", resp_qualidade_experiencia: "",
    indicadores_performance: "",
    req_formacao: "", req_experiencia: "",
    req_conhecimentos_tecnicos: "", req_competencias_comportamentais: "",
    responsabilidades_sobre_pessoas: "", condicoes_trabalho: "", indicadores_sucesso: "",
    beneficios: "",
  });
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(field: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setAiFields((prev) => { const next = new Set(prev); next.delete(field); return next; });
  }

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) { setParseError("Apenas arquivos .docx são suportados"); return; }
    setParsing(true);
    setParseError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await parseJobDescription(fd);
      if (!result.ok || !result.dados) { setParseError(result.error ?? "Erro ao processar JD"); return; }
      const d = result.dados;
      const filled = new Set<string>();
      setForm(prev => {
        const next = { ...prev };
        function maybe(key: keyof typeof next, val: string | null | undefined) {
          if (val != null && String(val).trim()) { (next as Record<string, string>)[key] = String(val); filled.add(key); }
        }
        maybe("cargo", d.cargo);
        if (d.area && (AREAS as readonly string[]).includes(d.area)) maybe("area", d.area);
        maybe("reporte_direto", d.reporte_direto);
        maybe("objetivo_cargo", d.objetivo_cargo);
        maybe("resp_gestao_operacional", d.resp_gestao_operacional);
        maybe("resp_gestao_pessoas", d.resp_gestao_pessoas);
        maybe("resp_estoque_custos", d.resp_estoque_custos);
        maybe("resp_qualidade_experiencia", d.resp_qualidade_experiencia);
        maybe("indicadores_performance", d.indicadores_performance);
        maybe("req_formacao", d.req_formacao);
        maybe("req_experiencia", d.req_experiencia);
        maybe("req_conhecimentos_tecnicos", d.req_conhecimentos_tecnicos);
        maybe("req_competencias_comportamentais", d.req_competencias_comportamentais);
        maybe("responsabilidades_sobre_pessoas", d.responsabilidades_sobre_pessoas);
        maybe("condicoes_trabalho", d.condicoes_trabalho);
        maybe("indicadores_sucesso", d.indicadores_sucesso);
        maybe("beneficios", d.beneficios);
        return next;
      });
      setAiFields(filled);
    } finally {
      setParsing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  }

  function handleSubmit() {
    if (!form.cargo.trim()) { setError("Informe o cargo"); return; }
    setError("");
    startTransition(async () => {
      const result = await criarJobDescription({
        cargo: form.cargo.trim(),
        area: form.area,
        brand_id: form.brand_id || undefined,
        reporte_direto: form.reporte_direto.trim() || undefined,
        objetivo_cargo: form.objetivo_cargo.trim() || undefined,
        resp_gestao_operacional: form.resp_gestao_operacional.trim() || undefined,
        resp_gestao_pessoas: form.resp_gestao_pessoas.trim() || undefined,
        resp_estoque_custos: form.resp_estoque_custos.trim() || undefined,
        resp_qualidade_experiencia: form.resp_qualidade_experiencia.trim() || undefined,
        indicadores_performance: form.indicadores_performance.trim() || undefined,
        req_formacao: form.req_formacao.trim() || undefined,
        req_experiencia: form.req_experiencia.trim() || undefined,
        req_conhecimentos_tecnicos: form.req_conhecimentos_tecnicos.trim() || undefined,
        req_competencias_comportamentais: form.req_competencias_comportamentais.trim() || undefined,
        responsabilidades_sobre_pessoas: form.responsabilidades_sobre_pessoas.trim() || undefined,
        condicoes_trabalho: form.condicoes_trabalho.trim() || undefined,
        indicadores_sucesso: form.indicadores_sucesso.trim() || undefined,
        beneficios: form.beneficios.trim() || undefined,
      });
      if (!result.ok) { setError(result.error ?? "Erro"); return; }
      onSuccess();
    });
  }

  function aiBadge(field: keyof typeof form) {
    if (!aiFields.has(field)) return null;
    return <span style={{ fontSize: 10, fontWeight: 700, color: "#D97706", background: "rgba(217,119,6,0.1)", padding: "2px 5px", borderRadius: 4 }}>IA</span>;
  }
  function aiStyle(field: keyof typeof form): React.CSSProperties {
    return aiFields.has(field) ? { ...inputStyle, background: "#FFFBEB", borderColor: "#D97706", color: "#2C2C2A", fontWeight: 500 } : inputStyle;
  }
  function taStyle(field: keyof typeof form): React.CSSProperties {
    return { ...aiStyle(field), resize: "vertical" as const };
  }

  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Nova Job Description</div>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}><X size={16} /></button>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? "var(--brand)" : "var(--border)"}`, borderRadius: 8, padding: "14px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(0,0,0,0.02)" : "transparent", marginBottom: 14, transition: "border-color 0.15s" }}
      >
        <input ref={fileInputRef} type="file" accept=".docx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
        {parsing
          ? <div style={{ fontSize: 12, color: "var(--text-3)" }}>Lendo JD com IA…</div>
          : <><div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Arraste um .docx ou clique para importar</div><div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>IA extrai os campos — você revisa antes de salvar</div></>
        }
      </div>
      {parseError && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 10 }}>{parseError}</div>}
      {aiFields.size > 0 && <div style={{ fontSize: 12, color: "#D97706", background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 6, padding: "8px 12px", marginBottom: 14 }}>IA extraiu {aiFields.size} campos — revise e confirme antes de salvar</div>}

      {/* Identificação */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" as const, color: "var(--text-3)", marginBottom: 8 }}>Identificação</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <FieldGroup label={<>Cargo *{aiBadge("cargo")}</>}><input value={form.cargo} onChange={(e) => set("cargo", e.target.value)} placeholder="Chefe de Bar…" style={aiStyle("cargo")} /></FieldGroup>
        <FieldGroup label={<>Área{aiBadge("area")}</>}><select value={form.area} onChange={(e) => set("area", e.target.value)} style={aiStyle("area")}>{AREAS.map((a) => <option key={a} value={a}>{a}</option>)}</select></FieldGroup>
        <FieldGroup label="Marca"><select value={form.brand_id} onChange={(e) => set("brand_id", e.target.value)} style={inputStyle}><option value="">Todas</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></FieldGroup>
        <FieldGroup label={<>Reporte direto{aiBadge("reporte_direto")}</>}><input value={form.reporte_direto} onChange={(e) => set("reporte_direto", e.target.value)} placeholder="Gerente de Bar…" style={aiStyle("reporte_direto")} /></FieldGroup>
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldGroup label={<>Objetivo do cargo{aiBadge("objetivo_cargo")}</>}><textarea value={form.objetivo_cargo} onChange={(e) => set("objetivo_cargo", e.target.value)} rows={2} placeholder="Propósito e responsabilidade central do cargo…" style={taStyle("objetivo_cargo")} /></FieldGroup>
      </div>

      {/* Responsabilidades */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" as const, color: "var(--text-3)", marginBottom: 8 }}>Responsabilidades</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <FieldGroup label={<>Gestão operacional{aiBadge("resp_gestao_operacional")}</>}><textarea value={form.resp_gestao_operacional} onChange={(e) => set("resp_gestao_operacional", e.target.value)} rows={3} style={taStyle("resp_gestao_operacional")} /></FieldGroup>
        <FieldGroup label={<>Gestão de pessoas{aiBadge("resp_gestao_pessoas")}</>}><textarea value={form.resp_gestao_pessoas} onChange={(e) => set("resp_gestao_pessoas", e.target.value)} rows={3} style={taStyle("resp_gestao_pessoas")} /></FieldGroup>
        <FieldGroup label={<>Estoque e custos{aiBadge("resp_estoque_custos")}</>}><textarea value={form.resp_estoque_custos} onChange={(e) => set("resp_estoque_custos", e.target.value)} rows={3} style={taStyle("resp_estoque_custos")} /></FieldGroup>
        <FieldGroup label={<>Qualidade e experiência{aiBadge("resp_qualidade_experiencia")}</>}><textarea value={form.resp_qualidade_experiencia} onChange={(e) => set("resp_qualidade_experiencia", e.target.value)} rows={3} style={taStyle("resp_qualidade_experiencia")} /></FieldGroup>
      </div>

      {/* Requisitos */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" as const, color: "var(--text-3)", marginBottom: 8 }}>Requisitos</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <FieldGroup label={<>Formação{aiBadge("req_formacao")}</>}><input value={form.req_formacao} onChange={(e) => set("req_formacao", e.target.value)} placeholder="Bacharel em Gastronomia…" style={aiStyle("req_formacao")} /></FieldGroup>
        <FieldGroup label={<>Experiência{aiBadge("req_experiencia")}</>}><input value={form.req_experiencia} onChange={(e) => set("req_experiencia", e.target.value)} placeholder="Mínimo 3 anos…" style={aiStyle("req_experiencia")} /></FieldGroup>
        <FieldGroup label={<>Conhecimentos técnicos{aiBadge("req_conhecimentos_tecnicos")}</>}><textarea value={form.req_conhecimentos_tecnicos} onChange={(e) => set("req_conhecimentos_tecnicos", e.target.value)} rows={3} style={taStyle("req_conhecimentos_tecnicos")} /></FieldGroup>
        <FieldGroup label={<>Competências comportamentais{aiBadge("req_competencias_comportamentais")}</>}><textarea value={form.req_competencias_comportamentais} onChange={(e) => set("req_competencias_comportamentais", e.target.value)} rows={3} style={taStyle("req_competencias_comportamentais")} /></FieldGroup>
      </div>

      {/* Performance e Pessoas */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" as const, color: "var(--text-3)", marginBottom: 8 }}>Performance e Pessoas</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <FieldGroup label={<>Indicadores de performance{aiBadge("indicadores_performance")}</>}><textarea value={form.indicadores_performance} onChange={(e) => set("indicadores_performance", e.target.value)} rows={3} placeholder="CMV, NPS, produtividade…" style={taStyle("indicadores_performance")} /></FieldGroup>
        <FieldGroup label={<>Liderança (escopo){aiBadge("responsabilidades_sobre_pessoas")}</>}><textarea value={form.responsabilidades_sobre_pessoas} onChange={(e) => set("responsabilidades_sobre_pessoas", e.target.value)} rows={3} placeholder="Gerencia X pessoas diretas…" style={taStyle("responsabilidades_sobre_pessoas")} /></FieldGroup>
        <FieldGroup label={<>Condições de trabalho{aiBadge("condicoes_trabalho")}</>}><textarea value={form.condicoes_trabalho} onChange={(e) => set("condicoes_trabalho", e.target.value)} rows={2} placeholder="Horário, viagens, presença…" style={taStyle("condicoes_trabalho")} /></FieldGroup>
        <FieldGroup label={<>Indicadores de sucesso{aiBadge("indicadores_sucesso")}</>}><textarea value={form.indicadores_sucesso} onChange={(e) => set("indicadores_sucesso", e.target.value)} rows={2} placeholder="Primeiros 90 dias…" style={taStyle("indicadores_sucesso")} /></FieldGroup>
      </div>

      {/* Benefícios */}
      <FieldGroup label={<>Benefícios{aiBadge("beneficios")}</>}><textarea value={form.beneficios} onChange={(e) => set("beneficios", e.target.value)} rows={2} style={taStyle("beneficios")} /></FieldGroup>

      {error && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{error}</div>}
      <button onClick={handleSubmit} style={{ marginTop: 12, padding: "8px 16px", background: "var(--brand)", color: "var(--primary-foreground)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Salvar JD</button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--text-3)", borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>{children}</div>;
}

function KpiCard({ label, value }: { label: string; value: number | string; icon?: React.ReactNode; accent?: boolean }) {
  return <div className="vagas-kpi"><div>{label}</div><strong>{value}</strong></div>;
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ padding: "56px 28px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 99, background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{title}</div>
      <p style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 360, lineHeight: 1.55, margin: 0 }}>{desc}</p>
    </div>
  );
}

function FieldGroup({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", background: "var(--background)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" };
const inputStyleModal: React.CSSProperties = { width: "100%", background: "var(--background)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" };
const selectStyle: React.CSSProperties = { height: 32, padding: "0 10px", background: "var(--background)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, outline: "none", cursor: "pointer" };
