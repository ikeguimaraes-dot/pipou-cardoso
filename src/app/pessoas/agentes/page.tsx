import { Suspense } from "react";
import { createSupabaseServerClient } from "@kph/db/supabase/server";
import { AgentesClient } from "./agentes-client";
import { OrkestriPanel } from "@/components/pessoas/OrkestriPanel";

export const dynamic = "force-dynamic";

// ── Score color — thresholds 80/60 alinhados com @kph/core ────────────
function scoreColor(score: number | null): string {
  if (score == null) return "var(--text-3)";
  if (score >= 80) return "#22C55E";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

// ── Score cap — lógica espelhada de packages/core/src/score-policy.ts ─
// Mantida inline porque este repo não consome @kph/core via workspace.
type ProposalRisk = { id: string; severidade: string | null; titulo: string; status: string };

function applyScoreCap(
  rawScore: number,
  proposals: ProposalRisk[],
): { score_oficial: number; cap_razao: string | null } {
  const pendentes = proposals.filter((p) => p.status === "pending" || p.status === "open");
  const critico = pendentes.find((p) => p.severidade === "CRITICO");
  if (critico) {
    return {
      score_oficial: Math.min(rawScore, 60),
      cap_razao: `Teto 60: risco CRÍTICO — ${critico.titulo}`,
    };
  }
  const alto = pendentes.find((p) => p.severidade === "ALTO");
  if (alto) {
    return {
      score_oficial: Math.min(rawScore, 80),
      cap_razao: `Teto 80: risco ALTO — ${alto.titulo}`,
    };
  }
  return { score_oficial: rawScore, cap_razao: null };
}

/** Score Pessoas — compacto, aparece no header da página */
async function PessoasScoreCard() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    const [scoreRes, proposalsRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("kph_intelligence_scores")
        .select("score, breakdown, semana")
        .eq("modulo", "pessoas")
        .order("semana", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("kph_learning_proposals")
        .select("id, severidade, titulo, status")
        .eq("modulo", "pessoas")
        .in("status", ["pending", "open"])
        .not("severidade", "is", null),
    ]);

    if (!scoreRes.data || typeof scoreRes.data.score !== "number") return null;

    const rawScore: number = scoreRes.data.score;
    const proposals: ProposalRisk[] = proposalsRes.data ?? [];
    const { score_oficial, cap_razao } = applyScoreCap(rawScore, proposals);
    const isCapped = cap_razao != null;

    const bd = (scoreRes.data.breakdown ?? {}) as Record<string, unknown>;
    const color = scoreColor(score_oficial);

    const subItems = [
      { label: "HC",     value: typeof bd.headcount    === "number" ? bd.headcount    : null },
      { label: "Turn.",  value: typeof bd.turnover     === "number" ? bd.turnover     : null },
      { label: "Folha",  value: typeof bd.folha        === "number" ? bd.folha        : null },
      { label: "Movim.", value: typeof bd.movimentacao === "number" ? bd.movimentacao : null },
    ].filter((i) => i.value !== null);

    const semanaLabel = scoreRes.data.semana
      ? new Date(scoreRes.data.semana).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      : null;

    return (
      <div style={{
        padding: "20px 24px",
        background: "var(--surface)",
        border: `1px solid ${isCapped ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 12,
        minWidth: 220,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--text-3)",
          }}>
            Score Pessoas {semanaLabel ? `· ${semanaLabel}` : ""}
          </div>
          {isCapped && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", padding: "2px 6px", borderRadius: 4,
              background: "rgba(239,68,68,0.12)", color: "#EF4444",
            }}>
              TETO
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 44, fontWeight: 800, color, lineHeight: 1,
            fontFamily: "var(--font-heading)",
          }}>
            {score_oficial}
          </span>
          <span style={{ fontSize: 16, color: "var(--text-3)", fontWeight: 500 }}>/100</span>
        </div>

        {isCapped && (
          <div style={{ fontSize: 10, color: "#EF4444", marginBottom: 8, lineHeight: 1.4 }}>
            {cap_razao}
          </div>
        )}

        {/* Barra de progresso */}
        <div style={{ height: 3, background: "var(--surface-2)", borderRadius: 2, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${score_oficial}%`, background: color, borderRadius: 2 }} />
        </div>

        {subItems.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {subItems.map(({ label, value }) => (
              <div key={label} style={{
                display: "flex", gap: 4, alignItems: "center",
                padding: "3px 8px",
                background: "var(--surface-2)",
                borderRadius: 6, fontSize: 11,
              }}>
                <span style={{ color: "var(--text-3)" }}>{label}</span>
                <span style={{
                  fontWeight: 700, color: scoreColor(value as number),
                  fontFamily: "var(--font-heading)",
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (e) {
    console.error("[PessoasScoreCard]", e);
    return null;
  }
}

interface ScoreRow {
  modulo: string;
  score: number;
  score_oficial: number | null;
  cap_razao: string | null;
  semana: string;
}

/** Strip horizontal com scores por módulo IA */
async function ScoresPorModulo() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("kph_intelligence_scores")
      .select("modulo, score, score_oficial, cap_razao, semana")
      .not("modulo", "is", null)
      .order("semana", { ascending: false });

    if (!data || data.length === 0) return null;

    const byModulo = new Map<string, ScoreRow>();
    for (const row of data as ScoreRow[]) {
      if (row.modulo && !byModulo.has(row.modulo)) byModulo.set(row.modulo, row);
    }

    const rows = Array.from(byModulo.values());
    if (rows.length === 0) return null;

    const LABEL: Record<string, string> = {
      pessoas: "Pessoas", financeiro: "Financeiro", operacao: "Operação",
      compras: "Compras", comercial: "Comercial", marca: "Marca",
    };

    return (
      <div style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 40px",
        display: "flex",
        alignItems: "stretch",
        background: "var(--surface)",
        overflowX: "auto",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--text-3)",
          padding: "12px 20px 12px 0",
          borderRight: "1px solid var(--border)",
          display: "flex", alignItems: "center",
          flexShrink: 0, whiteSpace: "nowrap",
        }}>
          Módulos IA
        </div>
        {rows.map((row) => {
          // score_oficial já gravado pelo shell; fallback para score bruto se ainda não calculado
          const display = row.score_oficial ?? row.score;
          const isCapped = row.cap_razao != null;
          return (
            <div key={row.modulo} style={{
              padding: "10px 20px",
              borderRight: "1px solid var(--border)",
              display: "flex", flexDirection: "column",
              alignItems: "flex-start", gap: 2, flexShrink: 0,
            }}
            title={isCapped ? row.cap_razao ?? undefined : undefined}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.06em" }}>
                  {LABEL[row.modulo] ?? row.modulo}
                </span>
                {isCapped && (
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", padding: "1px 4px", borderRadius: 3,
                    background: "rgba(239,68,68,0.12)", color: "#EF4444", lineHeight: 1.4,
                  }}>
                    TETO
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 20, fontWeight: 800,
                color: scoreColor(display),
                fontFamily: "var(--font-heading)",
                lineHeight: 1,
              }}>
                {display}
              </span>
            </div>
          );
        })}
      </div>
    );
  } catch (e) {
    console.error("[ScoresPorModulo]", e);
    return null;
  }
}

