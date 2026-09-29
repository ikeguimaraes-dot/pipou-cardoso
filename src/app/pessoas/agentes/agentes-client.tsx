"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// Métricas ao vivo buscadas via API route
interface LiveMetrics {
  maya: {
    conversasAtivas: number;
    candidatosTotal: number;
    taxaAutonoma: number; // %
  };
  theo: {
    ticketsAbertos: number;
    friccoes: number;
    topIntencao: string | null;
  };
  lastUpdated: number;
}

const EMPTY_METRICS: LiveMetrics = {
  maya: { conversasAtivas: 0, candidatosTotal: 0, taxaAutonoma: 0 },
  theo: { ticketsAbertos: 0, friccoes: 0, topIntencao: null },
  lastUpdated: 0,
};

async function fetchLiveMetrics(): Promise<LiveMetrics> {
  const res = await fetch("/api/pessoas/agentes/metrics", { cache: "no-store" });
  if (!res.ok) throw new Error("metrics unavailable");
  return res.json() as Promise<LiveMetrics>;
}

function useLiveMetrics(pollMs = 30_000) {
  const [metrics, setMetrics] = useState<LiveMetrics>(EMPTY_METRICS);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const m = await fetchLiveMetrics();
        if (!cancelled) setMetrics(m);
      } catch (e) {
        console.error("[fetchLiveMetrics]", e);
      }
    }

    void load();
    const id = setInterval(load, pollMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [pollMs]);

  return metrics;
}

interface AgentDef {
  key: "maya" | "theo";
  name: string;
  role: string;
  scope: string[];
  color: string;
  colorDim: string;
  colorBorder: string;
  accentRgb: string;
}

const AGENTS: AgentDef[] = [
  {
    key: "maya",
    name: "Maya",
    role: "Recrutamento & Seleção",
    scope: [
      "Abertura e publicação de vagas",
      "Triagem e qualificação de candidatos",
      "Agendamento de entrevistas",
      "Handoff para GM e equipe de RH",
    ],
    color: "#C9A96E",
    colorDim: "rgba(201,169,110,0.07)",
    colorBorder: "rgba(201,169,110,0.22)",
    accentRgb: "201,169,110",
  },
  {
    key: "theo",
    name: "Theo",
    role: "SAC Interno · RH",
    scope: [
      "Dúvidas sobre holerites e deduções",
      "Consultas de ponto, férias e banco de horas",
      "Informações de benefícios (VT, VR)",
      "Escalamento para RH humano",
    ],
    color: "#7EB8C9",
    colorDim: "rgba(126,184,201,0.07)",
    colorBorder: "rgba(126,184,201,0.22)",
    accentRgb: "126,184,201",
  },
];

