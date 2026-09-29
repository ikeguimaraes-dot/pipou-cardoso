"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import "../recruitment.css";
import { PromoverModal } from "./PromoverModal";
import { Phone, Mail, Star, Clock, ExternalLink, UserCheck, Calendar, CheckSquare } from "lucide-react";
import { avancarEtapa, moverCandidato, contratarCandidato, updateCandidatoCurriculo, uploadCandidatoCV, getCandidatoCVUrl, parseCurriculoFromCV, salvarAvaliacao, sugerirFatoresObjetivos, marcarAgendamentoRealizado, salvarFeedbackOperacional, recriarEventoGoogle, cancelarAgendamento, setRequerDiretoria, sincronizarTranscricao, gerarRoteiroEntrevista, salvarRoteiroEditado, type Candidato, type CandidatoStatus, type AvaliacaoData, type Agendamento, type FeedbackOperacional, type ParecerIA, type RoteiroEntrevista, type BlocoRoteiro } from "../actions";
import { ESCOLARIDADE_SLUGS, ESCOLARIDADE_LABEL, TURNOS, TURNO_LABEL, type Experiencia, type Formacao, type Idioma, type CurriculoPayload } from "../curriculo-constants";
import { ReprovarModal, AgendamentoModal } from "../KanbanClient";
import { isNumeroWhatsAppValido } from "@/lib/pessoas/utils";

const STATUS_LABEL: Record<string, string> = {
  novo:                     "Candidato",
  triagem:                  "Em Triagem",
  agendamento:              "Agendamento",
  entrevista:               "Entrevista RH",
  avaliacao_administrativa: "Entrevista Gestor",
  entrevista_diretoria:     "Entrevista Diretoria",
  agendamento_teste:        "Agend. Teste",
  feedback_operacional:     "Feedback Op.",
  decisao:                  "Decisão",
  aprovado:                 "Aprovado",
  contratado:               "Contratado",
  reprovado:                "Reprovado",
  desistiu:                 "Desistiu",
  banco_talentos:           "Banco de Talentos",
};

const STATUS_COR: Record<string, string> = {
  novo:                     "#8A8278",
  triagem:                  "#60A5FA",
  agendamento:              "var(--brasa)",
  entrevista:               "#F59E0B",
  avaliacao_administrativa: "#B8975A",
  entrevista_diretoria:     "#0EA5E9",
  agendamento_teste:        "#8B5CF6",
  feedback_operacional:     "#EC4899",
  decisao:                  "#0891B2",
  aprovado:                 "#22C55E",
  contratado:               "#16A34A",
  reprovado:                "#DC2626",
  desistiu:                 "#9333EA",
  banco_talentos:           "#9333EA",
};

const ETAPA_LABEL: Record<string, string> = {
  triagem:             "Triagem",
  entrevista_rh:       "Entrevista RH",
  entrevista_gestor:   "Entrevista Gestor",
  proposta:            "Proposta",
  admissao:            "Admissão",
};


const ORIGEM_LABEL: Record<string, string> = {
  maya:          "Maya (WhatsApp)",
  maya_whatsapp: "Maya (WhatsApp)",
  indicacao:     "Indicação",
  portal:        "Portal",
  mutirao:       "Mutirão",
  manual:        "Manual",
  outro:         "Outro",
};

type ContratoState = {
  pending: boolean;
  result: { ok: boolean; nome?: string; employeeId?: string; notificacao_ok?: boolean; welcome_message_sid?: string | null; error?: string } | null;
};

