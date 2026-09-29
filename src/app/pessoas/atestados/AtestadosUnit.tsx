"use client";

import { useMemo, useState } from "react";
import { FileText, Search, CheckCircle2, ExternalLink } from "lucide-react";
import { Input } from "@kph/ui/input";
import { avatarColor, initials, formatDateBR } from "@/lib/format";
import type { SickLeave } from "@kph/db/types/pessoas";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function AtestadosUnit({
  unitName,
  atestados,
}: {
  unitName: string;
  atestados: SickLeave[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return atestados;
    return atestados.filter((a) =>
      (a.nome ?? "").toLowerCase().includes(q) ||
      (a.medico ?? "").toLowerCase().includes(q) ||
      (a.cid ?? "").toLowerCase().includes(q)
    );
  }, [atestados, search]);

  if (atestados.length === 0) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-3)", fontSize: 13 }}>
        Nenhum atestado registrado para {unitName}.
      </div>
    );
  }

  const totalDias = atestados.reduce((s, a) => s + (a.total_dias ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <KpiCard label="Atestados" value={atestados.length} />
        <KpiCard label="Total dias" value={totalDias} />
      </div>

      <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>{unitName}</p>

      <div style={{ position: "relative", maxWidth: 320 }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
        <Input
          placeholder="Buscar por nome, médico ou CID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 30 }}
        />
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 70px 80px", gap: 8, padding: "10px 18px", borderBottom: "1px solid var(--border)" }}>
          {["Colaborador", "Período", "Dias", "Doc"].map((h) => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-3)" }}>
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
            Nenhum resultado.
          </div>
        ) : (
          filtered.map((a, idx) => {
            const nome = a.nome ?? "—";
            const color = avatarColor(nome);
            return (
              <div
                key={a.id}
                style={{ display: "grid", gridTemplateColumns: "1fr 100px 70px 80px", gap: 8, padding: "12px 18px", borderTop: idx === 0 ? "none" : "1px solid var(--border)", alignItems: "center" }}
              >
                {/* Nome */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 99, background: `color-mix(in srgb, ${color} 18%, transparent)`, color, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {initials(nome)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nome}</div>
                    {(a.medico || a.cid) && (
                      <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                        {[a.medico ? `Dr. ${a.medico}` : null, a.cid ? `CID ${a.cid}` : null].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>
                </div>
                {/* Período */}
                <span style={{ fontSize: 12, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
                  {formatDate(a.data_inicio)}
                </span>
                {/* Dias */}
                <span style={{ fontSize: 12, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                  {a.total_dias ?? 1}d
                </span>
                {/* Doc */}
                <span>
                  {a.documento_ref ? (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: "rgba(34,197,94,0.12)", color: "#15803D", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={10} />
                      Anexo
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>—</span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</div>
    </div>
  );
}
