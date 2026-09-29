"use client";

import { useState, useTransition } from "react";
import { approveProposal, dismissProposal } from "@/app/pessoas/agentes/actions-proposals";
import type { LearningProposal } from "@/app/pessoas/agentes/actions-proposals";

const TIPO_LABEL: Record<string, string> = {
  faq: "FAQ",
  prompt: "Prompt",
  processo: "Processo",
  integracao: "Integração",
};

const TIPO_COLOR: Record<string, string> = {
  faq: "#3B82F6",
  prompt: "#8B5CF6",
  processo: "#F59E0B",
  integracao: "#10B981",
};

const PRIORIDADE_COLOR: Record<string, string> = {
  alta: "#EF4444",
  media: "#F59E0B",
  baixa: "#6B7280",
};

interface Props {
  proposals: LearningProposal[];
}

export function OrkestriPanelClient({ proposals }: Props) {
  const [items, setItems] = useState<LearningProposal[]>(proposals);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ id: string; type: "ok" | "err"; msg: string } | null>(null);

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const res = await approveProposal(id);
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id));
        setFeedback({ id, type: "ok", msg: "Aprovada" });
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedback({ id, type: "err", msg: res.error });
      }
    });
  };

  const handleDismiss = (id: string) => {
    startTransition(async () => {
      const res = await dismissProposal(id);
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id));
        setFeedback({ id, type: "ok", msg: "Descartada" });
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedback({ id, type: "err", msg: res.error });
      }
    });
  };

  if (items.length === 0) {
    return (
      <div style={{
        padding: "32px 28px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
          Todas as propostas foram revisadas.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Contador */}
      <div style={{
        fontSize: 11, color: "var(--text-3)",
        marginBottom: 4,
      }}>
        {items.length} proposta{items.length > 1 ? "s" : ""} pendente{items.length > 1 ? "s" : ""} de revisão
      </div>

      {items.map((p) => {
        const isOpen = expanded === p.id;
        const tipoColor = TIPO_COLOR[p.tipo] ?? "#8A8278";
        const prioColor = PRIORIDADE_COLOR[p.prioridade] ?? "#6B7280";
        const fb = feedback?.id === p.id ? feedback : null;

        return (
          <div
            key={p.id}
            style={{
              background: "var(--surface)",
              border: `1px solid var(--border)`,
              borderLeft: `3px solid ${prioColor}`,
              borderRadius: 12,
              overflow: "hidden",
              transition: "box-shadow 180ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Row principal */}
            <div
              style={{
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
              onClick={() => setExpanded(isOpen ? null : p.id)}
            >
              {/* Badges tipo + prioridade */}
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <span style={{
                  padding: "2px 7px",
                  background: `${tipoColor}18`,
                  border: `1px solid ${tipoColor}44`,
                  borderRadius: 4,
                  fontSize: 10, fontWeight: 700,
                  color: tipoColor,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  {TIPO_LABEL[p.tipo] ?? p.tipo}
                </span>
                <span style={{
                  padding: "2px 7px",
                  background: `${prioColor}18`,
                  border: `1px solid ${prioColor}44`,
                  borderRadius: 4,
                  fontSize: 10, fontWeight: 700,
                  color: prioColor,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}>
                  {p.prioridade}
                </span>
              </div>

              {/* Título */}
              <span style={{
                flex: 1, fontSize: 14, fontWeight: 600,
                color: "var(--text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {p.titulo}
              </span>

              {/* Data */}
              <span style={{
                fontSize: 11, color: "var(--text-3)", flexShrink: 0,
              }}>
                {new Date(p.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "short",
                })}
              </span>

              {/* Chevron */}
              <span style={{
                color: "var(--text-3)", fontSize: 12, flexShrink: 0,
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 180ms ease",
              }}>
                ▾
              </span>
            </div>

            {/* Conteúdo expandido */}
            {isOpen && (
              <div style={{
                padding: "0 18px 18px",
                borderTop: "1px solid var(--border)",
              }}>
                {/* Descrição */}
                <p style={{
                  margin: "14px 0 0", fontSize: 13,
                  color: "var(--text-2)", lineHeight: 1.65,
                }}>
                  {p.descricao}
                </p>

                {/* Evidência */}
                {p.evidencia && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "var(--text-3)", marginBottom: 4,
                    }}>
                      Evidência
                    </div>
                    <div style={{
                      padding: "8px 12px",
                      background: "var(--surface-2, rgba(245,240,232,0.04))",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12, color: "var(--text-2)",
                      fontFamily: "monospace", lineHeight: 1.5,
                    }}>
                      {p.evidencia}
                    </div>
                  </div>
                )}

                {/* Impacto estimado */}
                {p.impacto_estimado && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      color: "var(--text-3)", marginBottom: 4,
                    }}>
                      Impacto estimado
                    </div>
                    <p style={{
                      margin: 0, fontSize: 13,
                      color: "var(--text-2)", lineHeight: 1.55,
                      fontStyle: "italic",
                    }}>
                      {p.impacto_estimado}
                    </p>
                  </div>
                )}

                {/* Ações */}
                <div style={{
                  display: "flex", gap: 8, marginTop: 18,
                  alignItems: "center",
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApprove(p.id); }}
                    disabled={isPending}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 16px",
                      background: "rgba(34,197,94,0.10)",
                      border: "1px solid rgba(34,197,94,0.30)",
                      borderRadius: 8, cursor: isPending ? "not-allowed" : "pointer",
                      fontSize: 13, fontWeight: 600, color: "#22C55E",
                      transition: "all 180ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isPending) {
                        e.currentTarget.style.background = "rgba(34,197,94,0.18)";
                        e.currentTarget.style.borderColor = "rgba(34,197,94,0.50)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(34,197,94,0.10)";
                      e.currentTarget.style.borderColor = "rgba(34,197,94,0.30)";
                    }}
                  >
                    ✓ Aprovar
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDismiss(p.id); }}
                    disabled={isPending}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 16px",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 8, cursor: isPending ? "not-allowed" : "pointer",
                      fontSize: 13, fontWeight: 500,
                      color: "var(--text-3)",
                      transition: "all 180ms ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isPending) {
                        e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
                        e.currentTarget.style.color = "#EF4444";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-3)";
                    }}
                  >
                    ✕ Descartar
                  </button>

                  {/* Feedback inline */}
                  {fb && (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: fb.type === "ok" ? "#22C55E" : "#EF4444",
                      marginLeft: 4,
                    }}>
                      {fb.type === "ok" ? `✓ ${fb.msg}` : `✕ ${fb.msg}`}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
