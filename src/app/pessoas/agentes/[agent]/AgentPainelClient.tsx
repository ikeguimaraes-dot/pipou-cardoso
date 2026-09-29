"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react";
import { AgentConversasClient } from "./AgentConversasClient";
import { gerarInsightAgente } from "./actions";
import type { AgentConversation, AgentKey, NameMap } from "./page";

// ─── Types ────────────────────────────────────────────────────────

type Tab = "visao-geral" | "conversas" | "insights" | "custo" | "prompts";

type Meta = {
  name: string;
  role: string;
  color: string;
  colorBorder: string;
  colorDim: string;
};

export type ConversaStats = {
  total: number;
  ativas: number;
  assumidas: number;
  encerradas: number;
  taxaAutonoma: number;
};

export type KphInsight = {
  id: string;
  semana: string;
  insight_text: string;
  dados_referencia: Record<string, unknown> | null;
  gerado_por: string | null;
  aprovado: boolean | null;
  created_at: string;
};

export type CustoData = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  avgLatencyMs: number;
  totalCalls: number;
};

export type IntencoesItem = { intencao: string; count: number };

export type MayaData = {
  candidatosTotal: number;
  qualificados: number;
  emAndamento: number;
  naoAvancaram: number;
};

export type TheoData = {
  ticketsTotal: number;
  abertos: number;
  resolvidos: number;
  intencoes: IntencoesItem[];
  friccoes: number;
};

export type PromptVersion = {
  id: string;
  agent: string;
  version: string;
  system_prompt: string;
  ativado_em: string;
  nota: string | null;
  ativo: boolean;
};

interface Props {
  agent: AgentKey;
  meta: Meta;
  conversations: AgentConversation[];
  nameMap: NameMap;
  stats: ConversaStats;
  insights: KphInsight[];
  custo: CustoData;
  mayaData?: MayaData;
  theoData?: TheoData;
  dadosInsight: Record<string, unknown>;
  promptVersions: PromptVersion[];
  readOnly?: boolean;
  metricsAvailable?: boolean;
  loadErrors?: Partial<Record<Tab, boolean>>;
}

// ─── Tabs ─────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "visao-geral",  label: "Visão Geral" },
  { key: "conversas",    label: "Conversas"   },
  { key: "insights",     label: "Insights"    },
  { key: "custo",        label: "Custo"       },
  { key: "prompts",      label: "Prompts"     },
];

// ─── Primitivos ───────────────────────────────────────────────────

function scoreColor(v: number) {
  return v >= 70 ? "#22C55E" : v >= 50 ? "#F59E0B" : "#EF4444";
}

function KpiCard({
  label, value, sub, accent, borderColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  borderColor?: string;
}) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: borderColor ? `3px solid ${borderColor}` : "1px solid var(--border)",
      borderRadius: 10,
      padding: "16px 18px",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--text-3)", marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 800,
        color: accent ?? "var(--text)",
        fontFamily: "var(--font-heading)",
        lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>{sub}</div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

// ─── Visão Geral ─────────────────────────────────────────────────

