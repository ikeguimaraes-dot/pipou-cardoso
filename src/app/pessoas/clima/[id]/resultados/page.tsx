import { requireUser } from "@kph/auth/server";
import { getSurveyWithQuestions, getSurveyResults, type SurveyResult } from "../../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function SurveyResultsPage({ params }: { params: Params }) {
  await requireUser();
  const { id } = await params;

  const [surveyData, results] = await Promise.all([
    getSurveyWithQuestions(id),
    getSurveyResults(id),
  ]);

  if (!surveyData) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <p style={{ color: "var(--text-2)", fontSize: 14 }}>Pesquisa não encontrada.</p>
      </div>
    );
  }

  const { survey } = surveyData;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <header style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "var(--text-3)",
          }}
        >
          Pessoas · DHO · Clima
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            margin: "6px 0 4px",
            color: "var(--text)",
            letterSpacing: -0.4,
          }}
        >
          {survey.titulo}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <a
            href="/pessoas/clima"
            style={{ fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}
          >
            ← Voltar
          </a>
          <span
            style={{
              display: "inline-block",
              padding: "2px 9px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              background: survey.status === "ativa" ? "#D1FAE5" : "#E5E7EB",
              color: survey.status === "ativa" ? "#065F46" : "#374151",
            }}
          >
            {survey.status === "ativa" ? "Ativa" : "Encerrada"}
          </span>
        </div>
      </header>

      {results.length === 0 ? (
        <div
          style={{
            padding: "56px 24px",
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            Nenhuma resposta recebida ainda.
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>
            As respostas aparecerão aqui assim que os colaboradores responderem.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {results.map((result, idx) => (
            <ResultCard key={result.question_id} result={result} idx={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

function getMoodConfig(media: number): { emoji: string; color: string } {
  if (media < 2) return { emoji: "😢", color: "#D85A30" };
  if (media < 3) return { emoji: "😞", color: "#BA7517" };
  if (media < 4) return { emoji: "😐", color: "#888780" };
  if (media < 5) return { emoji: "😊", color: "#1D9E75" };
  return { emoji: "😄", color: "#639922" };
}

function getBarColor(rating: number): string {
  if (rating <= 1) return "#D85A30";
  if (rating <= 2) return "#BA7517";
  if (rating <= 3) return "#888780";
  if (rating <= 4) return "#1D9E75";
  return "#639922";
}

function ResultCard({ result, idx }: { result: SurveyResult; idx: number }) {
  const hasScale = result.media_escala !== null;
  const mood = hasScale ? getMoodConfig(result.media_escala!) : null;
  const total = result.total_respostas;

  const ratings: number[] = [1, 2, 3, 4, 5];

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: hasScale ? 16 : 8,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "var(--text-3)",
              marginBottom: 4,
            }}
          >
            Pergunta {idx + 1}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
            {result.texto_pergunta}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
            {total} {total === 1 ? "resposta" : "respostas"}
          </div>
          {mood && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                justifyContent: "flex-end",
                marginTop: 4,
              }}
            >
              <span style={{ fontSize: 22 }}>{mood.emoji}</span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: mood.color,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {result.media_escala!.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {hasScale && total > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ratings.map(r => {
            const count = (result.distribuicao[String(r)] ?? 0) as number;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const barColor = getBarColor(r);
            return (
              <div
                key={r}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    width: 14,
                    fontWeight: 700,
                    color: "var(--text-3)",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  {r}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 10,
                    background: "var(--border)",
                    borderRadius: 5,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: barColor,
                      borderRadius: 5,
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 28,
                    color: "var(--text-2)",
                    textAlign: "right",
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
