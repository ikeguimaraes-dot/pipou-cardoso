import { Suspense } from "react";
import { requireUser } from "@kph/auth/server";
import { PontoToggle } from "@/components/pessoas/PontoToggle";
import {
  getAdjustmentRequests,
  resolveAdjustmentAction,
  getOutOfRangePunches,
  approvePunchAction,
  type AdjustmentRequest,
  type OutOfRangePunch,
} from "./actions";

export const dynamic = "force-dynamic";

type Tab = "pendente" | "aprovado" | "rejeitado" | "fora_de_raio";

type SearchParams = Promise<{ tab?: string }>;

export default async function PunchAdjustmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const sp = await searchParams;
  const tab: Tab =
    sp.tab === "aprovado" ? "aprovado"
    : sp.tab === "rejeitado" ? "rejeitado"
    : sp.tab === "fora_de_raio" ? "fora_de_raio"
    : "pendente";

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "var(--text-3)",
          }}
        >
          Pessoas · Ponto
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            margin: "6px 0 16px",
            color: "var(--text)",
            letterSpacing: -0.4,
          }}
        >
          Ajustes de Ponto
        </h1>
        <PontoToggle active="aprovacoes_ponto" />
      </header>

      <TabBar tab={tab} />

      {tab === "fora_de_raio" ? (
        <Suspense fallback={<ListSkeleton />}>
          <OutOfRangeList />
        </Suspense>
      ) : (
        <Suspense fallback={<ListSkeleton />}>
          <RequestList tab={tab as "pendente" | "aprovado" | "rejeitado"} />
        </Suspense>
      )}
    </div>
  );
}

function TabBar({ tab }: { tab: Tab }) {
  const tabs: [Tab, string][] = [
    ["pendente", "Pendentes"],
    ["aprovado", "Aprovados"],
    ["rejeitado", "Rejeitados"],
    ["fora_de_raio", "Fora de Raio"],
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 20,
        borderBottom: "1px solid var(--border)",
        paddingBottom: 12,
      }}
    >
      {tabs.map(([key, label]) => {
        const active = tab === key;
        return (
          <a
            key={key}
            href={`?tab=${key}`}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              background: active ? "var(--brand)" : "var(--surface)",
              color: active ? "var(--primary-foreground)" : "var(--text-2)",
              border: "1px solid",
              borderColor: active ? "var(--brand)" : "var(--border)",
              transition: "all 150ms",
            }}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}

async function RequestList({ tab }: { tab: "pendente" | "aprovado" | "rejeitado" }) {
  const requests = await getAdjustmentRequests(tab);

  if (requests.length === 0) {
    const labels: Record<"pendente" | "aprovado" | "rejeitado", string> = {
      pendente: "pendente",
      aprovado: "aprovada",
      rejeitado: "rejeitada",
    };
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          fontSize: 13,
          color: "var(--text-2)",
        }}
      >
        Nenhuma solicitação {labels[tab]}.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {requests.map(r => (
        <RequestCard key={r.id} request={r} tab={tab} />
      ))}
    </div>
  );
}

function RequestCard({ request, tab }: { request: AdjustmentRequest; tab: "pendente" | "aprovado" | "rejeitado" }) {
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
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
            {request.employee_nome}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            {request.employee_funcao}
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatDateBR(request.data_referencia)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 24,
          fontSize: 13,
          flexWrap: "wrap",
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
        }}
      >
        <FieldBlock label="Saída almoço" value={request.horario_saida_almoco} />
        <FieldBlock label="Retorno" value={request.horario_retorno_almoco} />
        <FieldBlock label="Motivo" value={request.motivo} style={{ flex: 1, minWidth: 160 }} />
      </div>

      {tab === "pendente" && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <form action={resolveAdjustmentAction}>
            <input type="hidden" name="id" value={request.id} />
            <input type="hidden" name="status" value="aprovado" />
            <button
              type="submit"
              style={{
                padding: "8px 20px",
                background: "#22C55E",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Aprovar
            </button>
          </form>
          <form action={resolveAdjustmentAction}>
            <input type="hidden" name="id" value={request.id} />
            <input type="hidden" name="status" value="rejeitado" />
            <button
              type="submit"
              style={{
                padding: "8px 20px",
                background: "#EF4444",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Rejeitar
            </button>
          </form>
        </div>
      )}

      {tab !== "pendente" && (
        <div style={{ marginTop: 12 }}>
          <StatusBadge status={tab} />
        </div>
      )}
    </div>
  );
}

function FieldBlock({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
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
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: "aprovado" | "rejeitado" }) {
  const isApproved = status === "aprovado";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: isApproved ? "#D4F0E4" : "#FAD9D9",
        color: isApproved ? "#2D9E6B" : "#D94040",
      }}
    >
      {isApproved ? "Aprovado" : "Rejeitado"}
    </span>
  );
}

function ListSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 120,
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

async function OutOfRangeList() {
  const punches = await getOutOfRangePunches();
  if (punches.length === 0) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          fontSize: 13,
          color: "var(--text-2)",
        }}
      >
        Nenhum ponto fora de raio pendente de aprovacao.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {punches.map(p => (
        <OutOfRangeCard key={p.id} punch={p} />
      ))}
    </div>
  );
}

function OutOfRangeCard({ punch }: { punch: OutOfRangePunch }) {
  const tipoLabel = punch.tipo === "entrada" ? "Entrada" : "Saida";
  const hora = new Date(punch.timestamp_punch).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid #FCA5A5",
        borderRadius: 12,
        padding: "18px 20px",
        borderLeft: "4px solid #EF4444",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
            {punch.employee_nome}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            {punch.employee_funcao}
          </div>
        </div>
        <span
          style={{
            display: "inline-block",
            padding: "3px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: "#FEE2E2",
            color: "#EF4444",
          }}
        >
          Fora de raio
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 24,
          fontSize: 13,
          flexWrap: "wrap",
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
        }}
      >
        <FieldBlock label="Tipo" value={tipoLabel} />
        <FieldBlock label="Horario" value={hora} />
        {punch.distance_meters !== null && (
          <FieldBlock label="Distancia" value={`${punch.distance_meters}m da unidade`} />
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <form action={approvePunchAction}>
          <input type="hidden" name="id" value={punch.id} />
          <button
            type="submit"
            style={{
              padding: "8px 20px",
              background: "#22C55E",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Aprovar
          </button>
        </form>
      </div>
    </div>
  );
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
