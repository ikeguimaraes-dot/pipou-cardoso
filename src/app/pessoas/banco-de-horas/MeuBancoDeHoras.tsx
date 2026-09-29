"use client";

import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { HourBankEntry } from "@kph/db/types/pessoas";

function fmtHoras(h: number | null): string {
  if (h === null) return "—";
  const abs = Math.abs(h);
  const sign = h < 0 ? "-" : "";
  const hh = Math.floor(abs);
  const mm = Math.round((abs - hh) * 60);
  return `${sign}${hh}h${mm > 0 ? String(mm).padStart(2, "0") + "m" : ""}`;
}

function mesLabel(iso: string | null): string {
  if (!iso) return "—";
  const m = Number(iso.slice(5, 7));
  const y = iso.slice(0, 4);
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${meses[m - 1] ?? ""} ${y}`;
}

export function MeuBancoDeHoras({
  nome,
  entries,
}: {
  nome: string;
  entries: HourBankEntry[];
}) {
  if (entries.length === 0) {
    return <EmptyState nome={nome} />;
  }

  const maisRecente = entries[0];
  const saldoAtual = maisRecente?.saldo ?? 0;
  const totalExtras = entries.reduce((s, e) => s + (e.horas_extras ?? 0), 0);
  const totalDebito = entries.reduce((s, e) => s + (e.horas_debito ?? 0), 0);

  const saldoCor = saldoAtual > 0 ? "#15803D" : saldoAtual < 0 ? "#B91C1C" : "var(--text)";
  const saldoBg = saldoAtual > 0 ? "rgba(34,197,94,0.10)" : saldoAtual < 0 ? "rgba(239,68,68,0.10)" : "var(--surface-2)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Saldo destaque */}
      <div
        style={{
          background: saldoBg,
          border: `1px solid color-mix(in srgb, ${saldoCor} 25%, transparent)`,
          borderRadius: 12,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: saldoCor,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Clock size={20} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: saldoCor, marginBottom: 2 }}>
            Saldo atual · {mesLabel(maisRecente?.competencia ?? null)}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: saldoCor, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {fmtHoras(saldoAtual)}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <TrendingUp size={12} style={{ color: "#15803D" }} />
            Total horas extras
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#15803D", fontVariantNumeric: "tabular-nums" }}>
            +{fmtHoras(totalExtras)}
          </div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <TrendingDown size={12} style={{ color: "#B91C1C" }} />
            Total débito
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#B91C1C", fontVariantNumeric: "tabular-nums" }}>
            -{fmtHoras(totalDebito)}
          </div>
        </div>
      </div>

      {/* Histórico mensal */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
          Histórico mensal
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", overflow: "hidden" }}>
          {entries.map((e, idx) => {
            const saldo = e.saldo ?? 0;
            const cor = saldo > 0 ? "#15803D" : saldo < 0 ? "#B91C1C" : "var(--text-3)";
            const Icon = saldo > 0 ? TrendingUp : saldo < 0 ? TrendingDown : Minus;
            return (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 18px",
                  borderTop: idx === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                <Icon size={14} style={{ color: cor, flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                    {mesLabel(e.competencia)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 20, alignItems: "center", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: "#15803D" }}>+{fmtHoras(e.horas_extras)}</span>
                  <span style={{ color: "#B91C1C" }}>-{fmtHoras(e.horas_debito)}</span>
                  <span style={{ fontWeight: 700, color: cor, minWidth: 60, textAlign: "right" }}>
                    {saldo >= 0 ? "+" : ""}{fmtHoras(saldo)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ nome }: { nome: string }) {
  return (
    <div style={{ padding: "56px 28px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: 99, background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Clock size={20} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Sem registros de banco de horas</div>
      <p style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 340, lineHeight: 1.55, margin: 0 }}>
        Olá, <strong style={{ color: "var(--text-2)" }}>{nome}</strong>. Seu banco de horas será exibido aqui quando o RH processar os registros.
      </p>
    </div>
  );
}
