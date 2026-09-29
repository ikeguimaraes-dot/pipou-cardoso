"use client";

import Link from "next/link";
import { Receipt, ChevronRight } from "lucide-react";
import { formatBRL } from "@/lib/format";
import type { Payslip, PayslipStatus } from "@kph/db/types/pessoas";

const STATUS_LABEL: Record<PayslipStatus, string> = {
  rascunho: "Rascunho",
  aprovado: "Aprovado",
  pago: "Pago",
};

const STATUS_STYLE: Record<PayslipStatus, React.CSSProperties> = {
  rascunho: { background: "var(--muted)", color: "var(--muted-foreground)" },
  aprovado: { background: "rgba(59,130,246,0.12)", color: "#1D4ED8" },
  pago: { background: "rgba(34,197,94,0.12)", color: "#15803D" },
};

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function competenciaLabel(iso: string): string {
  const m = Number(iso.slice(5, 7));
  const y = iso.slice(0, 4);
  return `${MESES[(m - 1)] ?? ""} ${y}`;
}

function competenciaAno(iso: string): string {
  return iso.slice(0, 4);
}

/** Agrupa payslips por ano, retorna pares [ano, payslips[]] ordenados desc. */
function groupByYear(payslips: Payslip[]): [string, Payslip[]][] {
  const map = new Map<string, Payslip[]>();
  for (const p of payslips) {
    const ano = competenciaAno(p.competencia ?? "");
    if (!map.has(ano)) map.set(ano, []);
    map.get(ano)!.push(p);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export function MeusHolerites({
  nome,
  cargo,
  payslips,
}: {
  nome: string;
  cargo?: string | null;
  payslips: Payslip[];
}) {
  if (payslips.length === 0) {
    return <EmptyState nome={nome} />;
  }

  const totalRecebido = payslips
    .filter((p) => (p.status as PayslipStatus) === "pago")
    .reduce((s, p) => s + Number(p.liquido ?? 0), 0);

  const grouped = groupByYear(payslips);
  const maisRecente = payslips[0];
  const liquidoMaisRecente = Number(maisRecente?.liquido ?? 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <KpiCard
          label="Último líquido"
          value={formatBRL(liquidoMaisRecente)}
          sub={maisRecente ? competenciaLabel(maisRecente.competencia ?? "") : "—"}
          accent
        />
        <KpiCard
          label="Total recebido (pago)"
          value={formatBRL(totalRecebido)}
          sub={`${payslips.filter((p) => (p.status as PayslipStatus) === "pago").length} holerites pagos`}
        />
        <KpiCard
          label="Holerites disponíveis"
          value={payslips.length}
          sub={`${grouped.length} ano${grouped.length === 1 ? "" : "s"}`}
        />
      </div>

      {/* Lista agrupada por ano */}
      {grouped.map(([ano, items]) => (
        <section key={ano}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: "var(--text-3)",
              marginBottom: 8,
            }}
          >
            {ano}
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--surface)",
              overflow: "hidden",
            }}
          >
            {items.map((p, idx) => {
              const status = (p.status as PayslipStatus) ?? "rascunho";
              const bruto =
                Number(p.salario_base ?? 0) +
                Number(p.horas_extras ?? 0) +
                Number(p.adicional_noturno ?? 0) +
                Number(p.gorjeta ?? 0) +
                Number(p.dsr_gorjeta ?? 0);
              const liquido = Number(p.liquido ?? 0);

              return (
                <Link
                  key={p.id}
                  href={`/pessoas/holerites/${p.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 18px",
                    borderTop: idx === 0 ? "none" : "1px solid var(--border)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {/* Ícone */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "var(--brand-secondary-soft)",
                      color: "var(--brand-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Receipt size={16} />
                  </div>

                  {/* Mês / cargo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                      {competenciaLabel(p.competencia ?? "")}
                    </div>
                    {(p.cargo ?? cargo) && (
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                        {p.cargo ?? cargo}
                      </div>
                    )}
                  </div>

                  {/* Valores */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--brand-secondary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatBRL(liquido)}
                    </div>
                    {bruto > 0 && bruto !== liquido && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-3)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        bruto {formatBRL(bruto)}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      padding: "3px 8px",
                      borderRadius: 99,
                      flexShrink: 0,
                      ...STATUS_STYLE[status],
                    }}
                  >
                    {STATUS_LABEL[status]}
                  </span>

                  <ChevronRight size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: accent ? "var(--brand-secondary)" : "var(--text)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function EmptyState({ nome }: { nome: string }) {
  return (
    <div
      style={{
        padding: "56px 28px",
        textAlign: "center",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 99,
          background: "var(--brand-secondary-soft)",
          color: "var(--brand-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Receipt size={20} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
        Nenhum holerite disponível
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-3)",
          maxWidth: 340,
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        Olá, <strong style={{ color: "var(--text-2)" }}>{nome}</strong>. Seus holerites
        aparecerão aqui assim que o RH processar a folha do mês.
      </p>
    </div>
  );
}