function AgentCard({ agent, metrics }: { agent: AgentDef; metrics: LiveMetrics }) {
  const openChat = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("kph-open-agent", { detail: { agent: agent.key } }),
    );
  }, [agent.key]);

  // Pill de métrica individual
  function MetricPill({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "8px 10px", borderRadius: 8,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        minWidth: 60, flex: "1 1 60px",
      }}>
        <span style={{
          fontSize: 16, fontWeight: 800, lineHeight: 1,
          color: accent ?? "var(--text)",
          fontFamily: "var(--font-heading)",
        }}>
          {value}
        </span>
        <span style={{ fontSize: 9, color: "var(--text-3)", marginTop: 4, textAlign: "center", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
    );
  }

  const mayaM = metrics.maya;
  const theoM = metrics.theo;

  return (
    <article
      aria-label={`Agente ${agent.name}`}
      style={{
        flex: "1 1 320px",
        minWidth: 290,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${agent.color}`,
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header do agente */}
      <div style={{
        padding: "24px 24px 20px",
        background: agent.colorDim,
        borderBottom: `1px solid ${agent.colorBorder}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
      }}>
        {/* Avatar quadrado com inicial serif */}
        <div
          role="img"
          aria-label={`Avatar de ${agent.name}`}
          style={{
            width: 50, height: 50, borderRadius: 10,
            background: `rgba(${agent.accentRgb}, 0.14)`,
            border: `1.5px solid rgba(${agent.accentRgb}, 0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: agent.color,
            fontFamily: "var(--font-heading)",
            flexShrink: 0,
          }}
        >
          {agent.name[0]}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 22, fontWeight: 800,
            color: "var(--text)", letterSpacing: -0.5, lineHeight: 1,
            fontFamily: "var(--font-heading)",
          }}>
            {agent.name}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: agent.color, marginTop: 5,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            {agent.role}
          </div>
        </div>

        {/* Status online */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <div
            aria-hidden="true"
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--brasa)",
              boxShadow: "0 0 7px rgba(252,214,22,0.5)",
            }}
          />
          <span style={{ fontSize: 10, color: "var(--brasa)", fontWeight: 700, letterSpacing: "0.06em" }}>
            ONLINE
          </span>
        </div>
      </div>

      {/* Escopo de responsabilidades */}
      <div style={{ padding: "20px 24px", flex: 1 }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--text-3)", marginBottom: 12,
        }}>
          Escopo
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
          {agent.scope.map((item) => (
            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "var(--text-2)", lineHeight: 1.4 }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: agent.color, flexShrink: 0, marginTop: 5,
              }} />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Métricas ao vivo */}
      <div style={{ padding: "0 24px 20px" }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--text-3)", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          Métricas ao vivo
          {metrics.lastUpdated > 0 && (
            <span style={{
              display: "inline-block", width: 5, height: 5, borderRadius: "50%",
              background: "var(--brasa)", boxShadow: "0 0 5px rgba(252,214,22,0.5)",
            }} />
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {agent.key === "maya" ? (
            <>
              <MetricPill label="Ativas" value={mayaM.conversasAtivas} accent={agent.color} />
              <MetricPill label="Candidatos" value={mayaM.candidatosTotal} />
              <MetricPill label="Autônoma" value={`${mayaM.taxaAutonoma}%`} accent={mayaM.taxaAutonoma >= 70 ? "#22C55E" : mayaM.taxaAutonoma >= 50 ? "#F59E0B" : "#EF4444"} />
            </>
          ) : (
            <>
              <MetricPill label="Abertos" value={theoM.ticketsAbertos} accent={theoM.ticketsAbertos > 20 ? "#EF4444" : agent.color} />
              <MetricPill label="Fricções" value={theoM.friccoes} accent={theoM.friccoes > 10 ? "#EF4444" : "var(--text-3)"} />
              <MetricPill label="Top intent" value={theoM.topIntencao ? theoM.topIntencao.slice(0, 8) : "—"} />
            </>
          )}
        </div>
      </div>

      {/* Ações */}
      <div style={{
        padding: "16px 24px",
        borderTop: "1px solid var(--border)",
        display: "flex", gap: 8,
      }}>
        <Link
          href={`/pessoas/agentes/${agent.key}`}
          style={{
            flex: 1, padding: "10px 0",
            borderRadius: 8,
            background: `rgba(${agent.accentRgb}, 0.12)`,
            border: `1px solid rgba(${agent.accentRgb}, 0.3)`,
            color: agent.color,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textAlign: "center", textDecoration: "none",
            display: "block", textTransform: "uppercase",
          }}
        >
          Ver Painel
        </Link>
        <button
          onClick={openChat}
          aria-label={`Abrir chat com ${agent.name}`}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-3)",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            cursor: "pointer", textTransform: "uppercase",
          }}
        >
          Chat
        </button>
      </div>
    </article>
  );
}

export function AgentesClient() {
  const metrics = useLiveMetrics(30_000);

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
      {AGENTS.map((agent) => (
        <AgentCard key={agent.key} agent={agent} metrics={metrics} />
      ))}
    </div>
  );
}
