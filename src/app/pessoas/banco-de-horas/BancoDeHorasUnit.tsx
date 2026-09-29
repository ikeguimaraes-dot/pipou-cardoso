"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import { Input } from "@kph/ui/input";
import { avatarColor, initials } from "@/lib/format";
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

export function BancoDeHorasUnit({
  unitName,
  entries,
}: {
  unitName: string;
  entries: HourBankEntry[];
}) {
  const [search, setSearch] = useState("");

  // Agrupa pelo nome mais recente de cada colaborador (primeiro entry = mais recente)
  const byEmployee = useMemo(() => {
    const map = new Map<string, HourBankEntry[]>();
    for (const e of entries) {
      const key = e.employee_id ?? e.nome ?? "?";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()].map(([, rows]) => ({
      nome: rows[0]?.nome ?? "—",
      maisRecente: rows[0]!,
      historico: rows,
    }));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byEmployee;
    return byEmployee.filter((e) => e.nome.toLowerCase().includes(q));
  }, [byEmployee, search]);

  const comSaldoPositivo = byEmployee.filter((e) => (e.maisRecente.saldo ?? 0) > 0).length;
  const comSaldoNegativo = byEmployee.filter((e) => (e.maisRecente.saldo ?? 0) < 0).length;

  if (entries.length === 0) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-3)", fontSize: 13 }}>
        Nenhum registro de banco de horas para {unitName}.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <KpiCard label="Colaboradores" value={byEmployee.length} />
        <KpiCard label="Saldo positivo" value={comSaldoPositivo} accent="#15803D" />
        <KpiCard label="Saldo negativo" value={comSaldoNegativo} accent="#B91C1C" />
      </div>

      <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
        {unitName} · competência mais recente: <strong style={{ color: "var(--text)" }}>{mesLabel(entries[0]?.competencia ?? null)}</strong>
      </p>

      {/* Busca */}
      <div style={{ position: "relative", maxWidth: 320 }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
        <Input
          placeholder="Buscar colaborador…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 30 }}
        />
      </div>

      {/* Tabela */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", gap: 8, padding: "10px 18px", borderBottom: "1px solid var(--border)" }}>
          {["Colaborador", "Extras", "Débito", "Saldo"].map((h) => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-3)", textAlign: h !== "Colaborador" ? "right" : "left" }}>
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
            Nenhum resultado para "{search}"
          </div>
        ) : (
          filtered.map((row, idx) => {
            const saldo = row.maisRecente.saldo ?? 0;
            const cor = saldo > 0 ? "#15803D" : saldo < 0 ? "#B91C1C" : "var(--text-3)";
            const color = avatarColor(row.nome);
            return (
              <div
                key={row.maisRecente.id}
                style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px", gap: 8, padding: "12px 18px", borderTop: idx === 0 ? "none" : "1px solid var(--border)", alignItems: "center" }}
              >
                {/* Nome */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 99, background: `color-mix(in srgb, ${color} 18%, transparent)`, color, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {initials(row.nome)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{row.nome}</span>
                </div>
                {/* Extras */}
                <span style={{ fontSize: 12, color: "#15803D", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                  +{fmtHoras(row.maisRecente.horas_extras)}
                </span>
                {/* Débito */}
                <span style={{ fontSize: 12, color: "#B91C1C", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                  -{fmtHoras(row.maisRecente.horas_debito)}
                </span>
                {/* Saldo */}
                <span style={{ fontSize: 13, fontWeight: 700, color: cor, fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                  {saldo >= 0 ? "+" : ""}{fmtHoras(saldo)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ?? "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
