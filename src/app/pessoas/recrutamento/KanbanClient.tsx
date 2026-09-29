"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, RefreshCw, ChevronRight, Clock, Star, Plus, X, Briefcase, Paperclip, Calendar, CheckSquare, ClipboardList, UserCheck, Search, LayoutGrid, ListFilter } from "lucide-react";
import {
  avancarEtapa, moverCandidato, createCandidate,
  updateCandidatoCurriculo, uploadCandidatoCV, parseCurriculoFromUpload,
  criarAgendamento, marcarAgendamentoRealizado, recriarEventoGoogle,
  type Candidato, type CandidatoStatus, type VagaBasic,
  type FonteCandidato, type RecrutamentoOptions, type CargoCanon, type Agendamento,
} from "./actions";
import { CargoCombobox } from "./CargoCombobox";
import {
  ESCOLARIDADE_SLUGS, ESCOLARIDADE_LABEL, TURNOS,
  type Experiencia, type Formacao, type Idioma, type CurriculoPayload,
} from "./curriculo-constants";
import { isNumeroWhatsAppValido } from "@/lib/pessoas/utils";
import "./recruitment.css";
import {
  ESTAGIOS_ATIVOS, PROXIMO_ESTAGIO,
  calcularSlaStatus, SLA_COR, SLA_LABEL,
} from "@/lib/pessoas/recrutamento-config";

// Colunas ativas e próxima etapa vêm da config (fonte única — recrutamento-config.ts).
const COLUNAS = ESTAGIOS_ATIVOS;
const PROXIMA_ETAPA = PROXIMO_ESTAGIO;

const ORIGEM_LABEL: Record<string, string> = {
  maya:                     "Maya (WA)",
  maya_whatsapp:            "Maya (WA)",
  portal:                   "Portal KPH",
  portal_kph:               "Portal KPH",
  indicacao_colaborador:    "Indicação collab.",
  indicacao:                "Indicação ext.",
  linkedin:                 "LinkedIn",
  indeed:                   "Indeed",
  catho:                    "Catho",
  vagas_com_br:             "Vagas.com",
  infojobs:                 "InfoJobs",
  instagram:                "Instagram",
  mutirao:                  "Mutirão",
  busca_ativa:              "Busca ativa",
  banco_talentos_reativado: "Banco talentos",
  escola:                   "Escola",
  sindicato:                "Sindicato",
  abordagem:                "Abordagem",
  manual:                   "Manual",
  outro:                    "Outro",
};

const ORIGEM_COR: Record<string, string> = {
  maya:                     "var(--brasa)",
  maya_whatsapp:            "var(--brasa)",
  portal:                   "#8A8278",
  portal_kph:               "#8A8278",
  indicacao_colaborador:    "#B8975A",
  indicacao:                "#B8975A",
  linkedin:                 "#0A66C2",
  indeed:                   "#2164F3",
  catho:                    "#E5001A",
  vagas_com_br:             "#FF6000",
  infojobs:                 "#006EBF",
  instagram:                "#C13584",
  mutirao:                  "#2563EB",
  busca_ativa:              "#7C3AED",
  banco_talentos_reativado: "#9333EA",
  escola:                   "#059669",
  sindicato:                "#374151",
  abordagem:                "#0891B2",
  manual:                   "#64748B",
  outro:                    "#64748B",
};

const FONTES: { value: FonteCandidato; label: string }[] = [
  { value: "indicacao_colaborador",    label: "Indicação de colaborador" },
  { value: "indicacao",                label: "Indicação externa" },
  { value: "linkedin",                 label: "LinkedIn" },
  { value: "indeed",                   label: "Indeed" },
  { value: "catho",                    label: "Catho" },
  { value: "vagas_com_br",             label: "Vagas.com.br" },
  { value: "infojobs",                 label: "InfoJobs" },
  { value: "instagram",                label: "Instagram / DM" },
  { value: "mutirao",                  label: "Mutirão" },
  { value: "busca_ativa",              label: "Busca ativa (RH)" },
  { value: "banco_talentos_reativado", label: "Banco de talentos" },
  { value: "escola",                   label: "Escola / curso" },
  { value: "sindicato",                label: "Sindicato / SENAC" },
  { value: "abordagem",                label: "Abordagem presencial" },
  { value: "portal",                   label: "Portal KPH" },
  { value: "manual",                   label: "Manual (RH)" },
  { value: "maya",                     label: "Maya (WhatsApp)" },
  { value: "outro",                    label: "Outro" },
];

type Props = {
  candidatos: Candidato[];
  vagas: VagaBasic[];
  vagaIdInicial?: string;
  options: RecrutamentoOptions;
  cargosCanon: CargoCanon[];
};

function BtnPrimario({ onClick, children, loading, icon, cor }: { onClick: () => void; children: React.ReactNode; loading?: boolean; icon?: React.ReactNode; cor?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 12px", fontSize: 12, fontWeight: 600, background: cor ?? "var(--brand)", color: cor ? "#fff" : "var(--primary-foreground)", border: "none", borderRadius: 7, cursor: "pointer", opacity: loading ? 0.5 : 1, width: "100%" }}
    >
      {icon}{loading ? "Aguarde…" : children}
    </button>
  );
}

