"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { listarEspelho, upsertLancamentoManual, type EspelhoRow } from "./actions";

type ColNature = "auto" | "manual" | "retorno" | "calculado";

type ColDef = {
  key: keyof EspelhoRow;
  label: string;
  nature: ColNature;
  codKph: string | null;
  w: number;
  sticky: boolean;
  stickyLeft: number;
  numeric: boolean;
};

// Coluna NOME (índice 2) é a última sticky — shadow após ela sinaliza o freeze
const COLS: ColDef[] = [
  { key: "regime",             label: "REGIME",        nature: "auto",      codKph: null,     w: 55,  sticky: true,  stickyLeft: 0,   numeric: false },
  { key: "cc",                 label: "CC",            nature: "auto",      codKph: null,     w: 80,  sticky: true,  stickyLeft: 55,  numeric: false },
  { key: "nome",               label: "NOME",          nature: "auto",      codKph: null,     w: 180, sticky: true,  stickyLeft: 135, numeric: false },
  { key: "cargo",              label: "CARGO",         nature: "auto",      codKph: null,     w: 120, sticky: false, stickyLeft: 0,   numeric: false },
  { key: "admissao",           label: "ADMISSÃO",      nature: "auto",      codKph: null,     w: 92,  sticky: false, stickyLeft: 0,   numeric: false },
  { key: "salario",            label: "SALÁRIO",       nature: "auto",      codKph: null,     w: 95,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "gorjeta_1q",         label: "GORJETA 1ªQ",   nature: "manual",    codKph: "PV-07A", w: 90,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "liquido",            label: "LÍQUIDO",       nature: "retorno",   codKph: "RT-01",  w: 90,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "gorjeta_2q",         label: "GORJETA 2ªQ",   nature: "manual",    codKph: "PV-07B", w: 90,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "gorjeta_compulsoria",label: "GORJ. COMP.",   nature: "calculado", codKph: null,     w: 85,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "adicional_noturno",  label: "ADIC. NOT.",    nature: "auto",      codKph: null,     w: 75,  sticky: false, stickyLeft: 0,   numeric: false },
  { key: "bonus",              label: "BÔNUS",         nature: "manual",    codKph: "PV-15",  w: 85,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "quitacao_bh",        label: "QUIT. BH",      nature: "auto",      codKph: null,     w: 82,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "feriado",            label: "FERIADO",       nature: "auto",      codKph: null,     w: 72,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "emprestimo",         label: "EMPRÉSTIMO",    nature: "manual",    codKph: "DS-10",  w: 92,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "falta",              label: "FALTA",         nature: "auto",      codKph: null,     w: 66,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "dsr",                label: "DSR",           nature: "manual",    codKph: "DS-13",  w: 70,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "plano_dependente",   label: "DESC. PL.DEP",  nature: "manual",    codKph: "DS-05",  w: 95,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "coopart_plano",      label: "COOPART.",      nature: "manual",    codKph: "DS-09",  w: 80,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "desconto_vt",        label: "DESC. VT",      nature: "manual",    codKph: "DS-06",  w: 80,  sticky: false, stickyLeft: 0,   numeric: true  },
  { key: "total_liquido",      label: "TOTAL LÍQ.",    nature: "retorno",   codKph: "RT-02",  w: 95,  sticky: false, stickyLeft: 0,   numeric: true  },
];

const NATURE_HEADER_COLOR: Record<ColNature, string> = {
  auto:      "var(--text-3)",
  manual:    "#92400E",
  retorno:   "#5B21B6",
  calculado: "var(--text-3)",
};

const NATURE_CELL_BG: Record<ColNature, string> = {
  auto:      "transparent",
  manual:    "rgba(252,214,22,0.06)",
  retorno:   "rgba(139,92,246,0.06)",
  calculado: "rgba(100,116,139,0.05)",
};

const NATURE_CELL_BORDER: Record<ColNature, string> = {
  auto:      "none",
  manual:    "1px solid rgba(252,214,22,0.25)",
  retorno:   "1px solid rgba(139,92,246,0.25)",
  calculado: "none",
};

