import { Suspense } from "react";
import { requireUser } from "@kph/auth/server";
import {
  getClimateSurveys,
  publishSurveyAction,
  closeSurveyAction,
  type ClimateSurvey,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ClimaSurveysPage() {
  await requireUser();

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <header
        style={{
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}
          >
            Pessoas · DHO
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              margin: "6px 0 0",
              color: "var(--text)",
              letterSpacing: -0.4,
            }}
          >
            Pesquisas de Clima
          </h1>
        </div>
        <a
          href="/pessoas/clima/nova"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 18px",
            background: "var(--brand)",
            color: "var(--primary-foreground)",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          + Nova Pesquisa
        </a>
      </header>

      <Suspense fallback={<ListSkeleton />}>
        <SurveyList />
      </Suspense>
    </div>
  );
}

async function SurveyList() {
  const surveys = await getClimateSurveys();

  if (surveys.length === 0) {
    return (
      <div
        style={{
          padding: "56px 24px",
          textAlign: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          Nenhuma pesquisa criada ainda.
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)" }}>
          Crie a primeira pesquisa de clima para começar a coletar feedback da equipe.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {surveys.map(s => (
        <SurveyCard key={s.id} survey={s} />
      ))}
    </div>
  );
}

function SurveyCard({ survey }: { survey: ClimateSurvey }) {
  const tipoLabel: Record<ClimateSurvey["tipo"], string> = {
    pulso: "Pulso",
    nps: "NPS",
    tematica: "Temática",
  };

  const statusStyle: Record<ClimateSurvey["status"], { bg: string; color: string; label: string }> = {
    rascunho: { bg: "#F3F4F6", color: "#6B7280", label: "Rascunho" },
    ativa: { bg: "#D1FAE5", color: "#065F46", label: "Ativa" },
    encerrada: { bg: "#E5E7EB", color: "#374151", label: "Encerrada" },
  };

  const sStyle = statusStyle[survey.status];

  const dateLabel = survey.publicado_em
    ? `Publicada em ${formatDateBR(survey.publicado_em)}`
    : `Criada em ${formatDateBR(survey.created_at)}`;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "var(--text)",
              }}
            >
              {survey.titulo}
            </span>
            <span
              style={{
                display: "inline-block",
                padding: "2px 9px",
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                background: "#EEF2FF",
                color: "#4338CA",
              }}
            >
              {tipoLabel[survey.tipo]}
            </span>
            <span
              style={{
                display: "inline-block",
                padding: "2px 9px",
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                background: sStyle.bg,
                color: sStyle.color,
              }}
            >
              {sStyle.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
            {dateLabel}
            {typeof survey.question_count === "number" && (
              <span style={{ marginLeft: 12 }}>
                {survey.question_count} {survey.question_count === 1 ? "pergunta" : "perguntas"}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          {(survey.status === "ativa" || survey.status === "encerrada") && (
            <a
              href={`/pessoas/clima/${survey.id}/resultados`}
              style={{
                padding: "7px 14px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-2)",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Ver resultados
            </a>
          )}

          {survey.status === "rascunho" && (
            <form
              action={async () => {
                "use server";
                await publishSurveyAction(survey.id);
              }}
            >
              <button
                type="submit"
                style={{
                  padding: "7px 14px",
                  background: "#22C55E",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Publicar
              </button>
            </form>
          )}

          {survey.status === "ativa" && (
            <form
              action={async () => {
                "use server";
                await closeSurveyAction(survey.id);
              }}
            >
              <button
                type="submit"
                style={{
                  padding: "7px 14px",
                  background: "#6B7280",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Encerrar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 80,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

function formatDateBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}