export function KanbanClient({ candidatos, vagas, vagaIdInicial, options, cargosCanon }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filterVaga, setFilterVaga] = useState(vagaIdInicial ?? "");
  const [filterOrigem, setFilterOrigem] = useState("");
  const [search, setSearch] = useState("");
  const [filterEtapa, setFilterEtapa] = useState<CandidatoStatus | "">("");
  const [onlyLate, setOnlyLate] = useState(false);
  const [view, setView] = useState<"prioridades" | "quadro">("prioridades");
  const [syncing, setSyncing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [avancando, setAvancando] = useState<string | null>(null);
  const [reprovando, setReprovando] = useState<string | null>(null);
  const [reprovarTarget, setReprovarTarget] = useState<Candidato | null>(null);
  const [agendamentoTarget, setAgendamentoTarget] = useState<{ candidato: Candidato; tipo: 'entrevista' | 'teste_pratico' } | null>(null);
  const [marcandoRealizado, setMarcandoRealizado] = useState<string | null>(null);

  const displayed = candidatos.filter((c) => {
    if (filterVaga && c.job_opening_id !== filterVaga) return false;
    if (filterOrigem && c.origem !== filterOrigem) return false;
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (term && ![c.nome, c.name, c.telefone, c.area_interesse, c.job_openings?.cargo, c.job_openings?.title].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(term)) return false;
    return true;
  });

  // Presentation only: retain the existing stage SLA calculation and actions.
  function isLate(c: Candidato) {
    return calcularSlaStatus(c.status, c.updated_at ?? c.created_at) === "atrasado";
  }
  const visible = displayed.filter(c => (!filterEtapa || c.status === filterEtapa) && (!onlyLate || isLate(c)));
  const prioritized = visible.filter(c => COLUNAS.some(stage => stage.id === c.status))
    .sort((a, b) => Number(isLate(b)) - Number(isLate(a)) || diasNaEtapa(b) - diasNaEtapa(a));
  function clearFilters() {
    setSearch(""); setFilterVaga(""); setFilterOrigem(""); setFilterEtapa(""); setOnlyLate(false);
  }

  function getNome(c: Candidato) { return c.nome ?? c.name ?? "—"; }

  function diasNaEtapa(c: Candidato) {
    return Math.floor((Date.now() - new Date(c.updated_at ?? c.created_at).getTime()) / (1000 * 60 * 60 * 24));
  }

  function handleAvancar(c: Candidato, statusOverride?: CandidatoStatus) {
    const proximo = statusOverride ?? PROXIMA_ETAPA[c.status];
    if (!proximo) return;
    setAvancando(c.id);
    startTransition(async () => {
      await avancarEtapa(c.id, proximo);
      setAvancando(null);
      router.refresh();
    });
  }

  function computeProximoDeAvaliacaoClient(c: Candidato): "entrevista_diretoria" | "agendamento_teste" {
    if (c.requer_entrevista_diretoria !== null && c.requer_entrevista_diretoria !== undefined) {
      return c.requer_entrevista_diretoria ? "entrevista_diretoria" : "agendamento_teste";
    }
    if (c.cargo_id && c.cargo?.requer_entrevista_diretoria !== null && c.cargo?.requer_entrevista_diretoria !== undefined) {
      return c.cargo.requer_entrevista_diretoria ? "entrevista_diretoria" : "agendamento_teste";
    }
    return "entrevista_diretoria"; // default
  }

  function handleReprovar(c: Candidato) {
    setReprovarTarget(c);
  }

  async function handleMarcarRealizado(candidato: Candidato, tipo: 'entrevista' | 'teste_pratico') {
    const agsSorted = [...(candidato.agendamentos ?? [])].sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
    const ag = agsSorted.find(a => a.tipo === tipo && a.status === 'agendado');
    if (!ag) return;
    setMarcandoRealizado(candidato.id);
    const res = await marcarAgendamentoRealizado(ag.id);
    setMarcandoRealizado(null);
    if (!res.ok) {
      toast.error(res.error ?? 'Erro ao marcar como realizado');
      return;
    }
    const proximo = PROXIMA_ETAPA[candidato.status];
    if (proximo) await avancarEtapa(candidato.id, proximo);
    router.refresh();
  }

  function renderAcoes(c: Candidato) {
    const agsSorted = [...(c.agendamentos ?? [])].sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
    const agendamentoEntrevista = agsSorted.find(a => a.tipo === 'entrevista' && a.status === 'agendado');
    const agendamentoTeste = agsSorted.find(a => a.tipo === 'teste_pratico' && a.status === 'agendado');

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 2 }}>
        {c.status === 'novo' && (
          <BtnPrimario onClick={() => handleAvancar(c)} loading={avancando === c.id} icon={<ChevronRight size={11}/>}>Triar</BtnPrimario>
        )}
        {c.status === 'triagem' && (
          <BtnPrimario onClick={() => setAgendamentoTarget({ candidato: c, tipo: 'entrevista' })} icon={<Calendar size={11}/>}>Agendar entrevista</BtnPrimario>
        )}
        {c.status === 'agendamento' && (
          agendamentoEntrevista
            ? <BtnPrimario onClick={() => handleMarcarRealizado(c, 'entrevista')} loading={marcandoRealizado === c.id} icon={<CheckSquare size={11}/>}>Marcar como realizada</BtnPrimario>
            : <BtnPrimario onClick={() => setAgendamentoTarget({ candidato: c, tipo: 'entrevista' })} icon={<Calendar size={11}/>}>Agendar entrevista</BtnPrimario>
        )}
        {c.status === 'entrevista' && (
          <BtnPrimario onClick={() => router.push(`/pessoas/recrutamento/${c.id}`)} icon={<ClipboardList size={11}/>}>Avaliar</BtnPrimario>
        )}
        {c.status === 'avaliacao_administrativa' && (() => {
          const proximo = computeProximoDeAvaliacaoClient(c);
          const label = proximo === "entrevista_diretoria" ? "Entrevista Diretoria" : "Agendar teste";
          return (
            <BtnPrimario onClick={() => handleAvancar(c, proximo)} loading={avancando === c.id} icon={<ChevronRight size={11}/>}>{label}</BtnPrimario>
          );
        })()}
        {c.status === 'entrevista_diretoria' && (
          <BtnPrimario onClick={() => setAgendamentoTarget({ candidato: c, tipo: 'teste_pratico' })} icon={<Calendar size={11}/>}>Agendar teste</BtnPrimario>
        )}
        {c.status === 'agendamento_teste' && (
          agendamentoTeste
            ? <BtnPrimario onClick={() => handleMarcarRealizado(c, 'teste_pratico')} loading={marcandoRealizado === c.id} icon={<CheckSquare size={11}/>}>Marcar como realizado</BtnPrimario>
            : <BtnPrimario onClick={() => setAgendamentoTarget({ candidato: c, tipo: 'teste_pratico' })} icon={<Calendar size={11}/>}>Agendar teste</BtnPrimario>
        )}
        {c.status === 'feedback_operacional' && (
          <BtnPrimario onClick={() => router.push(`/pessoas/recrutamento/${c.id}`)} icon={<ClipboardList size={11}/>}>Avaliar (gestor)</BtnPrimario>
        )}
        {c.status === 'decisao' && (
          <BtnPrimario onClick={() => handleAvancar(c)} loading={avancando === c.id} icon={<UserCheck size={11}/>} cor="#16A34A">Aprovar</BtnPrimario>
        )}
        {(c.status === 'aprovado' || c.status === 'contratado') && (
          <BtnPrimario onClick={() => router.push(`/pessoas/recrutamento/${c.id}`)} icon={<UserCheck size={11}/>} cor="#16A34A">Contratar</BtnPrimario>
        )}

        {(agendamentoEntrevista?.google_meet_link ?? agendamentoTeste?.google_meet_link) && (
          <a
            href={agendamentoEntrevista?.google_meet_link ?? agendamentoTeste?.google_meet_link ?? ''}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "4px 0", fontSize: 10, fontWeight: 600, color: "#2563EB", textDecoration: "none" }}
          >
            📹 Entrar no Meet
          </a>
        )}

        {(agendamentoEntrevista ?? agendamentoTeste) && !(agendamentoEntrevista?.google_meet_link ?? agendamentoTeste?.google_meet_link) &&
          (agendamentoEntrevista?.modalidade === 'video' || agendamentoTeste?.modalidade === 'video') && (
          <div style={{ fontSize: 10, color: "#CA8A04", display: "flex", alignItems: "center", gap: 3 }}>
            ⚠️ Meet pendente
          </div>
        )}

        {(agendamentoEntrevista ?? agendamentoTeste) && (
          <div style={{ fontSize: 10, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 3 }}>
            <Calendar size={9} />
            {new Date(agendamentoEntrevista?.data_hora ?? agendamentoTeste!.data_hora).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={() => router.push(`/pessoas/recrutamento/${c.id}`)} style={{ flex: 1, padding: "7px 10px", fontSize: 11, fontWeight: 500, background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }}>Abrir ficha →</button>
          {!['reprovado','desistiu','banco_talentos','contratado','aprovado'].includes(c.status) && (
            <button aria-label={`Reprovar ou mover ${getNome(c)} para o banco de talentos`} title="Reprovar ou mover para o banco" onClick={() => handleReprovar(c)} disabled={reprovando === c.id} style={{ padding: "7px 10px", fontSize: 11, background: "rgba(220,38,38,0.06)", color: "#ff9189", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 6, cursor: "pointer" }}>✗</button>
          )}
        </div>
      </div>
    );
  }

  function executarReprovar(status: "reprovado" | "banco_talentos", motivo?: string) {
    const c = reprovarTarget;
    if (!c) return;
    setReprovarTarget(null);
    setReprovando(c.id);
    const observacao = motivo ? `[Motivo: ${motivo}]` : undefined;
    startTransition(async () => {
      const r = await moverCandidato(c.id, status, observacao);
      setReprovando(null);
      if (!r.success) toast.error(r.error ?? "Erro ao mover candidato");
      else toast.success(status === "banco_talentos" ? "Movido para Banco de Talentos" : "Candidato reprovado");
      router.refresh();
    });
  }

  async function handleSyncMaya() {
    setSyncing(true);
    try {
      const res = await fetch("/api/pessoas/recrutamento/sync-maya", { method: "POST" });
      const data = await res.json();
      if (data.ok === false) {
        toast.error(`Erro na sincronização: ${data.error ?? "desconhecido"}`);
      } else {
        const n = data.synced ?? data.criados ?? 0;
        toast.success(n > 0 ? `${n} candidato(s) sincronizado(s) da Maya` : "Nenhuma nova conversa concluída da Maya");
        router.refresh();
      }
    } catch (e) {
      console.error("[handleSyncMaya]", e);
      toast.error("Erro ao sincronizar com a Maya.");
    } finally {
      setSyncing(false);
    }
  }

  function renderCandidateCard(c: Candidato) {
    const nome = getNome(c);
    const dias = diasNaEtapa(c);
    const slaGrupo = c.job_openings?.cargo_grupos?.sla_dias_uteis ?? null;
    // Stage age, summary and card use the same existing stage SLA.
    // The overall job-group deadline remains separate below.
    const sla = calcularSlaStatus(c.status, c.updated_at ?? c.created_at);
    const slaProcesso = slaGrupo ? calcularSlaStatus(c.status, c.created_at, slaGrupo) : null;
    const vaga = c.job_openings;
    return (
      <div
        key={c.id}
        className="recruit-card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "14px 14px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Barra de SLA */}
        <div style={{ height: 3, borderRadius: "10px 10px 0 0", background: SLA_COR[sla], margin: "-14px -14px 4px" }} />
        <div className="recruit-card-stage"><span>{COLUNAS.find(stage => stage.id === c.status)?.label}</span><b>{String(COLUNAS.findIndex(stage => stage.id === c.status) + 1).padStart(2, "0")} / 11</b></div>
        {/* Inicial + nome + origem */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: `${ORIGEM_COR[c.origem] ?? "#64748B"}20`, color: ORIGEM_COR[c.origem] ?? "#64748B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, marginTop: 1 }}>
            {nome.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <button
              onClick={() => router.push(`/pessoas/recrutamento/${c.id}`)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", width: "100%" }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{nome}</div>
              {c.area_interesse && (
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2, textTransform: "capitalize" }}>
                  {c.area_interesse}
                </div>
              )}
            </button>
          </div>
          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: `${ORIGEM_COR[c.origem] ?? "#64748B"}18`, color: ORIGEM_COR[c.origem] ?? "#64748B", border: `1px solid ${ORIGEM_COR[c.origem] ?? "#64748B"}30` }}>
            {ORIGEM_LABEL[c.origem] ?? c.origem}
          </span>
        </div>

        {/* Vaga */}
        {vaga && (
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {vaga.cargo ?? vaga.title ?? "Sem vaga vinculada"}
            {vaga.area ? ` · ${vaga.area}` : ""}
          </div>
        )}

        {/* Telefone / aviso sem telefone / número inválido */}
        {c.telefone && isNumeroWhatsAppValido(c.telefone) ? (
          <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>{c.telefone}</div>
        ) : c.telefone ? (
          <div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626" }}>✗ Nº inválido: {c.telefone}</div>
        ) : (
          <div style={{ fontSize: 10, fontWeight: 700, color: "#CA8A04" }}>⚠ Sem telefone</div>
        )}

        {/* Score Maya + tempo + CV */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {c.nota_maya != null && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#CA8A04", fontWeight: 600 }}>
              <Star size={11} fill="#CA8A04" />{c.nota_maya.toFixed(1)}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: sla === "ok" ? "var(--text-3)" : sla === "atrasado" ? "#ff9189" : "#FCD616", fontWeight: sla === "ok" ? 400 : 600 }}>
            <Clock size={11} />{dias}d na etapa
          </div>
          {sla !== "ok" && (
            <span
              title={`Este candidato está há ${dias} dias neste estágio. Recomendamos tomar uma ação ou registrar uma atualização.`}
              style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: SLA_COR[sla], padding: "1px 7px", borderRadius: 99, cursor: "help" }}
            >
              {SLA_LABEL[sla]}
            </span>
          )}
          {c.cv_storage_path && (
            <span title="CV anexado" style={{ marginLeft: "auto", display: "flex", alignItems: "center", color: "#2563EB", opacity: 0.7 }}>
              <Paperclip size={11} />
            </span>
          )}
          {(() => {
            const agIa = c.agendamentos?.find((a) => a.tipo === "entrevista" && a.resumo_ia);
            if (!agIa) return null;
            const parecerRaw = agIa.resumo_ia;
            const parecer = !parecerRaw ? null :
              typeof parecerRaw === 'string' ? (() => { try { return JSON.parse(parecerRaw as unknown as string); } catch { return null; } })() :
              parecerRaw;
            const nota = parecer?.nota_ia ?? null;
            const avaliados = parecer?.criterios_avaliados ?? null;
            const cor = nota == null ? '#4F46E5' : nota >= 8 ? '#16A34A' : nota >= 6 ? '#92400E' : '#DC2626';
            const bg = nota == null ? 'rgba(79,70,229,0.12)' : nota >= 8 ? 'rgba(22,163,74,0.1)' : nota >= 6 ? 'rgba(202,138,4,0.1)' : 'rgba(220,38,38,0.1)';
            const label = nota != null && avaliados != null
              ? `IA ${nota.toFixed(1)} (${avaliados}/8)`
              : 'IA';
            return (
              <span title="Parecer IA disponível" style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: bg, color: cor, whiteSpace: "nowrap" }}>
                {label}
              </span>
            );
          })()}
        </div>

        {slaProcesso && <div style={{ fontSize: 10, color: "var(--text-3)" }}>Prazo geral da vaga: {SLA_LABEL[slaProcesso].toLowerCase()} · {slaGrupo} dias úteis</div>}

        {/* Habilidades chips — top 3 */}
        {(c.habilidades?.length ?? 0) > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {c.habilidades!.slice(0, 3).map(h => (
              <span key={h} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 76 }}>
                {h}
              </span>
            ))}
            {(c.habilidades?.length ?? 0) > 3 && (
              <span style={{ fontSize: 10, color: "var(--text-3)", padding: "1px 4px" }}>
                +{c.habilidades!.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Ações */}
        {renderAcoes(c)}
      </div>
    );
  }

  const totalPorColuna = (key: CandidatoStatus) => displayed.filter((c) => c.status === key).length;

  const FINAIS = ["reprovado", "desistiu", "banco_talentos"];
  const metricas = {
    ativos: candidatos.filter((c) => !FINAIS.includes(c.status)).length,
    triagem: candidatos.filter((c) => c.status === "triagem").length,
    atrasados: candidatos.filter((c) => calcularSlaStatus(c.status, c.updated_at ?? c.created_at) === "atrasado").length,
    banco: candidatos.filter((c) => c.status === "banco_talentos").length,
  };

  return (
    <div className="recruit-console">
      {/* Métricas rápidas */}
      <div className="recruit-summary" aria-label="Resumo geral do recrutamento">
        <button onClick={clearFilters} aria-pressed={!filterEtapa && !onlyLate && !search && !filterVaga && !filterOrigem}><strong>{metricas.ativos}</strong><span>Em processo<small>Ver todos os ativos</small></span></button>
        <button className="recruit-late" onClick={() => { clearFilters(); setOnlyLate(true); }} aria-pressed={onlyLate}><strong>{metricas.atrasados}</strong><span>Prazo da etapa vencido<small>Ver quem precisa de atenção</small></span></button>
        <button onClick={() => { clearFilters(); setFilterEtapa("triagem"); }} aria-pressed={filterEtapa === "triagem"}><strong>{metricas.triagem}</strong><span>Em triagem<small>Revisar perfis recebidos</small></span></button>
        <a href="/pessoas/recrutamento/banco-talentos"><strong>{metricas.banco}</strong><span>Banco de talentos<small>Explorar perfis →</small></span></a>
      </div>

      {/* Filtros + ações */}
      <div className="recruit-toolbar">
        <label className="recruit-search"><Search size={16} aria-hidden="true" /><input aria-label="Buscar candidato, vaga ou telefone" placeholder="Buscar candidato, vaga ou telefone…" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <select
          aria-label="Filtrar por vaga"
          value={filterVaga}
          onChange={(e) => setFilterVaga(e.target.value)}
          style={selectStyle}
        >
          <option value="">Todas as vagas</option>
          {vagas.map((v) => (
            <option key={v.id} value={v.id}>
              {v.cargo ?? v.title ?? v.id}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por origem"
          value={filterOrigem}
          onChange={(e) => setFilterOrigem(e.target.value)}
          style={selectStyle}
        >
          <option value="">Todas as origens</option>
          {Object.entries(ORIGEM_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleSyncMaya}
          disabled={syncing}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(252,214,22,0.08)", color: "var(--brasa)", border: "1px solid rgba(252,214,22,0.2)", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: syncing ? 0.6 : 1 }}
        >
          <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
          {syncing ? "Sincronizando…" : "Sincronizar Maya"}
        </button>

        <button
          onClick={() => setModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--brand)", color: "var(--primary-foreground)", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={14} /> Novo candidato
        </button>
      </div>

      <div className="recruit-viewbar">
        <div><h2>{view === "prioridades" ? "Sua fila de trabalho" : "Pipeline completo"}</h2><p>{view === "prioridades" ? "Prazos da etapa vencidos primeiro. Depois, maior tempo na etapa." : "As 11 etapas do processo. Selecione uma etapa abaixo para focar."}</p></div>
        <div className="recruit-segment" aria-label="Visualização">
          <button aria-pressed={view === "prioridades"} onClick={() => setView("prioridades")}><ListFilter size={14} /> Prioridades</button>
          <button aria-pressed={view === "quadro"} onClick={() => setView("quadro")}><LayoutGrid size={14} /> Quadro</button>
        </div>
      </div>
      <nav className="recruit-stage-nav" aria-label="Filtrar pelas 11 etapas">
        {COLUNAS.map((stage, i) => <button key={stage.id} title={stage.descricao} aria-pressed={filterEtapa === stage.id} onClick={() => setFilterEtapa(filterEtapa === stage.id ? "" : stage.id)}><small>{String(i + 1).padStart(2, "0")}</small><strong>{totalPorColuna(stage.id)}</strong><span>{stage.label}</span></button>)}
      </nav>
      <label className="recruit-mobile-stage">Etapa do processo
        <select aria-label="Etapa do processo" value={filterEtapa} onChange={e => setFilterEtapa(e.target.value as CandidatoStatus | "")}>
          <option value="">Todas as 11 etapas</option>
          {COLUNAS.map(stage => <option key={stage.id} value={stage.id}>{stage.label} ({totalPorColuna(stage.id)})</option>)}
        </select>
      </label>
      <div className="recruit-filter-note" aria-live="polite">
        <span>{prioritized.length} candidato{prioritized.length !== 1 ? "s" : ""} exibido{prioritized.length !== 1 ? "s" : ""} · {filterEtapa ? COLUNAS.find(s => s.id === filterEtapa)?.label : "Todas as etapas"}{onlyLate ? " · Prazo da etapa vencido" : ""}</span>
        {(search || filterVaga || filterOrigem || filterEtapa || onlyLate) && <button className="recruit-reset" onClick={clearFilters}>Limpar filtros ×</button>}
      </div>

      {modalOpen && (
        <NovoCandidatoModal
          vagas={vagas}
          options={options}
          cargosCanon={cargosCanon}
          onClose={() => setModalOpen(false)}
          onCreated={() => { setModalOpen(false); router.refresh(); }}
        />
      )}

      {reprovarTarget && (
        <ReprovarModal
          nome={reprovarTarget.nome ?? reprovarTarget.full_name ?? "este candidato"}
          onBanco={(motivo) => executarReprovar("banco_talentos", motivo)}
          onReprovar={(motivo) => executarReprovar("reprovado", motivo)}
          onClose={() => setReprovarTarget(null)}
        />
      )}

      {agendamentoTarget && (
        <AgendamentoModal
          candidato={agendamentoTarget.candidato}
          tipo={agendamentoTarget.tipo}
          units={options.units}
          onClose={() => setAgendamentoTarget(null)}
          onSaved={() => { setAgendamentoTarget(null); router.refresh(); }}
        />
      )}

      {/* Kanban Board */}
      {candidatos.length === 0 ? (
        <EmptyPipeline onNovo={() => setModalOpen(true)} />
      ) : prioritized.length === 0 ? (
        <div className="recruit-empty"><strong>Nenhum candidato nesta seleção</strong><p>Escolha outra etapa ou limpe os filtros para retomar a visão geral.</p><button className="recruit-reset" onClick={clearFilters}>Ver todos os candidatos</button></div>
      ) : view === "prioridades" ? (
        <div className="recruit-priority-grid">{prioritized.map(renderCandidateCard)}</div>
      ) : (
      <div style={{ position: "relative" }}>
      {/* Mobile fade hint */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 12, width: 40, zIndex: 1, pointerEvents: "none",
        background: "linear-gradient(to left, var(--background, #1A1A1A) 0%, transparent 100%)",
      }} className="sm:hidden" />
      <div style={{
        display: "flex",
        gap: 14,
        overflowX: "auto",
        paddingBottom: 12,
        alignItems: "flex-start",
      }}>
        {COLUNAS.filter(col => !filterEtapa || col.id === filterEtapa).map((col) => {
          const cards = visible.filter((c) => c.status === col.id);
          return (
            <div key={col.id} style={{ display: "flex", flexDirection: "column", gap: 0, width: 280, flexShrink: 0, flexGrow: 0 }}>
              {/* Header da coluna */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", marginBottom: 10,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderTop: `3px solid ${col.cor}`, borderRadius: 8,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", cursor: "help" }} title={col.descricao}>{col.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: col.cor, background: `${col.cor}18`, padding: "2px 8px", borderRadius: 99 }}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cards.length === 0 ? (
                  <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-3)", fontSize: 12, border: "1px dashed var(--border)", borderRadius: 8, lineHeight: 1.5 }}>
                    Nenhum candidato nesta etapa.
                  </div>
                ) : (
                  cards.map(renderCandidateCard)
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      )}

      {/* Reprovados / Desistências — coluna colapsável */}
      <ReprovadosPanel candidatos={displayed} filterVaga={filterVaga} filterOrigem={filterOrigem} />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ReprovadosPanel({ candidatos, filterVaga, filterOrigem }: { candidatos: Candidato[]; filterVaga: string; filterOrigem: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const reprovados = candidatos.filter((c) => {
    if (!["reprovado", "desistiu", "banco_talentos"].includes(c.status)) return false;
    if (filterVaga && c.job_opening_id !== filterVaga) return false;
    if (filterOrigem && c.origem !== filterOrigem) return false;
    return true;
  });

  if (reprovados.length === 0) return null;

  return (
    <div style={{ marginTop: 28, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--surface-2)", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}
      >
        <span>Finalizados — Reprovados / Desistências / Banco de Talentos ({reprovados.length})</span>
        <span style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, padding: 14, background: "var(--surface)" }}>
          {reprovados.map((c) => (
            <div key={c.id} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface-2)", opacity: 0.7 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>{c.nome ?? c.name ?? "—"}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{c.status === "reprovado" ? "Reprovado" : c.status === "banco_talentos" ? "Banco de Talentos" : "Desistiu"}</div>
              <button onClick={() => router.push(`/pessoas/recrutamento/${c.id}`)} style={{ marginTop: 6, padding: "3px 8px", fontSize: 10, background: "none", border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", color: "var(--text-3)" }}>Ver</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  height: 34, padding: "0 12px", background: "var(--background)", color: "var(--text)",
  border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, outline: "none", cursor: "pointer",
};


// ── Modal: Agendamento ───────────────────────────────────────────────────────
const agModalLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--text-3)", display: "block", marginBottom: 5 };
const agModalInputStyle: React.CSSProperties = { width: "100%", padding: "8px 11px", fontSize: 13, color: "var(--text)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", boxSizing: "border-box" };

export function AgendamentoModal({
  candidato, tipo, units, onClose, onSaved,
}: { candidato: Candidato; tipo: 'entrevista' | 'teste_pratico'; units: { id: string; name: string }[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    data: '', hora: '10:00', duracao: 60,
    modalidade: '' as 'presencial' | 'video' | 'telefone' | '',
    local: '', unit_id: '', observacoes: '',
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalErr, setModalErr] = useState<string | null>(null);
  const [googleWarning, setGoogleWarning] = useState<string | null>(null);

  async function handleSalvar() {
    if (!form.data) { setErro('Informe a data'); return; }
    if (!form.modalidade) {
      setModalErr('Selecione a modalidade da entrevista');
      return;
    }
    setModalErr(null);
    // Verificar se já existe agendamento ativo do mesmo tipo
    const agAtivo = candidato.agendamentos?.find(
      a => a.tipo === tipo && a.status === 'agendado'
    );
    if (agAtivo) {
      const dataExistente = new Date(agAtivo.data_hora).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const confirmar = confirm(
        `Já existe ${tipo === 'entrevista' ? 'uma entrevista' : 'um teste prático'} agendado(a) para ${dataExistente}.\n\nDeseja criar um novo agendamento mesmo assim?`
      );
      if (!confirmar) return;
    }
    setSaving(true);
    setErro(null);
    setGoogleWarning(null);
    const data_hora = `${form.data}T${form.hora}:00-03:00`;
    const res = await criarAgendamento({
      candidate_id: candidato.id,
      tipo,
      data_hora,
      duracao_min: form.duracao,
      modalidade: form.modalidade as 'presencial' | 'video' | 'telefone',
      local: form.local || null,
      unit_id: form.unit_id || null,
      observacoes: form.observacoes || null,
    });
    setSaving(false);
    if (!res.ok) { setErro(res.error ?? 'Erro ao salvar'); return; }
    if (res.googleError) {
      setGoogleWarning(res.googleError);
      // Agendamento foi salvo — chama onSaved mas mantém o modal aberto brevemente para mostrar o aviso
      onSaved();
      return;
    }
    onSaved();
  }

  const tipoLabel = tipo === 'entrevista' ? 'Entrevista' : 'Teste Prático';
  const nome = candidato.nome ?? candidato.full_name ?? candidato.name ?? '—';

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "var(--surface)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>Agendar {tipoLabel}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}><X size={18}/></button>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>{nome}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={agModalLabelStyle}>Data *</label>
              <input type="date" value={form.data} onChange={e => setForm(f=>({...f, data: e.target.value}))} style={agModalInputStyle} />
            </div>
            <div>
              <label style={agModalLabelStyle}>Hora *</label>
              <input type="time" value={form.hora} onChange={e => setForm(f=>({...f, hora: e.target.value}))} style={agModalInputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={agModalLabelStyle}>Duração (min)</label>
              <select value={form.duracao} onChange={e => setForm(f=>({...f, duracao: Number(e.target.value)}))} style={agModalInputStyle}>
                {[30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label style={agModalLabelStyle}>Modalidade *</label>
              <select value={form.modalidade} onChange={e => { setModalErr(null); setForm(f=>({...f, modalidade: e.target.value as 'presencial'|'video'|'telefone'|''})); }} style={agModalInputStyle}>
                <option value="">— Selecione a modalidade —</option>
                <option value="presencial">Presencial</option>
                <option value="video">Vídeo (Meet)</option>
                <option value="telefone">Telefone</option>
              </select>
              {modalErr && <div style={{color: '#DC2626', fontSize: 11, marginTop: 4}}>{modalErr}</div>}
            </div>
          </div>
          {form.modalidade === 'presencial' && (
            <div>
              <label style={agModalLabelStyle}>Local</label>
              <input value={form.local} onChange={e => setForm(f=>({...f, local: e.target.value}))} style={agModalInputStyle} placeholder="Ex: Sala de reunião, Meet & Eat Vila Madalena" />
            </div>
          )}
          <div>
            <label style={agModalLabelStyle}>Unidade</label>
            <select value={form.unit_id} onChange={e => setForm(f=>({...f, unit_id: e.target.value}))} style={agModalInputStyle}>
              <option value="">— Selecione —</option>
              {units.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={agModalLabelStyle}>Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(f=>({...f, observacoes: e.target.value}))} style={{...agModalInputStyle, height: 70, resize: 'none'}} placeholder="Pontos a abordar, vestimenta, documentos..." />
          </div>
        </div>

        {erro && <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, fontSize: 12, color: "#DC2626" }}>{erro}</div>}

        {googleWarning && (
          <div style={{ padding: "10px 14px", background: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.3)", borderRadius: 8, fontSize: 12, color: "#92400e", marginTop: 8 }}>
            ⚠️ Agendamento salvo, mas não foi possível criar o evento no Google Calendar:<br/>
            <span style={{ fontFamily: "monospace", fontSize: 11 }}>{googleWarning}</span><br/>
            <span style={{ color: "var(--text-3)", marginTop: 4, display: "block" }}>Você pode tentar novamente na tela de detalhes do candidato.</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px 0", fontSize: 13, background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleSalvar} disabled={saving} style={{ flex: 2, padding: "9px 0", fontSize: 13, fontWeight: 600, background: "var(--brand)", color: "var(--primary-foreground)", border: "none", borderRadius: 8, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvando…" : `Agendar ${tipoLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Novo candidato (registro manual) ──────────────────────────────
function NovoCandidatoModal({
  vagas,
  options,
  cargosCanon,
  onClose,
  onCreated,
}: {
  vagas: VagaBasic[];
  options: RecrutamentoOptions;
  cargosCanon: CargoCanon[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    area_interesse: "",
    cargo_id: null as string | null,
    origem: "" as FonteCandidato | "",
    job_opening_id: "",
    unit_id: "",
    observacoes: "",
  });
  const [saving, setSaving] = useState(false);
  const cvRef = useRef<HTMLInputElement>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [aiAnalisando, setAiAnalisando] = useState(false);
  const [aiErro, setAiErro] = useState<string | null>(null);
  const [aiSuggestedFields, setAiSuggestedFields] = useState<Set<string>>(new Set());
  const [mostrarCurriculo, setMostrarCurriculo] = useState(false);
  const [curriculo, setCurriculo] = useState({
    escolaridade_nivel: "",
    pretensao_salarial: "",
    disponibilidade_inicio: "",
    cidade: "",
    bairro: "",
    turnos_disponiveis: [] as string[],
    habilidades: [] as string[],
    experiencias: [] as Experiencia[],
    formacoes: [] as Formacao[],
    idiomas: [] as Idioma[],
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleAnalisarCV() {
    if (!cvFile) return;
    setAiAnalisando(true);
    setAiErro(null);
    const fd = new FormData();
    fd.append("file", cvFile);
    const res = await parseCurriculoFromUpload(fd);
    setAiAnalisando(false);
    if (!res.ok || !res.rascunho) { setAiErro(res.error ?? "Erro ao analisar CV"); return; }
    const d: CurriculoPayload = res.rascunho;
    const suggested = new Set<string>();
    // Preencher campos básicos do candidato
    if (d.full_name)     { set("full_name", d.full_name); suggested.add("full_name"); }
    if (d.phone)         { set("phone", d.phone); suggested.add("phone"); }
    if (d.area_interesse){ set("area_interesse", d.area_interesse); suggested.add("area_interesse"); }
    // Preencher campos de currículo
    const next = { ...curriculo };
    if (d.escolaridade_nivel)         { next.escolaridade_nivel = d.escolaridade_nivel; suggested.add("escolaridade_nivel"); }
    if (d.pretensao_salarial != null) { next.pretensao_salarial = String(d.pretensao_salarial); suggested.add("pretensao_salarial"); }
    if (d.disponibilidade_inicio)     { next.disponibilidade_inicio = d.disponibilidade_inicio; suggested.add("disponibilidade_inicio"); }
    if (d.cidade)                     { next.cidade = d.cidade; suggested.add("cidade"); }
    if (d.bairro)                     { next.bairro = d.bairro; suggested.add("bairro"); }
    if (d.turnos_disponiveis?.length) { next.turnos_disponiveis = d.turnos_disponiveis; suggested.add("turnos_disponiveis"); }
    if (d.habilidades?.length)        { next.habilidades = d.habilidades; suggested.add("habilidades"); }
    if (d.experiencias?.length)       { next.experiencias = d.experiencias as Experiencia[]; suggested.add("experiencias"); }
    if (d.formacoes?.length)          { next.formacoes = d.formacoes as Formacao[]; suggested.add("formacoes"); }
    if (d.idiomas?.length)            { next.idiomas = d.idiomas as Idioma[]; suggested.add("idiomas"); }
    setCurriculo(next);
    setAiSuggestedFields(suggested);
    setMostrarCurriculo(true);
  }

  async function handleSubmit() {
    if (!form.full_name.trim()) { toast.error("Informe o nome completo"); return; }
    if (!form.phone.replace(/\D/g, "")) { toast.error("Informe o telefone"); return; }
    if (!form.area_interesse.trim()) { toast.error("Informe o cargo pretendido"); return; }
    if (!form.origem) { toast.error("Selecione a fonte do candidato"); return; }
    if (form.email && !form.email.includes("@")) { toast.error("E-mail inválido"); return; }
    setSaving(true);
    const res = await createCandidate({
      full_name: form.full_name,
      phone: form.phone,
      email: form.email || null,
      area_interesse: form.area_interesse,
      cargo_id: form.cargo_id,
      origem: form.origem as FonteCandidato,
      job_opening_id: form.job_opening_id || null,
      unit_id: form.unit_id || null,
      observacoes: form.observacoes || null,
    });
    if (!res.success || !res.candidate_id) {
      setSaving(false);
      toast.error(`Erro ao salvar: ${res.error}`);
      return;
    }
    const cid = res.candidate_id;
    const postOps: Promise<unknown>[] = [];
    if (mostrarCurriculo) {
      postOps.push(updateCandidatoCurriculo(cid, {
        escolaridade_nivel: curriculo.escolaridade_nivel || null,
        pretensao_salarial: curriculo.pretensao_salarial ? parseFloat(curriculo.pretensao_salarial) : null,
        disponibilidade_inicio: curriculo.disponibilidade_inicio || null,
        turnos_disponiveis: curriculo.turnos_disponiveis,
        cidade: curriculo.cidade || null,
        bairro: curriculo.bairro || null,
        habilidades: curriculo.habilidades,
        experiencias: curriculo.experiencias,
        formacoes: curriculo.formacoes,
        idiomas: curriculo.idiomas,
      }));
    }
    if (cvFile) {
      const fd = new FormData();
      fd.append("file", cvFile);
      postOps.push(uploadCandidatoCV(cid, fd));
    }
    if (postOps.length > 0) {
      const results = await Promise.allSettled(postOps);
      results.forEach((r, i) => {
        if (r.status === "rejected") console.error("[NovoCandidato] post-create op failed:", i, r.reason);
      });
    }
    setSaving(false);
    toast.success("Candidato registrado na coluna Novo");
    onCreated();
  }

  // Helpers AI (inline — não exportados; não há "use server" neste arquivo)
  const mInputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 11px", fontSize: 13, color: "var(--text)",
    background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, outline: "none",
  };
  const aiInputStyle = (field: string): React.CSSProperties =>
    aiSuggestedFields.has(field) ? { ...mInputStyle, background: "#FFFBEB", borderColor: "#D97706", color: "#2C2C2A", fontWeight: 500 } : mInputStyle;
  const clearAI = (...fields: string[]) =>
    setAiSuggestedFields(prev => { const n = new Set(prev); fields.forEach(f => n.delete(f)); return n; });
  const AiBadge = ({ field }: { field: string }) =>
    aiSuggestedFields.has(field)
      ? <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E", background: "#FDE68A", padding: "1px 6px", borderRadius: 4, marginLeft: 6, verticalAlign: "middle" }}>IA</span>
      : null;
  const lStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 4 };
  const secStyle: React.CSSProperties = { marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--text)" }}>Novo candidato</h2>
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: "3px 0 0" }}>Registre um candidato de indicação, portal ou mutirão.</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label={<>Nome completo *<AiBadge field="full_name" /></>}>
            <input value={form.full_name} onChange={(e) => { set("full_name", e.target.value); clearAI("full_name"); }} style={aiInputStyle("full_name")} placeholder="Ex: João da Silva" />
          </Field>
          <Field label={<>Telefone / WhatsApp *<AiBadge field="phone" /></>}>
            <input value={form.phone} onChange={(e) => { set("phone", e.target.value); clearAI("phone"); }} style={aiInputStyle("phone")} placeholder="Ex: 11 98765-4321" inputMode="tel" />
          </Field>
          <Field label="E-mail">
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inputStyle} placeholder="Ex: joao@email.com" />
          </Field>
          <Field label={<>Cargo pretendido *<AiBadge field="area_interesse" /></>}>
            <CargoCombobox
              cargos={cargosCanon}
              value={form.area_interesse}
              cargoId={form.cargo_id}
              onChange={(value, cargoId) => {
                setForm((f) => ({ ...f, area_interesse: value, cargo_id: cargoId }));
                clearAI("area_interesse");
              }}
              style={aiInputStyle("area_interesse")}
            />
          </Field>
          <Field label="Fonte *">
            <select value={form.origem} onChange={(e) => set("origem", e.target.value as FonteCandidato | "")} style={{ ...inputStyle, borderColor: !form.origem ? "#CA8A04" : undefined }}>
              <option value="">Selecione a fonte…</option>
              {FONTES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="Vaga relacionada">
            <select value={form.job_opening_id} onChange={(e) => set("job_opening_id", e.target.value)} style={inputStyle}>
              <option value="">— Sem vaga específica —</option>
              {vagas.map((v) => <option key={v.id} value={v.id}>{v.cargo ?? v.title ?? v.id}</option>)}
            </select>
          </Field>
          <Field label="Unidade">
            <select value={form.unit_id} onChange={(e) => set("unit_id", e.target.value)} style={inputStyle}>
              <option value="">— Não definida —</option>
              {options.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Observações">
            <textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} placeholder="Indicado por fulano. Tem experiência em bar de hotel." />
          </Field>
        </div>

        {/* ── CV + IA ────────────────────────────────── */}
        <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 8 }}>Arquivo de CV (opcional)</div>
          <input
            ref={cvRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0] ?? null; setCvFile(f); if (!f) setMostrarCurriculo(false); }}
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => cvRef.current?.click()}
              style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "none", fontSize: 12, cursor: "pointer", color: "var(--text-2)" }}
            >
              {cvFile ? `📎 ${cvFile.name}` : "Anexar CV"}
            </button>
            {cvFile && (
              <button
                onClick={handleAnalisarCV}
                disabled={aiAnalisando}
                style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #7C3AED", background: "none", color: "#7C3AED", fontSize: 12, cursor: aiAnalisando ? "not-allowed" : "pointer", opacity: aiAnalisando ? 0.7 : 1, fontWeight: 600 }}
              >
                {aiAnalisando ? "Lendo…" : "✨ Analisar CV"}
              </button>
            )}
          </div>
          {aiErro && <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6 }}>{aiErro}</div>}
        </div>

        {/* ── Currículo pré-preenchido pela IA ─────── */}
        {mostrarCurriculo && (
          <div style={{ marginTop: 10, border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: "6px 10px", background: "#FFFBEB", border: "1px solid #D97706", borderRadius: 6, fontSize: 11, color: "#92400E" }}>
              ✨ Dados extraídos pela IA — revise os campos marcados com <strong>IA</strong> antes de cadastrar.
            </div>

            {/* Dados básicos 2 colunas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={lStyle}>Escolaridade<AiBadge field="escolaridade_nivel" /></label>
                <select
                  value={curriculo.escolaridade_nivel}
                  onChange={e => { setCurriculo(c => ({ ...c, escolaridade_nivel: e.target.value })); clearAI("escolaridade_nivel"); }}
                  style={aiInputStyle("escolaridade_nivel")}
                >
                  <option value="">— selecionar —</option>
                  {ESCOLARIDADE_SLUGS.map(s => <option key={s} value={s}>{ESCOLARIDADE_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label style={lStyle}>Pretensão (R$)<AiBadge field="pretensao_salarial" /></label>
                <input
                  type="number" min={0} step={100}
                  value={curriculo.pretensao_salarial}
                  onChange={e => { setCurriculo(c => ({ ...c, pretensao_salarial: e.target.value })); clearAI("pretensao_salarial"); }}
                  style={aiInputStyle("pretensao_salarial")}
                  placeholder="Ex: 2500"
                />
              </div>
              <div>
                <label style={lStyle}>Disponível a partir de<AiBadge field="disponibilidade_inicio" /></label>
                <input
                  type="date"
                  value={curriculo.disponibilidade_inicio}
                  onChange={e => { setCurriculo(c => ({ ...c, disponibilidade_inicio: e.target.value })); clearAI("disponibilidade_inicio"); }}
                  style={aiInputStyle("disponibilidade_inicio")}
                />
              </div>
              <div />
              <div>
                <label style={lStyle}>Cidade<AiBadge field="cidade" /></label>
                <input
                  value={curriculo.cidade}
                  onChange={e => { setCurriculo(c => ({ ...c, cidade: e.target.value })); clearAI("cidade"); }}
                  style={aiInputStyle("cidade")}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div>
                <label style={lStyle}>Bairro<AiBadge field="bairro" /></label>
                <input
                  value={curriculo.bairro}
                  onChange={e => { setCurriculo(c => ({ ...c, bairro: e.target.value })); clearAI("bairro"); }}
                  style={aiInputStyle("bairro")}
                  placeholder="Ex: Moema"
                />
              </div>
            </div>

            {/* Turnos */}
            <div style={secStyle}>
              <label style={lStyle}>Turnos disponíveis<AiBadge field="turnos_disponiveis" /></label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {TURNOS.map(t => (
                  <label key={t.value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={curriculo.turnos_disponiveis.includes(t.value)}
                      onChange={() => { setCurriculo(c => ({ ...c, turnos_disponiveis: c.turnos_disponiveis.includes(t.value) ? c.turnos_disponiveis.filter(x => x !== t.value) : [...c.turnos_disponiveis, t.value] })); clearAI("turnos_disponiveis"); }}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Experiências */}
            {curriculo.experiencias.length > 0 && (
              <div style={secStyle}>
                <label style={lStyle}>Experiências<AiBadge field="experiencias" /></label>
                {curriculo.experiencias.map((exp, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6, padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}>
                    <input value={exp.empresa} onChange={e => { const arr = [...curriculo.experiencias]; arr[i] = { ...arr[i], empresa: e.target.value } as Experiencia; setCurriculo(c => ({ ...c, experiencias: arr })); clearAI("experiencias"); }} style={{ ...mInputStyle, gridColumn: "1 / -1" }} placeholder="Empresa" />
                    <input value={exp.cargo} onChange={e => { const arr = [...curriculo.experiencias]; arr[i] = { ...arr[i], cargo: e.target.value } as Experiencia; setCurriculo(c => ({ ...c, experiencias: arr })); clearAI("experiencias"); }} style={mInputStyle} placeholder="Cargo" />
                    <input value={exp.inicio} onChange={e => { const arr = [...curriculo.experiencias]; arr[i] = { ...arr[i], inicio: e.target.value } as Experiencia; setCurriculo(c => ({ ...c, experiencias: arr })); clearAI("experiencias"); }} style={mInputStyle} placeholder="Início MM/AAAA" />
                  </div>
                ))}
              </div>
            )}

            {/* Formações */}
            {curriculo.formacoes.length > 0 && (
              <div style={secStyle}>
                <label style={lStyle}>Formação<AiBadge field="formacoes" /></label>
                {curriculo.formacoes.map((fm, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6, padding: 8, border: "1px solid var(--border)", borderRadius: 6 }}>
                    <input value={fm.curso} onChange={e => { const arr = [...curriculo.formacoes]; arr[i] = { ...arr[i], curso: e.target.value } as Formacao; setCurriculo(c => ({ ...c, formacoes: arr })); clearAI("formacoes"); }} style={mInputStyle} placeholder="Curso" />
                    <input value={fm.instituicao} onChange={e => { const arr = [...curriculo.formacoes]; arr[i] = { ...arr[i], instituicao: e.target.value } as Formacao; setCurriculo(c => ({ ...c, formacoes: arr })); clearAI("formacoes"); }} style={mInputStyle} placeholder="Instituição" />
                  </div>
                ))}
              </div>
            )}

            {/* Idiomas */}
            {curriculo.idiomas.length > 0 && (
              <div style={secStyle}>
                <label style={lStyle}>Idiomas<AiBadge field="idiomas" /></label>
                {curriculo.idiomas.map((id, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input value={id.idioma} onChange={e => { const arr = [...curriculo.idiomas]; arr[i] = { ...arr[i], idioma: e.target.value } as Idioma; setCurriculo(c => ({ ...c, idiomas: arr })); clearAI("idiomas"); }} style={{ ...mInputStyle, flex: 2 }} placeholder="Idioma" />
                    <input value={id.nivel} onChange={e => { const arr = [...curriculo.idiomas]; arr[i] = { ...arr[i], nivel: e.target.value } as Idioma; setCurriculo(c => ({ ...c, idiomas: arr })); clearAI("idiomas"); }} style={{ ...mInputStyle, flex: 1 }} placeholder="Nível" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600, background: "transparent", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600, background: "var(--brand)", color: "var(--primary-foreground)", border: "none", borderRadius: 8, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Salvando…" : "Cadastrar candidato"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 11px", fontSize: 13, color: "var(--text)",
  background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, outline: "none",
};

// ── Modal: Reprovar → opção de Banco de Talentos ─────────────────────────
const MOTIVOS_REPROVACAO = [
  "Experiência insuficiente",
  "Disponibilidade incompatível com a operação",
  "Salário fora da faixa pretendida",
  "Não compareceu à entrevista",
  "Perfil não alinhado à cultura KPH",
  "Vaga preenchida por outro candidato",
  "Documentação incompleta",
  "Candidato desistiu",
] as const;

export function ReprovarModal({
  nome,
  onBanco,
  onReprovar,
  onClose,
}: {
  nome: string;
  onBanco: (motivo?: string) => void;
  onReprovar: (motivo?: string) => void;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, width: "100%", maxWidth: 400 }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text)" }}>Deseja adicionar {nome} ao banco de talentos?</h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, margin: "0 0 18px" }}>
          Candidatos no banco de talentos podem ser reativados quando surgir uma vaga compatível.
        </p>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 4 }}>Motivo da reprovação</label>
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            style={{ width: "100%", padding: "9px 11px", fontSize: 13, color: "var(--text)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, outline: "none" }}
          >
            <option value="">Selecione um motivo (opcional)</option>
            {MOTIVOS_REPROVACAO.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => onBanco(motivo || undefined)}
            style={{ padding: "10px 0", fontSize: 13, fontWeight: 600, background: "rgba(147,51,234,0.1)", color: "#9333EA", border: "1px solid rgba(147,51,234,0.25)", borderRadius: 8, cursor: "pointer" }}
          >
            Adicionar ao banco de talentos
          </button>
          <button
            onClick={() => onReprovar(motivo || undefined)}
            style={{ padding: "10px 0", fontSize: 13, fontWeight: 600, background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, cursor: "pointer" }}
          >
            Apenas reprovar
          </button>
          <button
            onClick={onClose}
            style={{ padding: "9px 0", fontSize: 12, fontWeight: 500, background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state — pipeline vazio ─────────────────────────────────────────
function EmptyPipeline({ onNovo }: { onNovo: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "64px 24px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 14, background: "var(--surface)" }}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 14, background: "var(--surface-2)", color: "var(--text-3)" }}>
        <Briefcase size={24} />
      </span>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Nenhum candidato no pipeline</div>
        <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, margin: "6px auto 0", maxWidth: 420 }}>
          Candidatos da Maya entram automaticamente. Você também pode cadastrar manualmente via indicação, portal ou mutirão.
        </p>
      </div>
      <button
        onClick={onNovo}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "var(--brand)", color: "var(--primary-foreground)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 4 }}
      >
        <Plus size={14} /> Novo candidato
      </button>
    </div>
  );
}