export default function AgentesPage() {
  return (
    <div>
      {/* Page header */}
      <header style={{
        padding: "36px 40px 32px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-start",
        gap: 32,
        flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
            textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10,
          }}>
            KPH Pessoas · Módulo IA
          </div>
          <h1 style={{
            margin: 0, fontSize: 32, fontWeight: 800,
            color: "var(--text)", letterSpacing: -1, lineHeight: 1,
            fontFamily: "var(--font-heading)",
          }}>
            Agentes IA
          </h1>
          <p style={{
            margin: "10px 0 0", fontSize: 14,
            color: "var(--text-3)", lineHeight: 1.6, maxWidth: 420,
          }}>
            Inteligência autônoma para Recrutamento &amp; Seleção e SAC Interno do Cardoso.
          </p>
        </div>

        <Suspense fallback={null}>
          <PessoasScoreCard />
        </Suspense>
      </header>

      {/* Strip de scores por módulo */}
      <Suspense fallback={null}>
        <ScoresPorModulo />
      </Suspense>

      {/* Roster de agentes */}
      <div style={{ padding: "36px 40px" }}>
        <div style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: "var(--text-3)", marginBottom: 20,
        }}>
          Agentes ativos
        </div>
        <AgentesClient />
      </div>

      {/* Orkestri — Learning Machine proposals */}
      <div style={{
        padding: "0 40px 48px",
        borderTop: "1px solid var(--border)",
        paddingTop: 36,
      }}>
        <OrkestriPanel modulo="pessoas" />
      </div>
    </div>
  );
}
