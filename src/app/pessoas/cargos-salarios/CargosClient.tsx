"use client";

import { useState, useCallback } from "react";
import { Check, AlertCircle, Loader2, Info } from "lucide-react";
import type { SalarioRow, CargoHierarquiaRow } from "./actions";
import { upsertSalario } from "./actions";

// ── helpers ────────────────────────────────────────────────────────────────

function parseBRL(v: string): number | null {
  if (!v.trim()) return null;
  const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

function fmtBRL(v: number | null): string {
  if (v === null || v === undefined) return "";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const NIVEL_ROMANO: Record<number, string> = { 1: "I", 2: "II", 3: "III" };

// ── types ──────────────────────────────────────────────────────────────────

type RowState = {
  min: string;
  ref: string;
  max: string;
  saving: boolean;
  error: string | null;
  saved: boolean;
};

type RowStateMap = Record<string, RowState>;

function initState(rows: SalarioRow[]): RowStateMap {
  return Object.fromEntries(
    rows.map((r) => [
      r.id,
      {
        min: fmtBRL(r.salario_min),
        ref: fmtBRL(r.salario_ref),
        max: fmtBRL(r.salario_max),
        saving: false,
        error: null,
        saved: false,
      },
    ])
  );
}

// ── grouping ───────────────────────────────────────────────────────────────

type CargoGroup = { cargoNome: string; rows: SalarioRow[] };
type SetorGroup = { setor: string; cargos: CargoGroup[] };

const ESTOQUE_ORDER = ['Líder de Estoque', 'Estoquista', 'Auxiliar de Estoque'];

const COZINHA_ORDER = [
  'Chef de Cozinha',
  'Subchef de Confeitaria',
  'Subchef de Cozinha',
  'Líder de Cozinha',
  'Líder de Parrilla',
  'Cozinheiro',
  'Confeiteiro',
  'Parrilheiro',
  'Auxiliar de Confeitaria',
  'Auxiliar de Cozinha (Garde)',
  'Auxiliar de Cozinha (Pia)',
];

function calcDepth(
  cargoId: string,
  cargoSetor: string,
  hierMap: Map<string, { reporta_a: string | null; setor: string }>,
): number {
  let depth = 0;
  let current = cargoId;
  const visited = new Set<string>();
  while (depth < 10) {
    if (visited.has(current)) break;
    visited.add(current);
    const node = hierMap.get(current);
    if (!node) break;
    const parentId = node.reporta_a;
    if (!parentId) break;
    const parentNode = hierMap.get(parentId);
    if (!parentNode || parentNode.setor !== cargoSetor) break;
    current = parentId;
    depth++;
  }
  return depth;
}

function groupRows(rows: SalarioRow[], hierarquia: CargoHierarquiaRow[]): SetorGroup[] {
  const hierMap = new Map<string, { reporta_a: string | null; setor: string }>();
  for (const h of hierarquia) {
    hierMap.set(h.id, { reporta_a: h.reporta_a_cargo_id, setor: h.setor });
  }

  const setorMap: Map<string, Map<string, SalarioRow[]>> = new Map();
  for (const row of rows) {
    if (!setorMap.has(row.setor)) setorMap.set(row.setor, new Map());
    const cargoMap = setorMap.get(row.setor)!;
    if (!cargoMap.has(row.cargo_nome)) cargoMap.set(row.cargo_nome, []);
    cargoMap.get(row.cargo_nome)!.push(row);
  }

  return Array.from(setorMap.entries()).map(([setor, cargoMap]) => {
    const raw = Array.from(cargoMap.entries()).map(([cargoNome, rs]) => ({
      cargoNome,
      cargoId: rs[0]?.cargo_id ?? "",
      rows: rs.sort((a, b) => (a.nivel ?? 0) - (b.nivel ?? 0)),
    }));

    const manualSort = (order: string[]) => raw.sort((a, b) => {
      const ia = order.indexOf(a.cargoNome);
      const ib = order.indexOf(b.cargoNome);
      const ra = ia === -1 ? 999 : ia;
      const rb = ib === -1 ? 999 : ib;
      return ra - rb || a.cargoNome.localeCompare(b.cargoNome, 'pt-BR');
    });

    const sorted =
      setor === 'Estoque' ? manualSort(ESTOQUE_ORDER) :
      setor === 'Cozinha' ? manualSort(COZINHA_ORDER) :
      raw.sort((a, b) => {
        const da = calcDepth(a.cargoId, setor, hierMap);
        const db = calcDepth(b.cargoId, setor, hierMap);
        return da - db || a.cargoNome.localeCompare(b.cargoNome, 'pt-BR');
      });

    return {
      setor,
      cargos: sorted.map(({ cargoNome, rows }) => ({ cargoNome, rows })),
    };
  });
}

// ── styles ─────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "5px 8px",
  fontSize: 13,
  color: "var(--text)",
  fontFamily: "var(--font-body, inherit)",
  outline: "none",
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: "#DC2626",
};

const colHeaderStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  color: "var(--text-3)",
  paddingBottom: 4,
};