export function CandidatoClient({
  candidato: c,
  avaliacao: avaliacaoInicial,
  agendamentos: agendamentosIniciais,
  feedbackOperacional: feedbackInicialOp,
}: {
  candidato: Candidato;
  avaliacao: AvaliacaoData | null;
  agendamentos: Agendamento[];
  feedbackOperacional: FeedbackOperacional | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [contrato, setContrato] = useState<ContratoState>({ pending: false, result: null });
  const [reprovarOpen, setReprovarOpen] = useState(false);
  const [confirmarContratar, setConfirmarContratar] = useState(false);
  const [avaliacaoCompleta, setAvaliacaoCompleta] = useState(
    () => !!(avaliacaoInicial?.aderencia_skills != null && avaliacaoInicial?.experiencia != null && avaliacaoInicial?.entrevista_tec != null && avaliacaoInicial?.entrevista_comp != null)
  );
  const sortAgs = (ags: Agendamento[]) => [...ags].sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  const [agendamentos, setAgendamentos] = useState(() => sortAgs(agendamentosIniciais));
  useEffect(() => { setAgendamentos(sortAgs(agendamentosIniciais)); }, [agendamentosIniciais]); // sync após router.refresh()
  const [agendamentoModalTipo, setAgendamentoModalTipo] = useState<'entrevista' | 'teste_pratico' | null>(null);
  const [marcandoRealizado, setMarcandoRealizado] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [gerandoRoteiro, setGerandoRoteiro] = useState(false);
  const [salvandoRoteiro, setSalvandoRoteiro] = useState(false);
  const [roteiroEditando, setRoteiroEditando] = useState(false);
  const [roteiroLocal, setRoteiroLocal] = useState<RoteiroEntrevista | null>(null);
  const [feedbackOpCompleta, setFeedbackOpCompleta] = useState(
    () => !!(feedbackInicialOp?.postura_apresentacao != null && feedbackInicialOp?.ritmo_sob_pressao != null &&
             feedbackInicialOp?.dominio_tecnico != null && feedbackInicialOp?.higiene_seguranca != null &&
             feedbackInicialOp?.trabalho_em_equipe != null)
  );

  const nome = c.nome ?? c.name ?? "—";
  const telefone = c.telefone;
  const telefoneValido = !!telefone && isNumeroWhatsAppValido(telefone);
  const statusCor = STATUS_COR[c.status] ?? "#64748B";
  const pipeline = c.candidate_pipeline ?? [];

  const [statusErro, setStatusErro] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  async function handleStatus(newStatus: CandidatoStatus) {
    setStatusErro(null);
    setIsActing(true);
    const res = await avancarEtapa(c.id, newStatus);
    setIsActing(false);
    if (!res.ok && res.error) {
      setStatusErro(res.error);
    } else {
      router.refresh();
    }
  }

  async function handleContratar() {
    setContrato({ pending: true, result: null });
    const res = await contratarCandidato(c.id);
    setContrato({ pending: false, result: res });
    if (res.ok) router.refresh();
  }

  async function executarReprovar(status: "reprovado" | "banco_talentos", motivo?: string) {
    setReprovarOpen(false);
    const observacao = motivo ? `[Motivo: ${motivo}]` : undefined;
    setIsActing(true);
    await moverCandidato(c.id, status, observacao);
    setIsActing(false);
    router.refresh();
  }

  async function handleDesistiu() {
    if (!confirm('Confirmar: o candidato desistiu do processo?')) return;
    setIsActing(true);
    await moverCandidato(c.id, "desistiu");
    setIsActing(false);
    router.refresh();
  }

  return (
    <div className="candidate-layout">
      {/* Coluna principal */}
      <div className="candidate-main">
        <section className="candidate-mission">
          <small>Etapa atual · {STATUS_LABEL[c.status] ?? c.status}</small>
          <h2>{c.status === "avaliacao_administrativa" && !avaliacaoCompleta ? "Complete a avaliação para avançar" : c.status === "feedback_operacional" && !feedbackOpCompleta ? "Registre o resultado do teste prático" : "A próxima decisão começa aqui"}</h2>
          <p>{c.status === "avaliacao_administrativa" ? "Os quatro fatores do Score Card orientam a decisão. O avanço continua condicionado ao preenchimento da avaliação." : c.status === "feedback_operacional" ? "Preencha os cinco fatores do feedback operacional antes de seguir para a decisão." : "Revise o perfil e os registros desta etapa. Use o painel de próximas ações para continuar o processo."}</p>
          <a href={c.status === "avaliacao_administrativa" || c.status === "feedback_operacional" ? "#avaliacao" : "#proximas-acoes"}>{c.status === "avaliacao_administrativa" || c.status === "feedback_operacional" ? "Ir para a avaliação ↓" : "Ver próximas ações →"}</a>
        </section>
        <div id="avaliacao">
        {c.status === "avaliacao_administrativa" && (
          <ScoreCardSection
            candidateId={c.id}
            cargo={c.area_interesse ?? c.job_openings?.cargo ?? c.job_openings?.title ?? null}
            initialAvaliacao={avaliacaoInicial}
            onCompleted={setAvaliacaoCompleta}
          />
        )}

        {(c.status === "feedback_operacional" || feedbackInicialOp != null) && (
          <FeedbackOperacionalSection
            candidateId={c.id}
            agendamentoId={agendamentos.find(a => a.tipo === 'teste_pratico' && a.status === 'realizado')?.id ?? null}
            initialFeedback={feedbackInicialOp}
            onCompleted={setFeedbackOpCompleta}
          />
        )}

        </div>
        {/* Card de dados */}
        <section id="perfil" style={sectionStyle}>
          <SectionTitle>Dados do candidato</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <InfoField label="Nome" value={nome} />
            <InfoField label="Status" value={
              <span style={{ fontWeight: 600, color: statusCor }}>{STATUS_LABEL[c.status] ?? c.status}</span>
            } />
            <InfoField label="Área de interesse" value={c.area_interesse ?? "—"} />
            <InfoField label="Origem" value={ORIGEM_LABEL[c.origem] ?? c.origem} />
            <InfoField label="WhatsApp" value={
              telefoneValido
                ? <span style={{ fontFamily: "monospace", fontSize: 12 }}>{telefone}</span>
                : telefone
                  ? <span style={{ color: "#DC2626", fontWeight: 600 }}>✗ Inválido: {telefone}</span>
                  : <span style={{ color: "#CA8A04", fontWeight: 600 }}>⚠ Sem telefone</span>
            } />
            <InfoField label="E-mail" value={
              c.email
                ? <a href={`mailto:${c.email}`} style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>{c.email}</a>
                : "—"
            } />
            <InfoField label="Perfil DISC" value={c.disc_profile ?? "—"} />
            {c.nota_maya != null && (
              <InfoField label="Score Maya" value={
                <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#CA8A04", fontWeight: 600 }}>
                  <Star size={13} fill="#CA8A04" />{c.nota_maya.toFixed(1)} / 10
                </span>
              } />
            )}
          </div>

          {/* Contatos */}
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {telefoneValido ? (
              <a
                href={`https://wa.me/55${telefone!.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(34,197,94,0.08)", color: "#16A34A", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}
              >
                <Phone size={13} /> Contatar WhatsApp
              </a>
            ) : telefone ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                ✗ Número inválido — WhatsApp não será entregue
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(202,138,4,0.08)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.25)", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                ⚠️ Sem telefone — WhatsApp não será entregue
              </div>
            )}
            {c.email && (
              <a
                href={`mailto:${c.email}`}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}
              >
                <Mail size={13} /> {c.email}
              </a>
            )}
          </div>
        </section>

        <div id="curriculo"><CurriculoSection c={c} /></div>

        {/* ── Entrevista IA — sobe para o topo quando há parecer ── */}
        {(() => {
          const ag = agendamentos.find((a) => a.tipo === "entrevista" && a.status === "realizado");
          if (!ag) return null;

          // resumo_ia é coluna text — defensivo para string ou objeto
          const parecerRaw = ag.resumo_ia;
          const parecer: ParecerIA | null = !parecerRaw
            ? null
            : typeof parecerRaw === 'string'
              ? (() => { try { return JSON.parse(parecerRaw as unknown as string) as ParecerIA; } catch { return null; } })()
              : parecerRaw as ParecerIA;

          async function handleSincronizar() {
            setSincronizando(true);
            const res = await sincronizarTranscricao(ag!.id);
            setSincronizando(false);
            if (!res.ok) alert(`Erro: ${res.error}`);
            else router.refresh();
          }

          const recLabel: Record<string, string> = {
            contratar: "✓ Contratar",
            avaliar: "? Avaliar mais",
            nao_contratar: "✗ Não contratar",
          };
          const recBg: Record<string, string> = {
            contratar: "rgba(22,163,74,0.1)",
            avaliar: "rgba(202,138,4,0.1)",
            nao_contratar: "rgba(220,38,38,0.1)",
          };
          const recColor: Record<string, string> = {
            contratar: "#16A34A",
            avaliar: "#CA8A04",
            nao_contratar: "#DC2626",
          };

          return (
            <section style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <SectionTitle style={{ marginBottom: 0 }}>Entrevista</SectionTitle>
                {ag.transcricao_drive_id && (
                  <a
                    href={`https://docs.google.com/document/d/${ag.transcricao_drive_id}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#2563EB", textDecoration: "none", fontWeight: 600 }}
                  >
                    📖 Ver no Docs
                  </a>
                )}
              </div>

              {parecer ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Header: recomendação + nota_ia */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                      background: recBg[parecer.recomendacao] ?? "var(--surface-2)",
                      color: recColor[parecer.recomendacao] ?? "var(--text)",
                    }}>
                      {recLabel[parecer.recomendacao] ?? parecer.recomendacao}
                    </span>
                    {parecer.nota_ia != null && (
                      <span style={{
                        fontSize: 13, fontWeight: 800, padding: "2px 10px", borderRadius: 8,
                        background: parecer.nota_ia >= 8 ? 'rgba(22,163,74,0.1)' : parecer.nota_ia >= 6 ? 'rgba(202,138,4,0.1)' : 'rgba(220,38,38,0.1)',
                        color: parecer.nota_ia >= 8 ? '#16A34A' : parecer.nota_ia >= 6 ? '#CA8A04' : '#DC2626',
                      }}>
                        {parecer.nota_ia.toFixed(1)} / 10
                      </span>
                    )}
                    {parecer.criterios_avaliados != null && parecer.criterios_total != null && (
                      <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                        {parecer.criterios_avaliados}/{parecer.criterios_total} critérios
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                      Parecer IA · {parecer.gerado_em ? new Date(parecer.gerado_em).toLocaleDateString("pt-BR") : ""}
                    </span>
                  </div>

                  {/* 8 critérios — só mostra se existir */}
                  {parecer.criterios && (() => {
                    const CRITERIO_LABEL: Record<string, string> = {
                      clareza_comunicacao: "Clareza de comunicação",
                      escuta_responsividade: "Escuta e responsividade",
                      experiencia_relatada: "Experiência relatada",
                      dominio_tecnico: "Domínio técnico",
                      trajetoria_estabilidade: "Trajetória e estabilidade",
                      aderencia_ao_cargo: "Aderência ao cargo",
                      motivacao_interesse: "Motivação e interesse",
                      viabilidade_pratica: "Viabilidade prática",
                    };
                    return (
                      <div style={{ borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
                        {Object.entries(parecer.criterios!).map(([key, crit], idx) => {
                          const nota = crit.nota;
                          const corNota = nota == null ? '#9CA3AF' : nota >= 8 ? '#16A34A' : nota >= 6 ? '#CA8A04' : '#DC2626';
                          const bgNota = nota == null ? 'rgba(156,163,175,0.08)' : nota >= 8 ? 'rgba(22,163,74,0.08)' : nota >= 6 ? 'rgba(202,138,4,0.08)' : 'rgba(220,38,38,0.08)';
                          return (
                            <div key={key} style={{ display: "grid", gridTemplateColumns: "40px 140px 1fr", gap: 8, alignItems: "start", padding: "7px 10px", background: idx % 2 === 0 ? "transparent" : "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: corNota, background: bgNota, borderRadius: 6, padding: "2px 0", textAlign: "center" }}>
                                {nota != null ? nota.toFixed(0) : "—"}
                              </span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-2)", alignSelf: "center" }}>{CRITERIO_LABEL[key] ?? key}</span>
                              <span style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.4, alignSelf: "center", fontStyle: nota == null ? "italic" : "normal" }}>{crit.evidencia}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Seções textuais */}
                  {(
                    [
                      { label: "Resumo geral",          value: parecer.resumo_geral },
                      { label: "Experiência relevante", value: parecer.experiencia_relevante },
                      { label: "Fit cultural",          value: parecer.fit_cultural },
                      { label: "Justificativa",         value: parecer.recomendacao_justificativa },
                    ] as { label: string; value: string }[]
                  ).filter((s) => s.value).map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.65 }}>{value}</div>
                    </div>
                  ))}

                  {/* Pontos fortes */}
                  {(parecer.pontos_fortes?.length ?? 0) > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Pontos fortes</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {parecer.pontos_fortes.map((p, i) => (
                          <div key={i} style={{ fontSize: 12, color: "var(--text)", display: "flex", gap: 6, lineHeight: 1.5 }}>
                            <span style={{ color: "#16A34A", fontWeight: 700, flexShrink: 0 }}>+</span>{p}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pontos de atenção */}
                  {(parecer.pontos_atencao?.length ?? 0) > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Pontos de atenção</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {parecer.pontos_atencao.map((p, i) => (
                          <div key={i} style={{ fontSize: 12, color: "var(--text)", display: "flex", gap: 6, lineHeight: 1.5 }}>
                            <span style={{ color: "#DC2626", fontWeight: 700, flexShrink: 0 }}>!</span>{p}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Atualizar parecer */}
                  <button
                    onClick={handleSincronizar}
                    disabled={sincronizando}
                    style={{ fontSize: 10, color: "var(--text-3)", background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", opacity: sincronizando ? 0.5 : 1, alignSelf: "flex-start" }}
                  >
                    {sincronizando ? "Atualizando…" : "↺ Atualizar parecer"}
                  </button>
                </div>
              ) : (
                // Botão para gerar parecer (transcrição ainda não buscada ou geração falhou)
                <button
                  onClick={handleSincronizar}
                  disabled={sincronizando}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", fontSize: 12, fontWeight: 600, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", opacity: sincronizando ? 0.5 : 1, width: "fit-content" }}
                >
                  {sincronizando ? "⏳ Buscando transcrição…" : "🤖 Gerar parecer da entrevista"}
                </button>
              )}
            </section>
          );
        })()}

        {/* Agendamentos */}
        <section style={sectionStyle}>
          <SectionTitle>Agendamentos</SectionTitle>
          {agendamentos.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-3)", padding: "12px 0" }}>
              Nenhum agendamento ainda. Use o painel de Ações para agendar.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {agendamentos.map(ag => (
                <div key={ag.id} style={{ display: "flex", gap: 12, padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                      {ag.tipo === 'entrevista' ? 'Entrevista' : 'Teste Prático'} — {ag.modalidade === 'video' ? 'Vídeo' : ag.modalidade === 'telefone' ? 'Telefone' : 'Presencial'}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-2)", marginTop: 3 }}>
                      {new Date(ag.data_hora).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {ag.duracao_min ? ` · ${ag.duracao_min} min` : ''}
                    </div>
                    {ag.local && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{ag.local}</div>}
                    {ag.google_meet_link && (
                      <a href={ag.google_meet_link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: "#2563EB", textDecoration: "none", fontWeight: 600 }}>📹 Entrar no Meet</a>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: ag.status === 'realizado' ? 'rgba(22,163,74,0.1)' : ag.status === 'cancelado' ? 'rgba(220,38,38,0.1)' : 'rgba(202,138,4,0.1)', color: ag.status === 'realizado' ? '#16A34A' : ag.status === 'cancelado' ? '#DC2626' : '#CA8A04' }}>
                      {ag.status === 'realizado' ? 'Realizado' : ag.status === 'cancelado' ? 'Cancelado' : ag.status === 'nao_compareceu' ? 'Não compareceu' : 'Agendado'}
                    </span>
                    {ag.modalidade === 'video' && !ag.google_meet_link && ag.status === 'agendado' && (
                      <button
                        onClick={async () => {
                          const res = await recriarEventoGoogle(ag.id);
                          if (!res.ok) alert(`Erro: ${res.error}`);
                          else router.refresh();
                        }}
                        style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", background: "rgba(202,138,4,0.08)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.3)", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        ⚠ Criar no Google
                      </button>
                    )}
                    {ag.status === 'agendado' && (
                      <button
                        onClick={async () => {
                          if (!confirm('Cancelar este agendamento?')) return;
                          const res = await cancelarAgendamento(ag.id);
                          if (!res.ok) alert(`Erro: ${res.error}`);
                          else router.refresh();
                        }}
                        style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", background: "rgba(220,38,38,0.06)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Roteiro de Entrevista ── */}
        {(() => {
          const ag = agendamentos.find((a) => a.tipo === "entrevista");
          if (!ag) return null;

          const roteiro: RoteiroEntrevista | null = ag.roteiro_entrevista
            ? (typeof ag.roteiro_entrevista === 'string'
                ? (() => { try { return JSON.parse(ag.roteiro_entrevista as unknown as string); } catch { return null; } })()
                : ag.roteiro_entrevista)
            : null;

          const roteiroAtivo = roteiroEditando ? roteiroLocal : roteiro;

          async function handleGerarRoteiro() {
            setGerandoRoteiro(true);
            const res = await gerarRoteiroEntrevista(ag!.id);
            setGerandoRoteiro(false);
            if (!res.ok) alert(`Erro: ${res.error}`);
            else router.refresh();
          }

          async function handleSalvarRoteiro() {
            if (!roteiroLocal) return;
            setSalvandoRoteiro(true);
            const res = await salvarRoteiroEditado(ag!.id, roteiroLocal);
            setSalvandoRoteiro(false);
            if (!res.ok) alert(`Erro: ${res.error}`);
            else { setRoteiroEditando(false); router.refresh(); }
          }

          function handleEditarPergunta(blocoIdx: number, perguntaIdx: number, novoTexto: string) {
            setRoteiroLocal(prev => {
              if (!prev) return prev;
              const novosBlocos = prev.blocos.map((b, bi) =>
                bi !== blocoIdx ? b : {
                  ...b,
                  perguntas: b.perguntas.map((p, pi) =>
                    pi !== perguntaIdx ? p : { ...p, pergunta: novoTexto }
                  ),
                }
              );
              return { ...prev, blocos: novosBlocos };
            });
          }

          function handleRemoverPergunta(blocoIdx: number, perguntaIdx: number) {
            setRoteiroLocal(prev => {
              if (!prev) return prev;
              const novosBlocos = prev.blocos.map((b, bi) =>
                bi !== blocoIdx ? b : {
                  ...b,
                  perguntas: b.perguntas.filter((_, pi) => pi !== perguntaIdx),
                }
              );
              return { ...prev, blocos: novosBlocos };
            });
          }

          function handleAdicionarPergunta(blocoIdx: number) {
            setRoteiroLocal(prev => {
              if (!prev) return prev;
              const novosBlocos = prev.blocos.map((b, bi) =>
                bi !== blocoIdx ? b : {
                  ...b,
                  perguntas: [...b.perguntas, { pergunta: "", criterio: "aderencia_ao_cargo" }],
                }
              );
              return { ...prev, blocos: novosBlocos };
            });
          }

          return (
            <section style={sectionStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SectionTitle style={{ marginBottom: 0 }}>Roteiro de Entrevista</SectionTitle>
                  {roteiro && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: roteiro.origem === 'jd' ? 'rgba(22,163,74,0.1)' : 'rgba(202,138,4,0.1)', color: roteiro.origem === 'jd' ? '#16A34A' : '#92400E' }}>
                      {roteiro.origem === 'jd' ? 'Via JD' : 'Genérico'}
                    </span>
                  )}
                  {roteiro?.faixa_salarial && (
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>{roteiro.faixa_salarial}</span>
                  )}
                </div>
                {roteiro && !roteiroEditando && (
                  <button
                    onClick={() => { setRoteiroLocal(JSON.parse(JSON.stringify(roteiro))); setRoteiroEditando(true); }}
                    style={{ fontSize: 10, color: "var(--text-3)", background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
                  >
                    Editar
                  </button>
                )}
                {roteiroEditando && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={handleSalvarRoteiro}
                      disabled={salvandoRoteiro}
                      style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: "#1D4ED8", border: "none", borderRadius: 6, padding: "3px 10px", cursor: "pointer", opacity: salvandoRoteiro ? 0.5 : 1 }}
                    >
                      {salvandoRoteiro ? "Salvando…" : "Salvar"}
                    </button>
                    <button
                      onClick={() => setRoteiroEditando(false)}
                      style={{ fontSize: 10, color: "var(--text-3)", background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {!roteiroAtivo ? (
                <button
                  onClick={handleGerarRoteiro}
                  disabled={gerandoRoteiro}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", fontSize: 12, fontWeight: 600, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", opacity: gerandoRoteiro ? 0.5 : 1, width: "fit-content" }}
                >
                  {gerandoRoteiro ? "⏳ Gerando roteiro…" : "🤖 Gerar roteiro de entrevista"}
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(roteiroEditando ? roteiroLocal! : roteiroAtivo).blocos.map((bloco: BlocoRoteiro, bi: number) => (
                    <div key={bi}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                        {bloco.titulo}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {bloco.perguntas.map((p, pi) => (
                          <div key={pi} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ color: "#2563EB", fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: roteiroEditando ? 10 : 2 }}>▸</span>
                            {roteiroEditando ? (
                              <div style={{ flex: 1, display: "flex", gap: 6 }}>
                                <textarea
                                  value={p.pergunta}
                                  onChange={e => handleEditarPergunta(bi, pi, e.target.value)}
                                  rows={2}
                                  style={{ flex: 1, fontSize: 12, padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                                />
                                <button
                                  onClick={() => handleRemoverPergunta(bi, pi)}
                                  style={{ fontSize: 11, color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0, alignSelf: "flex-start" }}
                                  title="Remover pergunta"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.55 }}>{p.pergunta}</div>
                                {p.dica && (
                                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2, fontStyle: "italic" }}>💡 {p.dica}</div>
                                )}
                                <div style={{ fontSize: 9, color: "#6366F1", marginTop: 2, fontWeight: 600 }}>{p.criterio.replace(/_/g, ' ')}</div>
                              </div>
                            )}
                          </div>
                        ))}
                        {roteiroEditando && (
                          <button
                            onClick={() => handleAdicionarPergunta(bi)}
                            style={{ fontSize: 10, color: "#2563EB", background: "none", border: "1px dashed rgba(37,99,235,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", alignSelf: "flex-start", marginTop: 2 }}
                          >
                            + Adicionar pergunta
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {/* Vaga vinculada */}
        {c.job_openings && (
          <section style={sectionStyle}>
            <SectionTitle>Vaga vinculada</SectionTitle>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              {c.job_openings.cargo ?? c.job_openings.title ?? "—"}
            </div>
            {c.job_openings.area && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{c.job_openings.area}</div>}
            {c.job_opening_id && (
              <a href={`/pessoas/vagas`} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, fontSize: 11, color: "var(--text-3)", textDecoration: "none" }}>
                <ExternalLink size={11} /> Ver vaga
              </a>
            )}
          </section>
        )}

        {/* Timeline do pipeline */}
        <section id="historico" style={sectionStyle}>
          <SectionTitle>Histórico do pipeline</SectionTitle>
          {pipeline.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-3)", padding: "16px 0" }}>Nenhuma movimentação registrada ainda.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {pipeline
                .slice()
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((p, i, arr) => {
                  const isNewStyle = p.para_status != null;
                  const corPonto = p.para_status === "reprovado" || p.para_status === "desistiu"
                    ? "#DC2626"
                    : p.para_status === "aprovado"
                    ? "#16A34A"
                    : p.para_status === "banco_talentos"
                    ? "#9333EA"
                    : "#CA8A04";
                  const autorRaw = p.autor;
                  const autorData = Array.isArray(autorRaw) ? autorRaw[0] : autorRaw;
                  const autorNome = autorData
                    ? `${autorData.nome}${autorData.sobrenome ? " " + autorData.sobrenome.split(" ")[0] : ""}`
                    : "—";
                  const hora = new Date(p.created_at).toLocaleString("pt-BR", {
                    timeZone: "America/Sao_Paulo",
                    day: "2-digit", month: "2-digit", year: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  });
                  return (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 14, position: "relative" }}>
                      {i < arr.length - 1 && (
                        <div style={{ position: "absolute", left: 3, top: 12, bottom: 0, width: 2, background: "var(--border)" }} />
                      )}
                      <div style={{ flexShrink: 0, width: 8, height: 8, borderRadius: 99, marginTop: 5, background: isNewStyle ? corPonto : "#CA8A04", zIndex: 1 }} />
                      <div style={{ flex: 1 }}>
                        {isNewStyle ? (
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            {p.de_status
                              ? <><span style={{ color: "var(--text-2)" }}>{STATUS_LABEL[p.de_status] ?? p.de_status}</span><span style={{ color: "var(--text-3)", fontWeight: 400 }}>→</span></>
                              : null}
                            <span style={{ color: corPonto }}>{STATUS_LABEL[p.para_status!] ?? p.para_status}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                            {ETAPA_LABEL[p.etapa ?? ""] ?? p.etapa ?? "Etapa registrada"}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                            por <strong style={{ color: "var(--text-2)", fontWeight: 600 }}>{autorNome}</strong>
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 2 }}>
                            <Clock size={10} />{hora}
                          </span>
                        </div>
                        {p.motivo && (
                          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3, fontStyle: "italic" }}>
                            {p.motivo.replace(/^\[Motivo:\s*/, "").replace(/\]$/, "")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        {/* Observações */}
        {c.observacoes && (
          <section style={sectionStyle}>
            <SectionTitle>Observações</SectionTitle>
            <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{c.observacoes}</p>
          </section>
        )}

        {/* Link conversa Maya */}
        {c.conversa_id && (
          <section style={sectionStyle}>
            <SectionTitle>Conversa com a Maya</SectionTitle>
            <a
              href={`/pessoas/agentes/maya`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(147,51,234,0.08)", color: "#9333EA", border: "1px solid rgba(147,51,234,0.2)", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}
            >
              <ExternalLink size={13} /> Ver conversa #{c.conversa_id.slice(-6)}
            </a>
          </section>
        )}
      </div>

      {/* Sidebar de ações */}
      <div className="candidate-aside" id="proximas-acoes">
        {/* Status atual */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>Status atual</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, background: `${statusCor}15`, color: statusCor, fontWeight: 700, fontSize: 13, border: `1px solid ${statusCor}30` }}>
            {STATUS_LABEL[c.status] ?? c.status}
          </div>
        </div>

        {/* Ações rápidas */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>Próximas ações</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* novo → Triagem */}
            {c.status === 'novo' && (
              <ActionBtn onClick={() => handleStatus('triagem')} color="var(--brand)" disabled={isActing}>Triar currículo →</ActionBtn>
            )}
            {/* triagem → agendar entrevista */}
            {c.status === 'triagem' && (
              <ActionBtn onClick={() => setAgendamentoModalTipo('entrevista')} color="#2563EB">
                <Calendar size={13}/> Agendar entrevista
              </ActionBtn>
            )}
            {/* agendamento → marcar entrevista realizada */}
            {c.status === 'agendamento' && (
              <>
                <ActionBtn onClick={async () => {
                  const ag = agendamentos.find(a => a.tipo === 'entrevista' && a.status === 'agendado');
                  if (!ag) { setAgendamentoModalTipo('entrevista'); return; }
                  setMarcandoRealizado(ag.id);
                  const res = await marcarAgendamentoRealizado(ag.id);
                  setMarcandoRealizado(null);
                  if (!res.ok) setStatusErro(res.error ?? 'Erro'); else handleStatus('entrevista');
                }} color="#F59E0B" disabled={isActing || !!marcandoRealizado}>
                  <CheckSquare size={13}/> {marcandoRealizado ? 'Aguarde…' : 'Entrevista realizada →'}
                </ActionBtn>
                <ActionBtn onClick={() => setAgendamentoModalTipo('entrevista')} color="#64748B" outlined>Reagendar</ActionBtn>
              </>
            )}
            {/* entrevista → avaliação administrativa */}
            {c.status === 'entrevista' && (
              <ActionBtn onClick={() => handleStatus('avaliacao_administrativa')} color="#B8975A" disabled={isActing}>Iniciar avaliação →</ActionBtn>
            )}
            {/* avaliacao_administrativa → entrevista diretoria ou agendar teste */}
            {c.status === 'avaliacao_administrativa' && (() => {
              let proximo: CandidatoStatus = "entrevista_diretoria";
              if (c.requer_entrevista_diretoria !== null && c.requer_entrevista_diretoria !== undefined) {
                proximo = c.requer_entrevista_diretoria ? "entrevista_diretoria" : "agendamento_teste";
              } else if (c.cargo_id && c.cargo?.requer_entrevista_diretoria !== null && c.cargo?.requer_entrevista_diretoria !== undefined) {
                proximo = c.cargo.requer_entrevista_diretoria ? "entrevista_diretoria" : "agendamento_teste";
              }
              const label = proximo === "entrevista_diretoria" ? "Entrevista Diretoria →" : "Agendar teste prático →";
              const cor = proximo === "entrevista_diretoria" ? "#0EA5E9" : "#8B5CF6";
              return (
                <>
                  <ActionBtn
                    onClick={() => handleStatus(proximo)}
                    color={cor}
                    disabled={!avaliacaoCompleta || isActing}
                  >
                    <Calendar size={13}/> {label}
                  </ActionBtn>
                  {!avaliacaoCompleta && (
                    <div style={{ fontSize: 11, color: "#CA8A04", lineHeight: 1.4 }}>Preencha os 4 fatores do Score Card antes de avançar.</div>
                  )}
                </>
              );
            })()}
            {/* entrevista_diretoria → agendar teste */}
            {c.status === 'entrevista_diretoria' && (
              <ActionBtn onClick={() => handleStatus('agendamento_teste')} color="#8B5CF6" disabled={isActing}>
                <Calendar size={13}/> Agendar teste prático →
              </ActionBtn>
            )}
            {/* agendamento_teste → marcar como realizado */}
            {c.status === 'agendamento_teste' && (
              <>
                <ActionBtn onClick={async () => {
                  const ag = agendamentos.find(a => a.tipo === 'teste_pratico' && a.status === 'agendado');
                  if (!ag) { setAgendamentoModalTipo('teste_pratico'); return; }
                  setMarcandoRealizado(ag.id);
                  const res = await marcarAgendamentoRealizado(ag.id);
                  setMarcandoRealizado(null);
                  if (!res.ok) setStatusErro(res.error ?? 'Erro'); else handleStatus('feedback_operacional');
                }} color="#EC4899">
                  <CheckSquare size={13}/> {marcandoRealizado ? 'Aguarde…' : 'Teste realizado →'}
                </ActionBtn>
                <ActionBtn onClick={() => setAgendamentoModalTipo('teste_pratico')} color="#64748B" outlined>Reagendar</ActionBtn>
              </>
            )}
            {/* feedback_operacional → decisão */}
            {c.status === 'feedback_operacional' && (
              <>
                <ActionBtn
                  onClick={() => handleStatus('decisao')}
                  color="#0891B2"
                  disabled={!feedbackOpCompleta || isActing}
                >
                  Avançar para Decisão →
                </ActionBtn>
                {!feedbackOpCompleta && (
                  <div style={{ fontSize: 11, color: "#CA8A04", lineHeight: 1.4 }}>Preencha os 5 fatores do Feedback Operacional antes de avançar.</div>
                )}
              </>
            )}
            {/* decisao → aprovado */}
            {c.status === 'decisao' && (
              <>
                <ActionBtn onClick={() => handleStatus('aprovado')} color="#22C55E" disabled={isActing}>
                  <UserCheck size={13}/> Aprovar candidato →
                </ActionBtn>
                <ActionBtn onClick={() => setReprovarOpen(true)} color="#DC2626" outlined>Reprovar</ActionBtn>
                <ActionBtn onClick={handleDesistiu} color="#64748B" outlined disabled={isActing}>Desistiu</ActionBtn>
              </>
            )}
            {/* aprovado → contratar */}
            {c.status === 'aprovado' && (
              contrato.result?.ok ? (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", fontSize: 12, color: "#16A34A", fontWeight: 600, lineHeight: 1.8 }}>
                  <div><UserCheck size={13} style={{ display: "inline", marginRight: 4 }} />{contrato.result.nome} contratado(a). Onboarding iniciado.</div>
                  {contrato.result.notificacao_ok && contrato.result.welcome_message_sid && (
                    <div style={{ color: "#2563EB" }}>Boas-vindas enviada — aguardando confirmação de entrega.</div>
                  )}
                  {!contrato.result.notificacao_ok && telefone && (
                    <div style={{ color: "#CA8A04" }}>Boas-vindas não enviada — template não configurado ou erro na entrega.</div>
                  )}
                  {!telefone && (
                    <div style={{ color: "#64748B" }}>— Sem WhatsApp cadastrado, boas-vindas não enviada.</div>
                  )}
                </div>
              ) : (
                <ActionBtn onClick={() => setConfirmarContratar(true)} color="#16A34A" disabled={contrato.pending}>
                  {contrato.pending ? "Processando…" : <><UserCheck size={13} /> Contratar — criar colaborador</>}
                </ActionBtn>
              )
            )}
            {/* contratado */}
            {c.status === 'contratado' && (
              contrato.result?.ok ? (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", fontSize: 12, color: "#16A34A", fontWeight: 600, lineHeight: 1.8 }}>
                  <div><UserCheck size={13} style={{ display: "inline", marginRight: 4 }} />{contrato.result.nome} contratado(a). Onboarding iniciado.</div>
                  {contrato.result.notificacao_ok && contrato.result.welcome_message_sid && (
                    <div style={{ color: "#2563EB" }}>Boas-vindas enviada — aguardando confirmação de entrega.</div>
                  )}
                  {!contrato.result.notificacao_ok && telefone && (
                    <div style={{ color: "#CA8A04" }}>Boas-vindas não enviada — template não configurado ou erro na entrega.</div>
                  )}
                  {!telefone && (
                    <div style={{ color: "#64748B" }}>— Sem WhatsApp cadastrado, boas-vindas não enviada.</div>
                  )}
                </div>
              ) : (
                <ActionBtn onClick={() => setConfirmarContratar(true)} color="#16A34A" disabled={contrato.pending}>
                  {contrato.pending ? "Processando…" : <><UserCheck size={13} /> Contratar — criar colaborador</>}
                </ActionBtn>
              )
            )}
            {/* Sprint A+B — Promoção formal via RPC promover_candidato (vincula employee_id) */}
            {(['decisao', 'aprovado'] as string[]).includes(c.status) && !c.promovido_em && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  Admissão Formal (RPC)
                </div>
                <PromoverModal
                  candidateId={c.id}
                  defaultUnitId={c.unit_id ?? null}
                  defaultFuncao={c.area_interesse ?? null}
                  defaultSalario={typeof c.pretensao_salarial === "number" ? c.pretensao_salarial : null}
                />
              </div>
            )}
            {c.promovido_em && (
              <div style={{ fontSize: 12, color: "#22C55E", padding: "8px 12px", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.15)", borderRadius: 6 }}>
                <UserCheck size={12} style={{ display: "inline", marginRight: 4 }} />
                Promovido formalmente em {new Date(c.promovido_em).toLocaleDateString("pt-BR")}
                {c.employee_id && (
                  <span style={{ color: "var(--text-3)", fontSize: 11, marginLeft: 8 }}>
                    · emp: {c.employee_id.slice(0, 8)}…
                  </span>
                )}
              </div>
            )}
            {/* Status de entrega (DB, atualizado pelo webhook) */}
            {(c.status === 'aprovado' || c.status === 'contratado') && !contrato.result && c.welcome_sent_at && (
              <WelcomeDeliveryStatus
                status={c.welcome_delivery_status ?? null}
                errorCode={c.welcome_error_code ?? null}
                sentAt={c.welcome_sent_at}
                hasSid={!!c.welcome_message_sid}
              />
            )}
            {contrato.result?.ok === false && !contrato.pending && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", fontSize: 11, color: "#DC2626" }}>
                ✗ {contrato.result.error ?? "Erro ao contratar"}
              </div>
            )}
            {/* Reprovar/Desistiu sempre disponíveis (exceto terminais e decisão) */}
            {!['reprovado','desistiu','banco_talentos','contratado','aprovado','decisao'].includes(c.status) && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
                <ActionBtn onClick={() => setReprovarOpen(true)} color="#DC2626" outlined>Reprovar</ActionBtn>
                <ActionBtn onClick={handleDesistiu} color="#64748B" outlined disabled={isActing}>Desistiu</ActionBtn>
              </div>
            )}

            {statusErro && (
              <div style={{ fontSize: 11, color: "#DC2626", lineHeight: 1.4, padding: "4px 0" }}>✗ {statusErro}</div>
            )}
          </div>
        </div>

        {/* Toggle Entrevista Diretoria */}
        {(c.status === 'avaliacao_administrativa' || c.status === 'entrevista' || c.status === 'entrevista_diretoria') && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Entrevista Diretoria
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {([null, true, false] as const).map((val) => {
                const label = val === null ? "Auto" : val ? "Sim" : "Não";
                const active = c.requer_entrevista_diretoria === val;
                return (
                  <button
                    key={String(val)}
                    onClick={async () => {
                      await setRequerDiretoria(c.id, val);
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: `1px solid ${active ? "var(--brasa)" : "var(--border)"}`,
                      background: active ? "var(--brasa)" : "transparent",
                      color: active ? "var(--primary-foreground)" : "var(--text-2)",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
              {c.requer_entrevista_diretoria === null || c.requer_entrevista_diretoria === undefined ? "Definido pelo cargo" : c.requer_entrevista_diretoria ? "Obrigatório" : "Pulando etapa"}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>Cadastrado em</div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>{new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
        </div>
      </div>
      {reprovarOpen && (
        <ReprovarModal
          nome={nome}
          onBanco={(motivo) => executarReprovar("banco_talentos", motivo)}
          onReprovar={(motivo) => executarReprovar("reprovado", motivo)}
          onClose={() => setReprovarOpen(false)}
        />
      )}
      {agendamentoModalTipo && (
        <AgendamentoModal
          candidato={c}
          tipo={agendamentoModalTipo}
          units={[]}
          onClose={() => setAgendamentoModalTipo(null)}
          onSaved={() => { setAgendamentoModalTipo(null); router.refresh(); }}
        />
      )}
      {confirmarContratar && (
        <ConfirmarContratoModal
          nome={nome}
          semTelefone={!telefone}
          numeroInvalido={!!telefone && !telefoneValido}
          onConfirm={() => { setConfirmarContratar(false); void handleContratar(); }}
          onCancel={() => setConfirmarContratar(false)}
        />
      )}
    </div>
  );
}

function CurriculoSection({ c }: { c: Candidato }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cvUploadando, setCvUploadando] = useState(false);
  const [cvErro, setCvErro] = useState<string | null>(null);
  const [aiAnalisando, setAiAnalisando] = useState(false);
  const [aiErro, setAiErro] = useState<string | null>(null);
  const [aiSuggestedFields, setAiSuggestedFields] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    escolaridade_nivel: c.escolaridade_nivel ?? "",
    pretensao_salarial: c.pretensao_salarial?.toString() ?? "",
    disponibilidade_inicio: c.disponibilidade_inicio ?? "",
    cidade: c.cidade ?? "",
    bairro: c.bairro ?? "",
    email: c.email ?? "",
    turnos_disponiveis: c.turnos_disponiveis ?? [] as string[],
    habilidades: c.habilidades ?? [] as string[],
    novaHabilidade: "",
    experiencias: (c.experiencias ?? []) as Experiencia[],
    formacoes: (c.formacoes ?? []) as Formacao[],
    idiomas: (c.idiomas ?? []) as Idioma[],
  });

  const temCurriculo =
    c.escolaridade_nivel || c.cidade || c.pretensao_salarial ||
    (c.experiencias?.length ?? 0) > 0 || (c.habilidades?.length ?? 0) > 0;

  function iniciarEdicao() {
    setForm({
      escolaridade_nivel: c.escolaridade_nivel ?? "",
      pretensao_salarial: c.pretensao_salarial?.toString() ?? "",
      disponibilidade_inicio: c.disponibilidade_inicio ?? "",
      cidade: c.cidade ?? "",
      bairro: c.bairro ?? "",
      email: c.email ?? "",
      turnos_disponiveis: c.turnos_disponiveis ?? [],
      habilidades: c.habilidades ?? [],
      novaHabilidade: "",
      experiencias: (c.experiencias ?? []) as Experiencia[],
      formacoes: (c.formacoes ?? []) as Formacao[],
      idiomas: (c.idiomas ?? []) as Idioma[],
    });
    setErro(null);
    setEditando(true);
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    if (form.email && !form.email.includes("@")) {
      setErro("E-mail inválido"); setSalvando(false); return;
    }
    const res = await updateCandidatoCurriculo(c.id, {
      escolaridade_nivel: form.escolaridade_nivel || null,
      pretensao_salarial: form.pretensao_salarial ? parseFloat(form.pretensao_salarial) : null,
      disponibilidade_inicio: form.disponibilidade_inicio || null,
      turnos_disponiveis: form.turnos_disponiveis,
      cidade: form.cidade || null,
      bairro: form.bairro || null,
      email: form.email || null,
      habilidades: form.habilidades,
      experiencias: form.experiencias,
      formacoes: form.formacoes,
      idiomas: form.idiomas,
    });
    setSalvando(false);
    if (!res.ok) { setErro(res.error ?? "Erro ao salvar"); return; }
    setEditando(false);
    router.refresh();
  }

  async function handleCVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvUploadando(true);
    setCvErro(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadCandidatoCV(c.id, fd);
    setCvUploadando(false);
    if (!res.ok) { setCvErro(res.error ?? "Erro no upload"); return; }
    router.refresh();
  }

  async function handleVerCV() {
    const res = await getCandidatoCVUrl(c.id);
    if (!res.ok || !res.url) { alert(res.error ?? "Erro ao gerar link"); return; }
    window.open(res.url, "_blank");
  }

  async function handleParsearCV() {
    setAiAnalisando(true);
    setAiErro(null);
    const res = await parseCurriculoFromCV(c.id);
    setAiAnalisando(false);
    if (!res.ok || !res.rascunho) {
      setAiErro(res.error ?? "Erro ao analisar CV");
      return;
    }
    const d: CurriculoPayload = res.rascunho;
    const suggested = new Set<string>();
    const next = { ...form };
    if (d.escolaridade_nivel)         { next.escolaridade_nivel = d.escolaridade_nivel; suggested.add("escolaridade_nivel"); }
    if (d.pretensao_salarial != null) { next.pretensao_salarial = String(d.pretensao_salarial); suggested.add("pretensao_salarial"); }
    if (d.disponibilidade_inicio)     { next.disponibilidade_inicio = d.disponibilidade_inicio; suggested.add("disponibilidade_inicio"); }
    if (d.cidade)                     { next.cidade = d.cidade; suggested.add("cidade"); }
    if (d.bairro)                     { next.bairro = d.bairro; suggested.add("bairro"); }
    if (d.turnos_disponiveis?.length) { next.turnos_disponiveis = d.turnos_disponiveis; suggested.add("turnos_disponiveis"); }
    if (d.habilidades?.length)        { next.habilidades = d.habilidades; suggested.add("habilidades"); }
    if (d.experiencias?.length)       { next.experiencias = d.experiencias as typeof form.experiencias; suggested.add("experiencias"); }
    if (d.formacoes?.length)          { next.formacoes = d.formacoes as typeof form.formacoes; suggested.add("formacoes"); }
    if (d.idiomas?.length)            { next.idiomas = d.idiomas as typeof form.idiomas; suggested.add("idiomas"); }
    setForm(next);
    setAiSuggestedFields(suggested);
    setEditando(true);
  }

  function toggleTurno(v: string) {
    setForm(f => ({
      ...f,
      turnos_disponiveis: f.turnos_disponiveis.includes(v)
        ? f.turnos_disponiveis.filter(t => t !== v)
        : [...f.turnos_disponiveis, v],
    }));
  }

  function addHabilidade() {
    const h = form.novaHabilidade.trim();
    if (!h || form.habilidades.includes(h)) return;
    setForm(f => ({ ...f, habilidades: [...f.habilidades, h], novaHabilidade: "" }));
  }

  function removeHabilidade(h: string) {
    setForm(f => ({ ...f, habilidades: f.habilidades.filter(x => x !== h) }));
  }

  function addExperiencia() {
    setForm(f => ({ ...f, experiencias: [...f.experiencias, { empresa: "", cargo: "", inicio: "" }] }));
  }

  function updateExp(i: number, field: keyof Experiencia, val: string) {
    setForm(f => {
      const exps = [...f.experiencias];
      exps[i] = { ...exps[i], [field]: val } as Experiencia;
      return { ...f, experiencias: exps };
    });
  }

  function removeExp(i: number) {
    setForm(f => ({ ...f, experiencias: f.experiencias.filter((_, idx) => idx !== i) }));
  }

  function addFormacao() {
    setForm(f => ({ ...f, formacoes: [...f.formacoes, { instituicao: "", curso: "", nivel: "" }] }));
  }

  function updateForm(i: number, field: keyof Formacao, val: string) {
    setForm(f => {
      const fms = [...f.formacoes];
      fms[i] = { ...fms[i], [field]: val } as Formacao;
      return { ...f, formacoes: fms };
    });
  }

  function removeFormacao(i: number) {
    setForm(f => ({ ...f, formacoes: f.formacoes.filter((_, idx) => idx !== i) }));
  }

  function addIdioma() {
    setForm(f => ({ ...f, idiomas: [...f.idiomas, { idioma: "", nivel: "basico" }] }));
  }

  function updateIdioma(i: number, field: keyof Idioma, val: string) {
    setForm(f => {
      const ids = [...f.idiomas];
      ids[i] = { ...ids[i], [field]: val } as Idioma;
      return { ...f, idiomas: ids };
    });
  }

  function removeIdioma(i: number) {
    setForm(f => ({ ...f, idiomas: f.idiomas.filter((_, idx) => idx !== i) }));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "6px 10px", fontSize: 13,
    border: "1px solid var(--border)", borderRadius: 6,
    background: "var(--surface)", color: "var(--text)",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginBottom: 3 };
  const subSecStyle: React.CSSProperties = { marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 };
  const tagStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 8px", borderRadius: 99,
    background: "var(--surface-2,#f1f5f9)", fontSize: 12,
    border: "1px solid var(--border)",
  };
  const btnRemoveStyle: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text-3)", fontSize: 13, lineHeight: 1,
  };
  const aiInputStyle = (field: string): React.CSSProperties =>
    aiSuggestedFields.has(field)
      ? { ...inputStyle, background: "#FFFBEB", borderColor: "#D97706", color: "#2C2C2A", fontWeight: 500 }
      : inputStyle;
  const clearAI = (...fields: string[]) =>
    setAiSuggestedFields(prev => { const n = new Set(prev); fields.forEach(f => n.delete(f)); return n; });
  const AiBadge = ({ field }: { field: string }) =>
    aiSuggestedFields.has(field)
      ? <span style={{ fontSize: 10, fontWeight: 700, color: "#92400E", background: "#FDE68A", padding: "1px 6px", borderRadius: 4, marginLeft: 6, verticalAlign: "middle" }}>IA</span>
      : null;

  return (
    <>
      {/* ── Seção Currículo ── */}
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Currículo
          </span>
          {!editando && (
            <button
              onClick={iniciarEdicao}
              style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text)" }}
            >
              {temCurriculo ? "Editar" : "Preencher"}
            </button>
          )}
        </div>

        {!editando ? (
          temCurriculo ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
              {c.escolaridade_nivel && <InfoField label="Escolaridade" value={ESCOLARIDADE_LABEL[c.escolaridade_nivel] ?? c.escolaridade_nivel} />}
              {c.pretensao_salarial && <InfoField label="Pretensão salarial" value={`R$ ${c.pretensao_salarial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />}
              {c.disponibilidade_inicio && <InfoField label="Disponibilidade" value={new Date(c.disponibilidade_inicio + "T12:00:00").toLocaleDateString("pt-BR")} />}
              {c.cidade && <InfoField label="Cidade / Bairro" value={[c.cidade, c.bairro].filter(Boolean).join(" — ")} />}
              {(c.turnos_disponiveis?.length ?? 0) > 0 && (
                <InfoField label="Turnos" value={c.turnos_disponiveis!.map(t => TURNO_LABEL[t] ?? t).join(", ")} />
              )}
              {(c.habilidades?.length ?? 0) > 0 && (
                <div style={{ gridColumn: "1/-1" }}>
                  <div style={labelStyle}>Habilidades</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {c.habilidades!.map(h => <span key={h} style={tagStyle}>{h}</span>)}
                  </div>
                </div>
              )}
              {(c.experiencias?.length ?? 0) > 0 && (
                <div style={{ gridColumn: "1/-1" }}>
                  <div style={labelStyle}>Experiências</div>
                  {c.experiencias!.map((e, i) => (
                    <div key={i} style={{ fontSize: 12, marginTop: 6, padding: "6px 10px", background: "var(--surface-2,#f8fafc)", borderRadius: 6 }}>
                      <strong>{e.cargo}</strong> — {e.empresa} <span style={{ color: "var(--text-3)" }}>({e.inicio}{e.fim ? ` → ${e.fim}` : " → atual"})</span>
                      {e.descricao && <div style={{ marginTop: 3, color: "var(--text-2)" }}>{e.descricao}</div>}
                    </div>
                  ))}
                </div>
              )}
              {(c.idiomas?.length ?? 0) > 0 && (
                <div style={{ gridColumn: "1/-1" }}>
                  <div style={labelStyle}>Idiomas</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {c.idiomas!.map((id, i) => <span key={i} style={tagStyle}>{id.idioma} · {id.nivel}</span>)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: "20px 0" }}>
              Nenhum dado de currículo preenchido
            </div>
          )
        ) : (
          /* ── FORMULÁRIO DE EDIÇÃO ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {aiSuggestedFields.size > 0 && (
              <div style={{ padding: "8px 12px", background: "#FFFBEB", border: "1px solid #D97706", borderRadius: 6, fontSize: 12, color: "#92400E" }}>
                ✨ Dados extraídos do CV pela IA — campos marcados com <strong>IA</strong> precisam de revisão antes de salvar.
              </div>
            )}
            {/* Dados básicos */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={labelStyle}>Escolaridade<AiBadge field="escolaridade_nivel" /></div>
                <select
                  value={form.escolaridade_nivel}
                  onChange={e => { setForm(f => ({ ...f, escolaridade_nivel: e.target.value })); clearAI("escolaridade_nivel"); }}
                  style={aiInputStyle("escolaridade_nivel")}
                >
                  <option value="">— selecionar —</option>
                  {ESCOLARIDADE_SLUGS.map(s => (
                    <option key={s} value={s}>{ESCOLARIDADE_LABEL[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={labelStyle}>Pretensão salarial (R$)<AiBadge field="pretensao_salarial" /></div>
                <input
                  type="number" min={0} step={100}
                  value={form.pretensao_salarial}
                  onChange={e => { setForm(f => ({ ...f, pretensao_salarial: e.target.value })); clearAI("pretensao_salarial"); }}
                  style={aiInputStyle("pretensao_salarial")}
                  placeholder="Ex: 2500"
                />
              </div>
              <div>
                <div style={labelStyle}>Disponibilidade de início<AiBadge field="disponibilidade_inicio" /></div>
                <input
                  type="date"
                  value={form.disponibilidade_inicio}
                  onChange={e => { setForm(f => ({ ...f, disponibilidade_inicio: e.target.value })); clearAI("disponibilidade_inicio"); }}
                  style={aiInputStyle("disponibilidade_inicio")}
                />
              </div>
              <div />
              <div>
                <div style={labelStyle}>Cidade<AiBadge field="cidade" /></div>
                <input
                  value={form.cidade}
                  onChange={e => { setForm(f => ({ ...f, cidade: e.target.value })); clearAI("cidade"); }}
                  style={aiInputStyle("cidade")}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div>
                <div style={labelStyle}>Bairro<AiBadge field="bairro" /></div>
                <input
                  value={form.bairro}
                  onChange={e => { setForm(f => ({ ...f, bairro: e.target.value })); clearAI("bairro"); }}
                  style={aiInputStyle("bairro")}
                  placeholder="Ex: Moema"
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={labelStyle}>E-mail</div>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={aiInputStyle("email")}
                  placeholder="Ex: joao@email.com"
                />
              </div>
            </div>

            {/* Turnos */}
            <div>
              <div style={labelStyle}>Turnos disponíveis<AiBadge field="turnos_disponiveis" /></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {TURNOS.map(t => (
                  <label key={t.value} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form.turnos_disponiveis.includes(t.value)}
                      onChange={() => toggleTurno(t.value)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Habilidades */}
            <div style={subSecStyle}>
              <div style={labelStyle}>Habilidades<AiBadge field="habilidades" /></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {form.habilidades.map(h => (
                  <span key={h} style={tagStyle}>
                    {h}
                    <button onClick={() => removeHabilidade(h)} style={btnRemoveStyle}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input
                  value={form.novaHabilidade}
                  onChange={e => setForm(f => ({ ...f, novaHabilidade: e.target.value }))}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addHabilidade(); } }}
                  placeholder="Adicionar habilidade…"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addHabilidade} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "none", cursor: "pointer", fontSize: 12 }}>+</button>
              </div>
            </div>

            {/* Idiomas */}
            <div style={subSecStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={labelStyle}>Idiomas<AiBadge field="idiomas" /></div>
                <button onClick={addIdioma} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid var(--border)", background: "none", cursor: "pointer" }}>+ Adicionar</button>
              </div>
              {form.idiomas.map((id, i) => (
                <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <input value={id.idioma} onChange={e => updateIdioma(i, "idioma", e.target.value)} placeholder="Idioma" style={{ ...inputStyle, flex: 2 }} />
                  <select value={id.nivel} onChange={e => updateIdioma(i, "nivel", e.target.value)} style={{ ...inputStyle, flex: 2 }}>
                    <option value="basico">Básico</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                    <option value="fluente">Fluente / Nativo</option>
                  </select>
                  <button onClick={() => removeIdioma(i)} style={{ ...btnRemoveStyle, fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>

            {/* Experiências */}
            <div style={subSecStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={labelStyle}>Experiências profissionais<AiBadge field="experiencias" /></div>
                <button onClick={addExperiencia} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid var(--border)", background: "none", cursor: "pointer" }}>+ Adicionar</button>
              </div>
              {form.experiencias.map((e, i) => (
                <div key={i} style={{ padding: "10px", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div>
                      <div style={labelStyle}>Empresa</div>
                      <input value={e.empresa} onChange={ev => updateExp(i, "empresa", ev.target.value)} style={inputStyle} placeholder="Nome da empresa" />
                    </div>
                    <div>
                      <div style={labelStyle}>Cargo</div>
                      <input value={e.cargo} onChange={ev => updateExp(i, "cargo", ev.target.value)} style={inputStyle} placeholder="Cargo ocupado" />
                    </div>
                    <div>
                      <div style={labelStyle}>Início (mês/ano)</div>
                      <input value={e.inicio} onChange={ev => updateExp(i, "inicio", ev.target.value)} style={inputStyle} placeholder="Ex: 01/2022" />
                    </div>
                    <div>
                      <div style={labelStyle}>Fim (vazio = atual)</div>
                      <input value={e.fim ?? ""} onChange={ev => updateExp(i, "fim", ev.target.value)} style={inputStyle} placeholder="Ex: 12/2023" />
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <div style={labelStyle}>Descrição (opcional)</div>
                      <input value={e.descricao ?? ""} onChange={ev => updateExp(i, "descricao", ev.target.value)} style={inputStyle} placeholder="Responsabilidades, conquistas…" />
                    </div>
                  </div>
                  <button onClick={() => removeExp(i)} style={{ marginTop: 8, fontSize: 11, color: "#DC2626", background: "none", border: "none", cursor: "pointer" }}>Remover</button>
                </div>
              ))}
            </div>

            {/* Formação */}
            <div style={subSecStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={labelStyle}>Formação acadêmica<AiBadge field="formacoes" /></div>
                <button onClick={addFormacao} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid var(--border)", background: "none", cursor: "pointer" }}>+ Adicionar</button>
              </div>
              {form.formacoes.map((fm, i) => (
                <div key={i} style={{ padding: "10px", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div>
                      <div style={labelStyle}>Instituição</div>
                      <input value={fm.instituicao} onChange={e => updateForm(i, "instituicao", e.target.value)} style={inputStyle} placeholder="Nome da instituição" />
                    </div>
                    <div>
                      <div style={labelStyle}>Curso</div>
                      <input value={fm.curso} onChange={e => updateForm(i, "curso", e.target.value)} style={inputStyle} placeholder="Ex: Administração" />
                    </div>
                    <div>
                      <div style={labelStyle}>Nível</div>
                      <select value={fm.nivel} onChange={e => updateForm(i, "nivel", e.target.value)} style={inputStyle}>
                        <option value="">— selecionar —</option>
                        <option value="tecnico">Técnico</option>
                        <option value="superior">Superior</option>
                        <option value="pos">Pós-graduação</option>
                        <option value="mba">MBA</option>
                        <option value="mestrado">Mestrado</option>
                        <option value="doutorado">Doutorado</option>
                      </select>
                    </div>
                    <div>
                      <div style={labelStyle}>Ano de conclusão</div>
                      <input
                        type="number" min={1970} max={2040}
                        value={fm.ano_conclusao ?? ""}
                        onChange={e => updateForm(i, "ano_conclusao", e.target.value)}
                        style={inputStyle}
                        placeholder="Ex: 2019"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeFormacao(i)} style={{ marginTop: 8, fontSize: 11, color: "#DC2626", background: "none", border: "none", cursor: "pointer" }}>Remover</button>
                </div>
              ))}
            </div>

            {/* Ações salvar/cancelar */}
            {erro && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>{erro}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button
                onClick={salvar}
                disabled={salvando}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1D4ED8", color: "#fff", fontWeight: 600, fontSize: 13, cursor: salvando ? "not-allowed" : "pointer", opacity: salvando ? 0.7 : 1 }}
              >
                {salvando ? "Salvando…" : "Salvar currículo"}
              </button>
              <button
                onClick={() => setEditando(false)}
                disabled={salvando}
                style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "none", fontSize: 13, cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Seção CV (arquivo) ── */}
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          Arquivo de CV
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleCVUpload}
          style={{ display: "none" }}
        />
        {cvErro && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 8 }}>{cvErro}</div>}
        {aiErro && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 8 }}>{aiErro}</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {c.cv_storage_path ? (
            <>
              <button
                onClick={handleVerCV}
                style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #2563EB", background: "none", color: "#2563EB", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
              >
                Ver CV
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={cvUploadando}
                style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "none", fontSize: 13, cursor: cvUploadando ? "not-allowed" : "pointer", opacity: cvUploadando ? 0.7 : 1 }}
              >
                {cvUploadando ? "Enviando…" : "Substituir"}
              </button>
              <button
                onClick={handleParsearCV}
                disabled={aiAnalisando}
                style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #7C3AED", background: "none", color: "#7C3AED", fontSize: 13, cursor: aiAnalisando ? "not-allowed" : "pointer", opacity: aiAnalisando ? 0.7 : 1, fontWeight: 500 }}
              >
                {aiAnalisando ? "Lendo o CV…" : "✨ Preencher com IA"}
              </button>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={cvUploadando}
              style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "none", fontSize: 13, cursor: cvUploadando ? "not-allowed" : "pointer", opacity: cvUploadando ? 0.7 : 1 }}
            >
              {cvUploadando ? "Enviando…" : "Enviar CV"}
            </button>
          )}
        </div>
        {c.cv_storage_path && (
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
            PDF, JPG, PNG, DOC — máx 10 MB · link expira em 1h
          </div>
        )}
      </section>
    </>
  );
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14, ...style }}>{children}</div>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{value ?? "—"}</div>
    </div>
  );
}

function ActionBtn({ children, onClick, color, outlined, disabled }: { children: React.ReactNode; onClick: () => void; color: string; outlined?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "9px 14px", width: "100%", fontSize: 12, fontWeight: 600, borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        background: outlined ? "transparent" : color,
        color: outlined ? color : color === "var(--brand)" ? "var(--primary-foreground)" : "#fff",
        border: `1px solid ${color}${outlined ? "60" : ""}`,
      }}
    >
      {children}
    </button>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
};

const DELIVERY_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
  sent:           { label: "Enviada",                     color: "#2563EB", emoji: "✓"  },
  delivered:      { label: "Entregue",                    color: "#16A34A", emoji: "✓✓" },
  read:           { label: "Lida",                        color: "#16A34A", emoji: "✓✓" },
  undelivered:    { label: "Não entregue",                color: "#DC2626", emoji: "✗"  },
  failed:         { label: "Falha no envio",              color: "#DC2626", emoji: "✗"  },
  invalid_number: { label: "Número inválido — sem WhatsApp", color: "#DC2626", emoji: "✗" },
};

function WelcomeDeliveryStatus({
  status, errorCode, sentAt, hasSid,
}: { status: string | null; errorCode: string | null; sentAt: string; hasSid: boolean }) {
  if (!hasSid) {
    return (
      <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.2)", fontSize: 11, color: "#CA8A04", fontWeight: 600 }}>
        ⚠ Boas-vindas não enviada — template não configurado
      </div>
    );
  }
  const info = status ? DELIVERY_LABEL[status] : null;
  if (!info) {
    return (
      <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)", fontSize: 11, color: "#2563EB", fontWeight: 600 }}>
        ⏳ Aguardando confirmação de entrega
        <span style={{ display: "block", fontSize: 10, color: "#64748B", fontWeight: 400, marginTop: 2 }}>
          Enviada em {new Date(sentAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </span>
      </div>
    );
  }
  return (
    <div style={{ padding: "10px 12px", borderRadius: 8, background: `${info.color}0d`, border: `1px solid ${info.color}25`, fontSize: 11, color: info.color, fontWeight: 600 }}>
      {info.emoji} Boas-vindas: {info.label}
      {errorCode && <span style={{ display: "block", fontSize: 10, fontWeight: 400, marginTop: 2 }}>Código: {errorCode}</span>}
      <span style={{ display: "block", fontSize: 10, color: "#64748B", fontWeight: 400, marginTop: 2 }}>
        Enviada em {new Date(sentAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
      </span>
    </div>
  );
}

function ScoreCardSection({
  candidateId,
  cargo,
  initialAvaliacao,
  onCompleted,
}: {
  candidateId: string;
  cargo: string | null;
  initialAvaliacao: AvaliacaoData | null;
  onCompleted: (completa: boolean) => void;
}) {
  const [fatores, setFatores] = useState({
    aderencia: initialAvaliacao?.aderencia_skills ?? null as number | null,
    experiencia: initialAvaliacao?.experiencia ?? null as number | null,
    tec: initialAvaliacao?.entrevista_tec ?? null as number | null,
    comp: initialAvaliacao?.entrevista_comp ?? null as number | null,
  });
  const [iaSugerida, setIaSugerida] = useState({
    aderencia: initialAvaliacao?.aderencia_ia_sugerida ?? false,
    experiencia: initialAvaliacao?.experiencia_ia_sugerida ?? false,
  });
  const [iaSugestaoValor, setIaSugestaoValor] = useState<{ aderencia: number | null; experiencia: number | null }>({ aderencia: null, experiencia: null });
  const [justificativas, setJustificativas] = useState({ aderencia: "", experiencia: "" });
  // Inicia como true quando não há avaliação salva — card mostra loading imediatamente no mount
  const [sugerindo, setSugerindo] = useState(() => initialAvaliacao === null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const autoSuggestCalled = useRef(false);

  const completa =
    fatores.aderencia !== null && fatores.experiencia !== null &&
    fatores.tec !== null && fatores.comp !== null;

  // Nota parcial: média só dos fatores preenchidos (null = sem dado, não zero)
  const fatoresPreenchidos = [fatores.aderencia, fatores.experiencia, fatores.tec, fatores.comp].filter((v) => v !== null) as number[];
  const notaParcial = fatoresPreenchidos.length > 0
    ? Math.round((fatoresPreenchidos.reduce((a, b) => a + b, 0) / fatoresPreenchidos.length) * 10) / 10
    : null;
  const notaFinal = completa ? notaParcial : null;

  useEffect(() => { onCompleted(completa); }, [completa]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chamada automática no mount: sugere e salva parcialmente como cache (evita re-chamada na próxima visita)
  async function autoSugerir() {
    setSugerindo(true);
    setErro(null);
    try {
      const res = await sugerirFatoresObjetivos(candidateId);
      if (!res.ok) { setErro(res.error ?? "Erro ao gerar sugestão"); return; }
      const novaAderencia = res.aderencia ?? null;
      const novaExperiencia = res.experiencia ?? null;
      setFatores(f => ({ ...f, aderencia: novaAderencia, experiencia: novaExperiencia }));
      setIaSugerida({ aderencia: novaAderencia !== null, experiencia: novaExperiencia !== null });
      setIaSugestaoValor({ aderencia: novaAderencia, experiencia: novaExperiencia });
      setJustificativas({ aderencia: res.aderencia_justificativa ?? "", experiencia: res.experiencia_justificativa ?? "" });
      // Salva parcial (tec/comp = null) para cache — próxima abertura não chama IA de novo
      await salvarAvaliacao({
        candidateId,
        aderenciaSkills: novaAderencia,
        experiencia: novaExperiencia,
        entrevistaTec: null,
        entrevistaComp: null,
        aderenciaIaSugerida: novaAderencia !== null,
        experienciaIaSugerida: novaExperiencia !== null,
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado na sugestão automática");
    } finally {
      setSugerindo(false);
    }
  }

  useEffect(() => {
    if (initialAvaliacao !== null) return; // avaliação já existe — não chama IA
    if (autoSuggestCalled.current) return; // guard contra double-invoke (React StrictMode)
    autoSuggestCalled.current = true;
    void autoSugerir();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sugestão manual: botão "Sugerir com IA" — re-avalia sem auto-save
  async function handleSugerir() {
    setSugerindo(true);
    setErro(null);
    setSucesso(false);
    const res = await sugerirFatoresObjetivos(candidateId);
    setSugerindo(false);
    if (!res.ok) { setErro(res.error ?? "Erro ao gerar sugestão"); return; }
    // null da IA = sem dado → preserva valor manual se já existia; substitui se IA trouxe nota real
    setFatores(f => ({
      ...f,
      aderencia: res.aderencia !== undefined ? (res.aderencia ?? f.aderencia) : f.aderencia,
      experiencia: res.experiencia !== undefined ? (res.experiencia ?? f.experiencia) : f.experiencia,
    }));
    setIaSugerida({ aderencia: res.aderencia != null, experiencia: res.experiencia != null });
    setIaSugestaoValor({ aderencia: res.aderencia ?? null, experiencia: res.experiencia ?? null });
    setJustificativas({ aderencia: res.aderencia_justificativa ?? "", experiencia: res.experiencia_justificativa ?? "" });
  }

  async function handleSalvar() {
    if (!completa) return;
    setSalvando(true);
    setErro(null);
    setSucesso(false);
    const res = await salvarAvaliacao({
      candidateId,
      aderenciaSkills: fatores.aderencia,
      experiencia: fatores.experiencia,
      entrevistaTec: fatores.tec,
      entrevistaComp: fatores.comp,
      aderenciaIaSugerida: iaSugerida.aderencia,
      experienciaIaSugerida: iaSugerida.experiencia,
    });
    setSalvando(false);
    if (!res.ok) { setErro(res.error ?? "Erro ao salvar"); }
    else { setSucesso(true); onCompleted(true); }
  }

  function FatorInput({ label, field, justificativa }: {
    label: string;
    field: "aderencia" | "experiencia" | "tec" | "comp";
    justificativa?: string;
  }) {
    const value = fatores[field];
    const semDado = value === null;
    const iaVal: number | null = (field === "aderencia" || field === "experiencia")
      ? (iaSugestaoValor[field] ?? null)
      : null;
    type BadgeKind =
      | { kind: "ia-sugerido" }
      | { kind: "ia-ajustado"; iaValor: number }
      | { kind: "humano" }
      | null;
    let badge: BadgeKind = null;
    if (!semDado) {
      if (iaVal !== null) {
        badge = value === iaVal ? { kind: "ia-sugerido" } : { kind: "ia-ajustado", iaValor: iaVal };
      } else {
        badge = { kind: "humano" };
      }
    }
    function onChange(v: number | null) {
      setFatores(f => ({ ...f, [field]: v }));
      setSucesso(false);
      if (field === "aderencia" || field === "experiencia") {
        setIaSugerida(s => ({ ...s, [field]: false }));
      }
    }
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: semDado ? "var(--text-3)" : "var(--text)" }}>{label}</label>
          {semDado ? (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>
              sem dado
            </span>
          ) : badge?.kind === "ia-sugerido" ? (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(245,158,11,0.1)", color: "#B45309", border: "1px solid rgba(245,158,11,0.3)" }}>
              sugerido pela IA
            </span>
          ) : badge?.kind === "ia-ajustado" ? (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(59,130,246,0.08)", color: "#1D4ED8", border: "1px solid rgba(59,130,246,0.2)" }}>
              ajustado por você (IA sugeriu {badge.iaValor.toFixed(1)})
            </span>
          ) : badge?.kind === "humano" ? (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4, background: "rgba(59,130,246,0.08)", color: "#1D4ED8", border: "1px solid rgba(59,130,246,0.2)" }}>
              avaliado por você
            </span>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="range" min="0" max="10" step="0.5"
            value={value ?? 0}
            onChange={e => onChange(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: semDado ? "var(--border)" : "var(--brasa)", opacity: semDado ? 0.4 : 1 }}
          />
          <input
            type="number" min="0" max="10" step="0.5"
            value={value ?? ""}
            placeholder="—"
            onChange={e => onChange(e.target.value === "" ? null : Math.min(10, Math.max(0, parseFloat(e.target.value))))}
            style={{ width: 60, padding: "4px 8px", fontSize: 14, fontWeight: 700, textAlign: "center", borderRadius: 6, border: `1px solid ${semDado ? "var(--border)" : "var(--border)"}`, background: semDado ? "var(--surface-2)" : "var(--surface)", color: semDado ? "var(--text-3)" : "var(--text)" }}
          />
          <span style={{ fontSize: 11, color: semDado ? "var(--text-3)" : "var(--text-3)", width: 24 }}>{semDado ? "—" : "/10"}</span>
        </div>
        {justificativa && (
          <div style={{ fontSize: 11, color: semDado ? "var(--text-3)" : "var(--text-3)", marginTop: 4, fontStyle: "italic", lineHeight: 1.4 }}>{justificativa}</div>
        )}
      </div>
    );
  }

  return (
    <section style={sectionStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <SectionTitle>Score Card de Avaliação</SectionTitle>
        <button
          onClick={handleSugerir}
          disabled={sugerindo}
          style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", background: sugerindo ? "var(--surface-2)" : "rgba(245,158,11,0.1)", color: sugerindo ? "var(--text-3)" : "#B45309", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, cursor: sugerindo ? "not-allowed" : "pointer" }}
        >
          {sugerindo ? "Gerando…" : "✨ Sugerir com IA"}
        </button>
      </div>

      {cargo && (
        <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 16 }}>
          Cargo pretendido: <strong style={{ color: "var(--text-2)" }}>{cargo}</strong>
        </div>
      )}

      <div className="candidate-score-grid">
        <FatorInput label="Aderência de habilidades ao cargo" field="aderencia" justificativa={justificativas.aderencia} />
        <FatorInput label="Experiência na função" field="experiencia" justificativa={justificativas.experiencia} />
        <FatorInput label="Entrevista — Técnico" field="tec" />
        <FatorInput label="Entrevista — Comportamental" field="comp" />
      </div>

      {notaParcial !== null && (
        <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 10, background: completa ? "rgba(22,163,74,0.07)" : "var(--surface-2)", border: `1px solid ${completa ? "rgba(22,163,74,0.2)" : "var(--border)"}`, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: completa ? "#16A34A" : "var(--text-2)" }}>
            {completa ? "Nota" : "Parcial"} {notaParcial.toFixed(1)}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            {completa
              ? `= Habilidades ${fatores.aderencia!.toFixed(1)} · Experiência ${fatores.experiencia!.toFixed(1)} · Técnico ${fatores.tec!.toFixed(1)} · Comportamental ${fatores.comp!.toFixed(1)}`
              : `${fatoresPreenchidos.length} de 4 fatores preenchidos — preencha os demais para nota final`}
          </span>
        </div>
      )}

      {erro && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#DC2626" }}>✗ {erro}</div>
      )}
      {sucesso && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#16A34A", fontWeight: 600 }}>Avaliação salva.</div>
      )}

      <button
        onClick={handleSalvar}
        disabled={!completa || salvando}
        style={{ marginTop: 16, width: "100%", padding: "10px 0", fontSize: 13, fontWeight: 700, background: completa && !salvando ? "var(--brasa)" : "var(--surface-2)", color: completa && !salvando ? "var(--primary-foreground)" : "var(--text-3)", border: "none", borderRadius: 8, cursor: completa && !salvando ? "pointer" : "not-allowed" }}
      >
        {salvando ? "Salvando…" : completa ? "Salvar avaliação" : "Preencha os 4 fatores para salvar"}
      </button>
    </section>
  );
}

function FeedbackOperacionalSection({
  candidateId, agendamentoId, initialFeedback, onCompleted,
}: { candidateId: string; agendamentoId: string | null; initialFeedback: FeedbackOperacional | null; onCompleted: (v: boolean) => void }) {
  const [, startTransition] = useTransition();
  const [fb, setFb] = useState({
    postura: initialFeedback?.postura_apresentacao?.toString() ?? '',
    ritmo:   initialFeedback?.ritmo_sob_pressao?.toString() ?? '',
    dominio: initialFeedback?.dominio_tecnico?.toString() ?? '',
    higiene: initialFeedback?.higiene_seguranca?.toString() ?? '',
    equipe:  initialFeedback?.trabalho_em_equipe?.toString() ?? '',
    parecer: initialFeedback?.parecer ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const fatores = [
    { key: 'postura' as const, label: 'Postura e apresentação', val: fb.postura },
    { key: 'ritmo'   as const, label: 'Ritmo sob pressão',      val: fb.ritmo },
    { key: 'dominio' as const, label: 'Domínio técnico',         val: fb.dominio },
    { key: 'higiene' as const, label: 'Higiene e segurança',     val: fb.higiene },
    { key: 'equipe'  as const, label: 'Trabalho em equipe',      val: fb.equipe },
  ];

  const numVals = fatores.map(f => parseFloat(f.val)).filter(v => !isNaN(v) && v >= 0 && v <= 10);
  const notaPreview = numVals.length === 5 ? Math.round(numVals.reduce((a,b)=>a+b,0)/5*10)/10 : null;

  async function handleSalvar() {
    const vals = {
      postura: parseFloat(fb.postura), ritmo: parseFloat(fb.ritmo),
      dominio: parseFloat(fb.dominio), higiene: parseFloat(fb.higiene),
      equipe:  parseFloat(fb.equipe),
    };
    for (const [k,v] of Object.entries(vals)) {
      if (isNaN(v) || v < 0 || v > 10) { setErro(`"${k}" deve ser entre 0 e 10`); return; }
    }
    setSaving(true); setErro(null);
    const res = await salvarFeedbackOperacional({
      candidateId, agendamentoId,
      posturaApresentacao: vals.postura, ritmoSobPressao: vals.ritmo,
      dominioTecnico: vals.dominio, higieneSeguranca: vals.higiene,
      trabalhoEmEquipe: vals.equipe, parecer: fb.parecer || null,
    });
    setSaving(false);
    if (!res.ok) { setErro(res.error ?? 'Erro'); return; }
    setSucesso(true);
    onCompleted(true);
  }

  void startTransition;

  return (
    <section style={sectionStyle}>
      <SectionTitle>
        Feedback Operacional
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: "#EC4899", background: "rgba(236,72,153,0.08)", padding: "2px 8px", borderRadius: 99, marginLeft: 10 }}>GESTOR</span>
      </SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fatores.map(f => (
          <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <label style={{ fontSize: 12, color: "var(--text-2)", flex: 1 }}>{f.label}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="number" min="0" max="10" step="0.5"
                value={f.val}
                onChange={e => setFb(v=>({...v, [f.key]: e.target.value}))}
                style={{ width: 64, padding: "6px 8px", fontSize: 13, fontWeight: 700, textAlign: "center", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface-2)", color: "var(--text)", outline: "none" }}
              />
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>/10</span>
            </div>
          </div>
        ))}
        {notaPreview !== null && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8, marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Nota final (banco calcula)</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: notaPreview >= 7 ? "#16A34A" : notaPreview >= 5 ? "#CA8A04" : "#DC2626" }}>{notaPreview.toFixed(1)}</span>
          </div>
        )}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "var(--text-3)", display: "block", marginBottom: 5 }}>Parecer do gestor</label>
          <textarea
            value={fb.parecer}
            onChange={e => setFb(v=>({...v, parecer: e.target.value}))}
            style={{ width: "100%", padding: "8px 11px", fontSize: 13, color: "var(--text)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, outline: "none", height: 80, resize: "vertical", boxSizing: "border-box" }}
            placeholder="Observações sobre o desempenho no teste, pontos de atenção, recomendações…"
          />
        </div>
        {erro && <div style={{ padding: "8px 12px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, fontSize: 12, color: "#DC2626" }}>{erro}</div>}
        {sucesso && <div style={{ padding: "8px 12px", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 8, fontSize: 12, color: "#16A34A" }}>Feedback salvo!</div>}
        <button onClick={handleSalvar} disabled={saving || numVals.length < 5} style={{ padding: "9px 0", fontSize: 13, fontWeight: 600, background: "#EC4899", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", opacity: (saving || numVals.length < 5) ? 0.5 : 1 }}>
          {saving ? "Salvando…" : "Salvar Feedback Operacional"}
        </button>
      </div>
    </section>
  );
}

function ConfirmarContratoModal({ nome, semTelefone, numeroInvalido, onConfirm, onCancel }: {
  nome: string; semTelefone?: boolean; numeroInvalido?: boolean; onConfirm: () => void; onCancel: () => void
}) {
  const semEntrega = semTelefone || numeroInvalido;
  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, width: "100%", maxWidth: 380 }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text)" }}>Confirmar contratação</h2>
        <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 16px" }}>
          Contratar <strong>{nome}</strong>? Cria colaborador no sistema{semEntrega ? "." : " e dispara boas-vindas via WhatsApp."}
        </p>
        {semTelefone && (
          <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.25)", fontSize: 12, color: "#CA8A04", fontWeight: 600, lineHeight: 1.5 }}>
            ⚠️ Este candidato não tem WhatsApp cadastrado. A mensagem de boas-vindas não será enviada. Contratar mesmo assim?
          </div>
        )}
        {numeroInvalido && (
          <div style={{ marginBottom: 16, padding: "10px 12px", borderRadius: 8, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", fontSize: 12, color: "#DC2626", fontWeight: 600, lineHeight: 1.5 }}>
            ✗ O número cadastrado não é um celular WhatsApp válido (precisa ter 11 dígitos com DDD + 9). A mensagem de boas-vindas não será enviada. Contratar mesmo assim?
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600, background: "transparent", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600, background: "#16A34A", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Confirmar contratação</button>
        </div>
      </div>
    </div>
  );
}
