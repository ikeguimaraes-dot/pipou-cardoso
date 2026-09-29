import { Suspense } from "react";

import { PontoToggle } from "@/components/pessoas/PontoToggle";
import { requireUser } from "@kph/auth/server";
import { getEspelhoPonto, type EspelhoRow, type EspelhoStatus } from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ data?: string }>;

export default async function EspelhoPontoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser();
  const sp = await searchParams;
  const dataIso = isValidIso(sp.data) ? sp.data! : todayIso();

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 22,
          flexWrap: "wrap",
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
            Pessoas · Ponto
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              margin: "6px 0 12px",
              color: "var(--text)",
              letterSpacing: -0.4,
            }}
          >
            Espelho de Ponto
          </h1>
          <PontoToggle active="espelho" />
        </div>
        <DateFilter currentIso={dataIso} />
      </header>

      <Suspense fallback={<TableSkeleton />}>
        <EspelhoSection dataIso={dataIso} />
      </Suspense>
    </div>
  );
}

async function EspelhoSection({ dataIso }: { dataIso: string }) {
  const { rows, unitLabel } = await getEspelhoPonto(dataIso);

  return (
    <>
      <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 14px" }}>
        Folha de{" "}
        <span style={{ color: "var(--text)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {formatDateBR(dataIso)}
        </span>
        {unitLabel ? ` — ${unitLabel}` : ""}
      </p>
      <KpiBar rows={rows} />
      <EspelhoTable rows={rows} />
    </>
  );
}

function KpiBar({ rows }: { rows: EspelhoRow[] }) {
  const trabalhando = rows.filter((r) => r.status === "trabalhando").length;
  const em_pausa = rows.filter((r) => r.status === "em_pausa").length;
  const encerrado = rows.filter((r) => r.status === "encerrado").length;
  const ausente = rows.filter((r) => r.status === "ausente").length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        marginBottom: 18,
      }}
    >
      <KpiCard label="Trabalhando" value={trabalhando} color="#22C55E" />
      <KpiCard label="Em pausa" value={em_pausa} color="#F59E0B" />
      <KpiCard label="Encerrados" value={encerrado} color="#6B7280" />
      <KpiCard label="Ausentes" value={ausente} color="#EF4444" />
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "var(--text-3)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

const STATUS_CONFIG: Record<EspelhoStatus, { label: string; bg: string; color: string }> = {
  trabalhando: { label: "Trabalhando", bg: "rgba(34,197,94,0.14)", color: "#16A34A" },
  em_pausa: { label: "Em pausa", bg: "rgba(245,158,11,0.14)", color: "#D97706" },
  encerrado: { label: "Encerrado", bg: "rgba(107,114,128,0.14)", color: "#6B7280" },
  ausente: { label: "Sem registro", bg: "rgba(239,68,68,0.12)", color: "#DC2626" },
};

function EspelhoTable({ rows }: { rows: EspelhoRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: "56px 24px",
          textAlign: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          fontSize: 13,
          color: "var(--text-3)",
        }}
      >
        Nenhum colaborador ativo encontrado para esta unidade.
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: "auto",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 720,
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Colaborador", "Entrada", "Almoço", "Retorno", "Saída", "Total", "Status"].map(
              (col) => (
                <th
                  key={col}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    color: "var(--text-3)",
                    whiteSpace: "nowrap",
                    background: "var(--surface)",
                  }}
                >
                  {col}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const statusCfg = STATUS_CONFIG[row.status];
            const isLast = i === rows.length - 1;
            return (
              <tr
                key={row.employee_id}
                style={{
                  borderBottom: isLast ? "none" : "1px solid var(--border)",
                }}
              >
                {/* Colaborador */}
                <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                      lineHeight: 1.2,
                    }}
                  >
                    {row.nome_completo}
                    {row.gps_warning && (
                      <span
                        title="GPS não capturado — validação do gestor pendente"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 6,
                          width: 16,
                          height: 16,
                          borderRadius: 99,
                          background: "rgba(245,158,11,0.18)",
                          color: "#D97706",
                          fontSize: 10,
                          fontWeight: 700,
                          verticalAlign: "middle",
                        }}
                      >
                        !
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    {row.funcao}
                  </div>
                </td>

                {/* Entrada */}
                <td style={{ padding: "12px 16px" }}>
                  <TimeCell value={row.entrada} />
                </td>

                {/* Almoço */}
                <td style={{ padding: "12px 16px" }}>
                  <TimeCell value={row.almoco} />
                </td>

                {/* Retorno */}
                <td style={{ padding: "12px 16px" }}>
                  <TimeCell value={row.retorno} />
                </td>

                {/* Saída */}
                <td style={{ padding: "12px 16px" }}>
                  <TimeCell value={row.saida} />
                </td>

                {/* Total */}
                <td
                  style={{
                    padding: "12px 16px",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 700,
                    color: row.total_minutes > 0 ? "var(--text)" : "var(--text-3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.total_minutes > 0 ? formatMinutes(row.total_minutes) : "—"}
                </td>

                {/* Status */}
                <td style={{ padding: "12px 16px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                      background: statusCfg.bg,
                      color: statusCfg.color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {statusCfg.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TimeCell({ value }: { value: string | null }) {
  if (!value) {
    return (
      <span style={{ color: "var(--text-3)", fontSize: 13 }}>—</span>
    );
  }
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color: "var(--text)",
        letterSpacing: -0.3,
      }}
    >
      {formatTimeSP(value)}
    </span>
  );
}

function formatTimeSP(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function DateFilter({ currentIso }: { currentIso: string }) {
  return (
    <form
      method="get"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "8px 12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "var(--text-3)",
        }}
      >
        Data
      </span>
      <input
        type="date"
        name="data"
        defaultValue={currentIso}
        style={{
          flex: 1,
          height: 28,
          padding: "0 8px",
          background: "var(--background)",
          color: "var(--text)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          fontSize: 12,
        }}
      />
      <button
        type="submit"
        style={{
          height: 28,
          padding: "0 12px",
          background: "var(--brand)",
          color: "var(--primary-foreground)",
          border: "none",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Aplicar
      </button>
    </form>
  );
}

function TableSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 8,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 72,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 56,
              background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
              borderBottom: i < 5 ? "1px solid var(--border)" : "none",
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function todayIso(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

function isValidIso(v: string | undefined): boolean {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function formatDateBR(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