function VisaoGeral({
  meta, stats, mayaData, theoData, agent, metricsAvailable,
}: {
  meta: Meta;
  stats: ConversaStats;
  mayaData?: MayaData;
  theoData?: TheoData;
  agent: AgentKey;
  metricsAvailable: boolean;
}) {
  const taxaColor = scoreColor(stats.taxaAutonoma);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Taxa de resolução autônoma — featured */}
      <div style={{
        padding: "20px 24px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4,
            }}>
              Resolução autônoma
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              conversas encerradas sem intervenção humana
            </div>
          </div>
          <div style={{
            fontSize: 36, fontWeight: 800,
            color: taxaColor, lineHeight: 1,
            fontFamily: "var(--font-heading)",
          }}>
            {stats.taxaAutonoma}%
          </div>
        </div>
        <div style={{ height: 5, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${stats.taxaAutonoma}%`,
            background: taxaColor, borderRadius: 3,
          }} />
        </div>
      </div>

      {/* KPIs de conversas */}
      <div>
        <SectionTitle>Conversas</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <KpiCard label="Total" value={stats.total} borderColor={meta.color} />
          <KpiCard label="Em atendimento IA" value={stats.ativas} accent={meta.color} borderColor={meta.color} />
          <KpiCard label="Assumidas" value={stats.assumidas} />
          <KpiCard label="Encerradas" value={stats.encerradas} />
        </div>
      </div>

      {/* Maya: candidatos */}
      {agent === "maya" && mayaData && (
        <div>
          <SectionTitle>Pipeline R&S</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <KpiCard label="Candidatos totais" value={mayaData.candidatosTotal} borderColor={meta.color} />
            <KpiCard label="Qualificados" value={mayaData.qualificados} accent="#22C55E" borderColor="#22C55E" />
            <KpiCard label="Em andamento" value={mayaData.emAndamento} accent={meta.color} borderColor={meta.color} />
            <KpiCard label="Não avançaram" value={mayaData.naoAvancaram} accent="var(--text-3)" />
          </div>
        </div>
      )}

      {/* Theo: tickets + intenções */}
      {agent === "theo" && theoData && (
        <>
          <div>
            <SectionTitle>Tickets RH</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              <KpiCard label="Tickets totais" value={theoData.ticketsTotal} borderColor={meta.color} />
              <KpiCard label="Abertos" value={theoData.abertos} accent={meta.color} borderColor={meta.color} />
              <KpiCard label="Resolvidos" value={theoData.resolvidos} accent="#22C55E" borderColor="#22C55E" />
              <KpiCard
                label="Fricções"
                value={metricsAvailable ? theoData.friccoes : "—"}
                accent={theoData.friccoes > 10 ? "#EF4444" : "var(--text-3)"}
                borderColor={theoData.friccoes > 10 ? "#EF4444" : undefined}
                sub={metricsAvailable ? "sem resposta detectada" : "Métrica indisponível nesta conexão"}
              />
            </div>
          </div>

          {metricsAvailable && theoData.intencoes.length > 0 && (
            <div>
              <SectionTitle>Intenções mais frequentes</SectionTitle>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)", overflow: "hidden" }}>
                {theoData.intencoes.slice(0, 8).map((item, i) => {
                  const max = theoData.intencoes[0]?.count ?? 1;
                  const pct = Math.round((item.count / max) * 100);
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "11px 18px",
                      borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    }}>
                      <div style={{
                        width: 32, textAlign: "right",
                        fontSize: 12, fontWeight: 800,
                        color: meta.color,
                        fontFamily: "var(--font-heading)",
                        fontVariantNumeric: "tabular-nums", flexShrink: 0,
                      }}>
                        {item.count}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: "var(--text)", textTransform: "capitalize" }}>
                        {item.intencao || "—"}
                      </div>
                      <div style={{ width: 100, height: 3, borderRadius: 2, background: "var(--surface-2)", overflow: "hidden", flexShrink: 0 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: meta.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Insights Semanais ────────────────────────────────────────────

function InsightsSemanais({
  agent, meta, insights: initial, dadosInsight, readOnly,
}: {
  agent: AgentKey;
  meta: Meta;
  insights: KphInsight[];
  dadosInsight: Record<string, unknown>;
  readOnly: boolean;
}) {
  const [insights, setInsights] = useState<KphInsight[]>(initial);
  const [isPending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleGerar() {
    if (readOnly) return;
    setError(null);
    setSuccess(false);
    start(async () => {
      const res = await gerarInsightAgente(agent, dadosInsight);
      if (!res.ok) { setError(res.error); return; }
      const now = new Date().toISOString();
      const semana = now.split("T")[0] ?? now.slice(0, 10);
      setInsights((prev) => [{
        id: res.data.id, semana,
        insight_text: res.data.insight_text,
        dados_referencia: dadosInsight,
        gerado_por: "painel-agentes",
        aprovado: false,
        created_at: now,
      }, ...prev]);
      setSuccess(true);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header + botão */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Insights semanais gerados por IA</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>
            Baseado em dados reais de conversas, métricas e tickets da semana.
          </div>
        </div>
        <button
          onClick={handleGerar}
          disabled={isPending || readOnly}
          title={readOnly ? "Geração indisponível no modo de leitura local" : undefined}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 8,
            border: `1px solid ${meta.colorBorder}`,
            background: meta.colorDim, color: meta.color,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
            textTransform: "uppercase",
            cursor: isPending || readOnly ? "not-allowed" : "pointer",
            opacity: isPending || readOnly ? 0.7 : 1, flexShrink: 0,
          }}
        >
          {isPending
            ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            : <Sparkles size={12} />}
          {isPending ? "Gerando…" : "Gerar agora"}
        </button>
      </div>

      {error && (
        <div style={{
          display: "flex", gap: 8, padding: "10px 14px",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8, fontSize: 12, color: "#EF4444",
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}
      {success && (
        <div style={{
          display: "flex", gap: 8, padding: "10px 14px",
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 8, fontSize: 12, color: "#22C55E",
        }}>
          <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          Insight gerado e salvo com sucesso.
        </div>
      )}

      {/* Lista */}
      {insights.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, color: "var(--text-3)", fontSize: 13,
        }}>
          Nenhum insight gerado ainda.
          <br />
          <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4, display: "block" }}>
            Clique em "Gerar agora" para criar o primeiro.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {insights.map((ins) => {
            const data = new Date(ins.created_at);
            const dataStr = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
            const horaStr = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={ins.id} style={{
                padding: "18px 20px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderLeft: `3px solid ${meta.color}`,
                borderRadius: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", color: "var(--text-3)",
                    }}>
                      Semana {ins.semana}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                      · {dataStr} {horaStr}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {ins.aprovado ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px",
                        borderRadius: 99, background: "rgba(34,197,94,0.12)", color: "#22C55E",
                      }}>
                        Aprovado
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px",
                        borderRadius: 99, background: "var(--surface-2)", color: "var(--text-3)",
                      }}>
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>
                  {ins.insight_text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Custo ───────────────────────────────────────────────────────

function CustoPanel({ custo, meta }: { custo: CustoData; meta: Meta }) {
  const totalTokens = custo.inputTokens + custo.outputTokens;
  const costBrl = custo.costUsd * 5.7;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <SectionTitle>Consumo de tokens</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <KpiCard label="Total calls" value={custo.totalCalls.toLocaleString("pt-BR")} borderColor={meta.color} />
          <KpiCard label="Input tokens" value={custo.inputTokens.toLocaleString("pt-BR")} />
          <KpiCard label="Output tokens" value={custo.outputTokens.toLocaleString("pt-BR")} />
          <KpiCard label="Total tokens" value={totalTokens.toLocaleString("pt-BR")} accent={meta.color} borderColor={meta.color} />
        </div>
      </div>

      <div>
        <SectionTitle>Custo estimado</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <KpiCard
            label="Custo USD"
            value={custo.costUsd > 0 ? `$${custo.costUsd.toFixed(4)}` : "—"}
            sub="Claude Haiku"
            borderColor={meta.color}
          />
          <KpiCard
            label="Custo BRL estimado"
            value={custo.costUsd > 0 ? `R$${costBrl.toFixed(2)}` : "—"}
            sub="câmbio ≈ R$5,70"
          />
          <KpiCard
            label="Latência média"
            value={custo.avgLatencyMs > 0 ? `${custo.avgLatencyMs}ms` : "—"}
          />
        </div>
      </div>

      {custo.totalCalls === 0 && (
        <div style={{
          padding: "20px", background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 10,
          fontSize: 12, color: "var(--text-3)", lineHeight: 1.6,
        }}>
          Nenhuma métrica registrada em <code>agent_metrics</code> para este agente ainda.
        </div>
      )}
    </div>
  );
}

// ─── Versões de Prompt ────────────────────────────────────────────

function VersoesPrompt({ meta, versions }: { meta: Meta; versions: PromptVersion[] }) {
  const [expanded, setExpanded] = useState<string | null>(versions.find((v) => v.ativo)?.id ?? null);

  if (versions.length === 0) {
    return (
      <div style={{
        padding: "48px 24px", textAlign: "center",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 10, color: "var(--text-3)", fontSize: 13,
      }}>
        Nenhuma versão de prompt registrada.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>
        {versions.length} versão{versions.length !== 1 ? "ões" : ""} registrada{versions.length !== 1 ? "s" : ""}
        &nbsp;· Versão ativa destacada
      </div>
      {versions.map((v) => {
        const isActive = v.ativo;
        const isOpen = expanded === v.id;
        const date = new Date(v.ativado_em).toLocaleDateString("pt-BR", {
          day: "2-digit", month: "2-digit", year: "numeric",
        });
        return (
          <div key={v.id} style={{
            background: "var(--surface)",
            border: isActive ? `1px solid ${meta.colorBorder}` : "1px solid var(--border)",
            borderLeft: isActive ? `3px solid ${meta.color}` : "3px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
          }}>
            {/* Header clicável */}
            <button
              onClick={() => setExpanded(isOpen ? null : v.id)}
              style={{
                width: "100%", background: "none", border: "none",
                padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{
                fontSize: 13, fontWeight: 800,
                color: isActive ? meta.color : "var(--text)",
                fontFamily: "var(--font-heading)", flexShrink: 0,
              }}>
                v{v.version}
              </div>
              {isActive && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px",
                  borderRadius: 99, background: isActive ? meta.colorDim : "var(--surface-2)",
                  color: meta.color, flexShrink: 0,
                }}>
                  ATIVO
                </span>
              )}
              <div style={{ flex: 1, fontSize: 12, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {v.nota ?? "—"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{date}</div>
              <div style={{
                fontSize: 10, color: "var(--text-3)", flexShrink: 0,
                transform: isOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}>▾</div>
            </button>

            {/* System prompt expandido */}
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--border)", padding: "14px 18px" }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10,
                }}>
                  System Prompt
                </div>
                <pre style={{
                  margin: 0, fontSize: 11, color: "var(--text-2)",
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "14px 16px",
                  overflowX: "auto", lineHeight: 1.8,
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {v.system_prompt}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────

export function AgentPainelClient({
  agent, meta, conversations, nameMap, stats,
  insights, custo, mayaData, theoData, dadosInsight, promptVersions,
  readOnly = false, metricsAvailable = true, loadErrors = {},
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("visao-geral");

  const tabContent: React.CSSProperties =
    activeTab === "conversas"
      ? { flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }
      : { flex: 1, minHeight: 0, overflowY: "auto", padding: "28px 32px" };

  return (
    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Barra colorida no topo — assinatura do agente */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${meta.color}, ${meta.color}50)`,
        flexShrink: 0,
      }} />

      {/* Header com breadcrumb + identidade + tabs */}
      <div style={{
        flexShrink: 0,
        padding: "18px 32px 0",
        borderBottom: "1px solid var(--border)",
        background: meta.colorDim,
      }}>
        {/* Breadcrumb */}
        <Link
          href="/pessoas/agentes"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, color: "var(--text-3)", fontWeight: 500,
            textDecoration: "none", marginBottom: 14,
            letterSpacing: "0.02em",
          }}
        >
          <ChevronLeft size={12} />
          Agentes IA
        </Link>

        {/* Identidade */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {/* Avatar quadrado serif */}
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: meta.colorDim,
            border: `2px solid ${meta.colorBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: meta.color,
            fontFamily: "var(--font-heading)",
            flexShrink: 0,
          }}>
            {meta.name[0]}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 22, fontWeight: 800,
              color: "var(--text)", letterSpacing: -0.5, lineHeight: 1,
              fontFamily: "var(--font-heading)",
            }}>
              {meta.name}
            </div>
            <div style={{
              fontSize: 11, color: meta.color,
              fontWeight: 600, marginTop: 4,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              {meta.role}
            </div>
          </div>

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--brasa)",
              boxShadow: "0 0 6px rgba(252,214,22,0.5)",
            }} />
            <span style={{ fontSize: 10, color: "var(--brasa)", fontWeight: 700, letterSpacing: "0.06em" }}>
              {readOnly ? "SOMENTE LEITURA" : "PAINEL"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: -1, overflowX: "auto" }}>
          {TABS.map(({ key, label }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "8px 16px",
                  fontSize: 11, fontWeight: active ? 700 : 500,
                  color: active ? meta.color : "var(--text-3)",
                  background: "none", border: "none",
                  borderBottom: active ? `2px solid ${meta.color}` : "2px solid transparent",
                  cursor: "pointer",
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  transition: "all 0.15s",
                }}
              >
                {label}
                {key === "conversas" && stats.total > 0 && (
                  <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 800, color: meta.color }}>
                    {stats.total}
                  </span>
                )}
                {key === "insights" && insights.length > 0 && (
                  <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 800, color: meta.color }}>
                    {insights.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {readOnly && (
        <div role="status" style={{ padding: "12px 32px", background: "rgba(252,214,22,0.06)", borderBottom: "1px solid var(--border)", fontSize: 12, lineHeight: 1.6, flexShrink: 0 }}>
          <strong style={{ color: "var(--brasa)" }}>Visualização local · somente leitura.</strong>{" "}
          Os dados exibidos respeitam as permissões da sua sessão e podem representar apenas parte dos registros.
          Custos, intenções e fricções não estão disponíveis nesta conexão. Envio de mensagens, alterações de atendimento
          e geração de insights dependem da configuração administrativa do servidor.
        </div>
      )}

      {/* Conteúdo da tab */}
      <div style={tabContent}>
        {loadErrors[activeTab] && (
          <p role="alert" style={{ padding: 20, color: "var(--text-2)" }}>Não foi possível carregar os dados desta aba. Atualize a página para tentar novamente.</p>
        )}
        {!loadErrors[activeTab] && activeTab === "visao-geral" && (
          <VisaoGeral meta={meta} stats={stats} mayaData={mayaData} theoData={theoData} agent={agent} metricsAvailable={metricsAvailable} />
        )}
        {!loadErrors[activeTab] && activeTab === "conversas" && (
          <AgentConversasClient agent={agent} conversations={conversations} meta={meta} nameMap={nameMap} readOnly={readOnly} />
        )}
        {!loadErrors[activeTab] && activeTab === "insights" && (
          <InsightsSemanais agent={agent} meta={meta} insights={insights} dadosInsight={dadosInsight} readOnly={readOnly || !metricsAvailable || Boolean(loadErrors["visao-geral"])} />
        )}
        {activeTab === "custo" && (
          metricsAvailable ? <CustoPanel custo={custo} meta={meta} /> : (
            <div role="status" style={{ padding: 24, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" }}>
              <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Métricas de custo indisponíveis</h2>
              <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0 }}>A leitura das métricas exige a conexão administrativa do servidor. Nenhum valor zero foi presumido.</p>
            </div>
          )
        )}
        {!loadErrors[activeTab] && activeTab === "prompts" && (
          <VersoesPrompt meta={meta} versions={promptVersions} />
        )}
      </div>
    </div>
  );
}