function fmtNum(v: string | null | undefined): string {
  if (v == null || v === "" || v === "0" || v === "0.0000") return "";
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseNum(v: string | null | undefined): number {
  if (!v) return 0;
  return parseFloat(String(v).replace(",", ".")) || 0;
}

export function EspelhoFopag({
  periodoId,
  periodoFechado,
}: {
  periodoId: string;
  periodoFechado: boolean;
}) {
  const [rows, setRows] = useState<EspelhoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ eid: string; key: string; value: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ eid: string; key: string; ok: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listarEspelho(periodoId);
    setRows(data);
    setLoading(false);
  }, [periodoId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function startEdit(eid: string, key: string, currentVal: string | null) {
    if (periodoFechado || saving) return;
    const col = COLS.find((c) => c.key === key);
    if (!col || col.nature === "auto" || col.nature === "calculado") return;
    setEditing({ eid, key, value: currentVal ?? "" });
  }

  async function commitEdit() {
    if (!editing || saving) return;
    const col = COLS.find((c) => c.key === editing.key);
    if (!col?.codKph) { setEditing(null); return; }
    setSaving(true);
    const parsed = editing.value.trim() !== "" ? parseFloat(editing.value.replace(",", ".")) : null;
    const r = await upsertLancamentoManual(periodoId, editing.eid, col.codKph, parsed, null, null);
    if (r.ok) {
      setRows((prev) =>
        prev.map((row) => {
          if (row.employee_id !== editing.eid) return row;
          const next = { ...row, [editing.key]: editing.value !== "" ? editing.value : null };
          if (editing.key === "gorjeta_1q" || editing.key === "gorjeta_2q") {
            const q1 = editing.key === "gorjeta_1q" ? parseNum(editing.value) : parseNum(row.gorjeta_1q);
            const q2 = editing.key === "gorjeta_2q" ? parseNum(editing.value) : parseNum(row.gorjeta_2q);
            next.gorjeta_compulsoria = String(q1 + q2);
          }
          return next as EspelhoRow;
        }),
      );
      setFlash({ eid: editing.eid, key: editing.key, ok: true });
      setTimeout(() => setFlash(null), 1400);
      setEditing(null);
    } else {
      setFlash({ eid: editing.eid, key: editing.key, ok: false });
      setTimeout(() => setFlash(null), 3000);
    }
    setSaving(false);
  }

  // Totais das colunas numéricas (exceto adicional_noturno que é texto h:mm)
  const totals: Record<string, number> = {};
  for (const col of COLS) {
    if (!col.numeric || col.key === "adicional_noturno") continue;
    totals[col.key] = rows.reduce((sum, r) => sum + parseNum(r[col.key as keyof EspelhoRow] as string | null), 0);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            height: 42, background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, opacity: 0.6, animation: "pulse 1.5s ease-in-out infinite",
          }} />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div style={{
        padding: "56px 24px", textAlign: "center",
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          Nenhum colaborador neste período.
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)" }}>
          Use o botão "Coletar mês" para importar dados.
        </div>
      </div>
    );
  }

  const STICKY_BG = "var(--surface)";
  const STICKY_BG_ALT = "var(--surface-2)";

  return (
    <>
      {/* ── Legenda ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" as const, fontSize: 11 }}>
        {[
          { color: "transparent",       border: "1px solid var(--border)", label: "AUTO — preenchido automaticamente" },
          { color: "rgba(252,214,22,0.09)", border: "1px solid rgba(252,214,22,0.3)", label: "MANUAL — lançamento da equipe" },
          { color: "rgba(139,92,246,0.09)", border: "1px solid rgba(139,92,246,0.3)", label: "RETORNO — retorno do escritório" },
          { color: "rgba(100,116,139,0.08)", border: "1px solid var(--border)", label: "CALCULADO — soma automática" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 14, height: 14, borderRadius: 4,
              background: l.color, border: l.border,
            }} />
            <span style={{ color: "var(--text-3)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Aviso obrigatório ────────────────────────────────────────── */}
      <div style={{
        marginBottom: 16, padding: "10px 14px", borderRadius: 8,
        background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 12, color: "#92400E",
      }}>
        ⚠ Os valores exibidos são do lançamento de folha — não representam o custo total de pessoal (encargos patronais e FGTS não estão incluídos).
        Campos MANUAL e RETORNO são editáveis — clique na célula para alterar. Células em vermelho = colaborador sem matrícula Domínio.
      </div>

      {/* ── Grade espelho ────────────────────────────────────────────── */}
      <div style={{
        overflowX: "auto", overflowY: "auto", maxHeight: "62vh",
        border: "1px solid var(--border)", borderRadius: 12, position: "relative",
      }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "max-content", fontSize: 12 }}>
          <thead>
            <tr>
              {COLS.map((col, ci) => (
                <th
                  key={col.key}
                  style={{
                    position: "sticky",
                    top: 0,
                    left: col.sticky ? col.stickyLeft : undefined,
                    zIndex: col.sticky ? 20 : 10,
                    background: "var(--surface-2)",
                    borderBottom: "2px solid var(--border)",
                    borderRight: ci < COLS.length - 1 ? "1px solid var(--border)" : "none",
                    padding: "9px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase" as const,
                    color: NATURE_HEADER_COLOR[col.nature],
                    whiteSpace: "nowrap" as const,
                    textAlign: col.numeric ? "right" as const : "left" as const,
                    minWidth: col.w,
                    maxWidth: col.w,
                    boxShadow: ci === 2 ? "2px 0 6px rgba(0,0,0,0.08)" : undefined,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, ri) => {
              const semCC = !row.cod_folha;
              const rowBg = ri % 2 === 0 ? "var(--surface)" : "var(--surface-2)";
              return (
                <tr key={row.employee_id}>
                  {COLS.map((col, ci) => {
                    const rawVal = row[col.key as keyof EspelhoRow] as string | null;
                    const isEditing = editing?.eid === row.employee_id && editing.key === col.key;
                    const isFlash = flash?.eid === row.employee_id && flash.key === col.key;
                    const isEditable = !periodoFechado && (col.nature === "manual" || col.nature === "retorno");
                    const displayVal = col.numeric ? fmtNum(rawVal) : (rawVal ?? "");

                    let cellBg = col.sticky
                      ? (ri % 2 === 0 ? STICKY_BG : STICKY_BG_ALT)
                      : rowBg;
                    if (semCC && col.sticky) cellBg = "#FEF2F2";
                    if (isFlash) cellBg = flash?.ok ? "#D1FAE5" : "#FEE2E2";
                    if (!col.sticky && isEditable && !isEditing && !isFlash) {
                      cellBg = NATURE_CELL_BG[col.nature];
                    }

                    return (
                      <td
                        key={col.key}
                        onClick={() => !isEditing && isEditable ? startEdit(row.employee_id, col.key, rawVal) : undefined}
                        style={{
                          position: col.sticky ? "sticky" : undefined,
                          left: col.sticky ? col.stickyLeft : undefined,
                          zIndex: col.sticky ? 2 : undefined,
                          background: cellBg,
                          borderBottom: "1px solid var(--border)",
                          borderRight: ci < COLS.length - 1 ? "1px solid var(--border)" : "none",
                          padding: 0,
                          minWidth: col.w,
                          maxWidth: col.w,
                          boxShadow: ci === 2 ? "2px 0 6px rgba(0,0,0,0.05)" : undefined,
                          cursor: isEditable ? "text" : "default",
                        }}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="number"
                            step="0.01"
                            value={editing.value}
                            onChange={(e) =>
                              setEditing((prev) => prev ? { ...prev, value: e.target.value } : null)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
                              if (e.key === "Escape") { e.preventDefault(); setEditing(null); }
                            }}
                            onBlur={commitEdit}
                            disabled={saving}
                            style={{
                              width: "100%",
                              padding: "7px 8px",
                              border: "none",
                              outline: "2px solid var(--brand, #C4622D)",
                              background: "var(--surface-3, #fff)",
                              color: "var(--text)",
                              fontSize: 12,
                              textAlign: "right",
                              boxSizing: "border-box" as const,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              padding: "7px 8px",
                              minHeight: 34,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: col.numeric ? "flex-end" : "flex-start",
                              color: semCC && col.key === "nome"
                                ? "#991B1B"
                                : col.nature === "calculado"
                                ? "var(--text-3)"
                                : "var(--text)",
                              fontWeight: col.key === "nome" ? 600 : 400,
                              whiteSpace: "nowrap" as const,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              border: isEditable && !isEditing ? NATURE_CELL_BORDER[col.nature] : "none",
                              borderRadius: isEditable ? 4 : 0,
                              margin: isEditable ? "2px 4px" : 0,
                            }}
                          >
                            {displayVal !== "" ? displayVal : (
                              <span style={{ color: "var(--text-3)", opacity: 0.4 }}>—</span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          {/* ── Rodapé totais ─────────────────────────────────────────── */}
          <tfoot>
            <tr>
              {COLS.map((col, ci) => {
                const total = totals[col.key];
                const showTotal = col.numeric && total != null && total !== 0;
                return (
                  <td
                    key={col.key}
                    style={{
                      position: "sticky",
                      bottom: 0,
                      left: col.sticky ? col.stickyLeft : undefined,
                      zIndex: col.sticky ? 7 : 5,
                      background: "var(--surface-2)",
                      borderTop: "2px solid var(--border)",
                      borderRight: ci < COLS.length - 1 ? "1px solid var(--border)" : "none",
                      padding: "8px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text)",
                      textAlign: col.numeric ? "right" as const : "left" as const,
                      whiteSpace: "nowrap" as const,
                      boxShadow: ci === 2 ? "2px 0 6px rgba(0,0,0,0.05)" : undefined,
                    }}
                  >
                    {ci === 0 ? "TOTAL" : null}
                    {ci === 2 ? `${rows.length} colabs` : null}
                    {showTotal
                      ? total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : null}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