// ── MoneyInput ─────────────────────────────────────────────────────────────

function MoneyInput({
  value,
  onChange,
  onBlur,
  hasError,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  hasError?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder ?? "0,00"}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      style={hasError ? inputErrorStyle : inputStyle}
      inputMode="decimal"
    />
  );
}

// ── SalaryRow ──────────────────────────────────────────────────────────────

function SalaryRowLine({
  row,
  state,
  onFieldChange,
  onBlur,
}: {
  row: SalarioRow;
  state: RowState;
  onFieldChange: (id: string, field: "min" | "ref" | "max", v: string) => void;
  onBlur: (id: string) => void;
}) {
  const hasError = !!state.error;
  const nivelLabel = row.nivel !== null ? NIVEL_ROMANO[row.nivel] : null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: nivelLabel ? "28px 1fr 1fr 1fr 28px" : "1fr 1fr 1fr 28px",
        gap: 8,
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {nivelLabel && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-3)",
            textAlign: "center",
          }}
        >
          {nivelLabel}
        </span>
      )}
      <MoneyInput
        value={state.min}
        onChange={(v) => onFieldChange(row.id, "min", v)}
        onBlur={() => onBlur(row.id)}
        hasError={hasError}
        placeholder="Mín"
      />
      <MoneyInput
        value={state.ref}
        onChange={(v) => onFieldChange(row.id, "ref", v)}
        onBlur={() => onBlur(row.id)}
        hasError={hasError}
        placeholder="Ref"
      />
      <MoneyInput
        value={state.max}
        onChange={(v) => onFieldChange(row.id, "max", v)}
        onBlur={() => onBlur(row.id)}
        hasError={hasError}
        placeholder="Máx"
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 24 }}>
        {state.saving && <Loader2 size={14} style={{ color: "var(--text-3)", animation: "spin 1s linear infinite" }} />}
        {!state.saving && state.saved && <Check size={14} style={{ color: "#16A34A" }} />}
        {!state.saving && state.error && (
          <span title={state.error}>
            <AlertCircle size={14} style={{ color: "#DC2626" }} />
          </span>
        )}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function CargosClient({
  initialRows,
  cargoHierarquia,
}: {
  initialRows: SalarioRow[];
  cargoHierarquia: CargoHierarquiaRow[];
}) {
  const [rowState, setRowState] = useState<RowStateMap>(() => initState(initialRows));

  const groups = groupRows(initialRows, cargoHierarquia);

  const handleFieldChange = useCallback(
    (id: string, field: "min" | "ref" | "max", v: string) => {
      setRowState((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: v, saved: false, error: null } as RowState,
      }));
    },
    []
  );

  const handleBlur = useCallback(
    async (id: string) => {
      const s = rowState[id];
      if (!s) return;

      const min = parseBRL(s.min);
      const ref = parseBRL(s.ref);
      const max = parseBRL(s.max);

      // client-side validation
      if (min !== null && ref !== null && min > ref) {
        setRowState((prev) => ({ ...prev, [id]: { ...prev[id], error: "Mín não pode ser maior que Ref" } as RowState }));
        return;
      }
      if (ref !== null && max !== null && ref > max) {
        setRowState((prev) => ({ ...prev, [id]: { ...prev[id], error: "Ref não pode ser maior que Máx" } as RowState }));
        return;
      }

      setRowState((prev) => ({ ...prev, [id]: { ...prev[id], saving: true, error: null } as RowState }));
      const res = await upsertSalario({ id, salario_min: min, salario_ref: ref, salario_max: max });
      setRowState((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          saving: false,
          saved: res.ok,
          error: res.ok ? null : (res.error ?? "Erro ao salvar"),
        } as RowState,
      }));
    },
    [rowState]
  );

  if (initialRows.length === 0) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        <PageHeader />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: "80px 24px",
            color: "var(--text-3)",
          }}
        >
          <Info size={32} />
          <p style={{ margin: 0, fontSize: 14 }}>Nenhuma grade salarial encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
      <PageHeader />

      <div>
        <div
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px 24px 12px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text)",
                  fontFamily: "var(--font-display, serif)",
                }}
              >
                Grade Salarial
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-3)" }}>
                Clique em qualquer campo e edite — salva automaticamente ao sair do campo.
              </p>
            </div>

            <div style={{ padding: "0 24px 24px" }}>
              {groups.map((g, gi) => (
                <div key={g.setor} style={{ marginTop: gi > 0 ? 28 : 0 }}>
                  {/* Setor header — padrão editorial Brasa */}
                  <div style={{ marginBottom: 16 }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--brasa)",
                        borderBottom: "1.5px solid var(--brasa)",
                        paddingBottom: 2,
                        fontFamily: "var(--font-display, serif)",
                      }}
                    >
                      {g.setor}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {g.cargos.map((cargo) => (
                      <div key={cargo.cargoNome}>
                        {/* Cargo header */}
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text)",
                            marginBottom: 6,
                          }}
                        >
                          {cargo.cargoNome}
                        </div>

                        {/* Column headers */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: cargo.rows[0]?.nivel !== null
                              ? "28px 1fr 1fr 1fr 28px"
                              : "1fr 1fr 1fr 28px",
                            gap: 8,
                            paddingBottom: 2,
                          }}
                        >
                          {cargo.rows[0]?.nivel !== null && <div />}
                          <div style={colHeaderStyle}>Mínimo</div>
                          <div style={colHeaderStyle}>Referência</div>
                          <div style={colHeaderStyle}>Máximo</div>
                          <div />
                        </div>

                        {/* Salary rows */}
                        {cargo.rows.map((row) => {
                          const s = rowState[row.id];
                          if (!s) return null;
                          return (
                            <SalaryRowLine
                              key={row.id}
                              row={row}
                              state={s}
                              onFieldChange={handleFieldChange}
                              onBlur={handleBlur}
                            />
                          );
                        })}

                        {/* Inline error message */}
                        {cargo.rows.some((r) => rowState[r.id]?.error) && (
                          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#DC2626" }}>
                            {cargo.rows.find((r) => rowState[r.id]?.error)
                              ? rowState[cargo.rows.find((r) => rowState[r.id]?.error)!.id]?.error
                              : null}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PageHeader() {
  return (
    <header style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--brasa)",
          marginBottom: 4,
        }}
      >
        R&S · Estrutura
      </div>
      <h1
        style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 500,
          color: "var(--text)",
          fontFamily: "var(--font-display, serif)",
        }}
      >
        Cargos & Salários
      </h1>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-2)" }}>
        Grade salarial macro por cargo e nível. Edite os valores e salve por linha.
      </p>
    </header>
  );
}
