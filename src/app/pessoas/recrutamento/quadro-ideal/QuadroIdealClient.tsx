"use client";

import { useState, useTransition, useMemo } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  getQuadroCompleto,
  adicionarCargoAoQuadro,
  salvarQuadroIdeal,
  removerCargoDoQuadro,
  type QuadroRow,
  type CargoCanon,
  type OrgNodeRaw,
} from "../actions";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type TurnoKey = "alvo_manha" | "alvo_tarde" | "alvo_noite" | "alvo_madrugada" | "alvo_intermediario";
type EditKey  = "alvoManha"  | "alvoTarde"  | "alvoNoite"  | "alvoMadrugada"  | "alvoIntermediario";
type ViewMode = "grade" | "resumo" | "organograma";

type LocalEdit = {
  alvoManha:         number;
  alvoTarde:         number;
  alvoNoite:         number;
  alvoMadrugada:     number;
  alvoIntermediario: number;
};

type Props = {
  units:         { id: string; name: string }[];
  initialUnitId: string | null;
  initialRows:   QuadroRow[];
  cargos:        CargoCanon[];
  orgNodes:      OrgNodeRaw[];
};

// ── Constantes de design ──────────────────────────────────────────────────────

const TURNOS: { key: TurnoKey; editKey: EditKey; label: string; tip: string }[] = [
  { key: "alvo_manha",         editKey: "alvoManha",         label: "M",   tip: "Manhã"         },
  { key: "alvo_tarde",         editKey: "alvoTarde",         label: "T",   tip: "Tarde"         },
  { key: "alvo_noite",         editKey: "alvoNoite",         label: "N",   tip: "Noite"         },
  { key: "alvo_madrugada",     editKey: "alvoMadrugada",     label: "Md",  tip: "Madrugada"     },
  { key: "alvo_intermediario", editKey: "alvoIntermediario", label: "Int", tip: "Intermediário" },
];

const GRUPO_COR: Record<string, string> = {
  Operacional:           "#B8975A",
  Tático:                "#C4622D",
  Estratégico:           "#8A4FFF",
  "Executivo-Liderança": "#DC2626",
};

const SETOR_COR: Record<string, string> = {
  Bar:      "#C4622D",
  Cozinha:  "#B8975A",
  Salão:    "#7B9E87",
  Limpeza:  "#8B7355",
  Estoque:  "#6B8CAE",
  Gerência: "#9B6B8A",
};

function gapCor(gap: number)   { if (gap > 0) return "#DC2626"; if (gap < 0) return "#F59E0B"; return "#16A34A"; }
function gapLabel(gap: number) { if (gap > 0) return `−${gap}`; if (gap < 0) return `+${Math.abs(gap)}`; return "✓"; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEdited(row: QuadroRow, edits: Record<string, LocalEdit>, key: TurnoKey, editKey: EditKey): number {
  const e = edits[row.id];
  return e ? e[editKey] : row[key];
}

function computeAlvo(row: QuadroRow, edits: Record<string, LocalEdit>): number {
  const e = edits[row.id];
  if (!e) return row.qtd_alvo;
  return e.alvoManha + e.alvoTarde + e.alvoNoite + e.alvoMadrugada + e.alvoIntermediario;
}

// ── Estilos inline ────────────────────────────────────────────────────────────

const inpNumStyle: React.CSSProperties = {
  width: 44, textAlign: "center", padding: "4px 0", fontSize: 13,
  border: "1px solid var(--border)", borderRadius: 6,
  background: "var(--surface-2)", color: "var(--text)",
};

const lblStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-3)",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5,
};

const inpStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  border: "1px solid var(--border)", borderRadius: 8,
  background: "var(--surface-2)", color: "var(--text)",
};

// ── Sub-componente: Grade ─────────────────────────────────────────────────────

function GradeView({
  rows, edits, onTurnoChange, onRemove, isPending,
}: {
  rows:          QuadroRow[];
  edits:         Record<string, LocalEdit>;
  onTurnoChange: (rowId: string, editKey: EditKey, raw: string) => void;
  onRemove:      (id: string) => void;
  isPending:     boolean;
}) {
  const setores = Array.from(new Set(rows.map(r => r.setor))).sort();

  return (
    <div>
      {setores.map(setor => {
        const setoRows = rows.filter(r => r.setor === setor);
        return (
          <div key={setor} style={{ marginBottom: 28 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--brasa)", borderBottom: "1.5px solid var(--brasa)", paddingBottom: 3 }}>
                {setor}
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left",   padding: "6px 10px 6px 0", color: "var(--text-3)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, minWidth: 130 }}>Cargo</th>
                    <th style={{ textAlign: "left",   padding: "6px 8px",  color: "var(--text-3)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, minWidth: 80  }}>Grupo</th>
                    {TURNOS.map(t => (
                      <th key={t.key} title={t.tip} style={{ textAlign: "center", padding: "6px 4px", color: "var(--text-3)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, minWidth: 50, cursor: "help" }}>{t.label}</th>
                    ))}
                    <th style={{ textAlign: "center", padding: "6px 8px", color: "var(--text-3)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, minWidth: 48 }}>Alvo</th>
                    <th style={{ textAlign: "center", padding: "6px 8px", color: "var(--text-3)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, minWidth: 48 }}>Ativos</th>
                    <th style={{ textAlign: "center", padding: "6px 8px", color: "var(--text-3)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, minWidth: 44 }}>Gap</th>
                    <th style={{ width: 28 }} />
                  </tr>
                </thead>
                <tbody>
                  {setoRows.map((row, idx) => {
                    const isDirty   = !!edits[row.id];
                    const alvoTotal = computeAlvo(row, edits);
                    const gap       = alvoTotal - row.headcount_atual;
                    return (
                      <tr key={row.id} style={{ borderBottom: idx < setoRows.length - 1 ? "1px solid var(--border)" : "none", background: isDirty ? "rgba(252,214,22,0.04)" : "transparent" }}>
                        <td style={{ padding: "8px 10px 8px 0", color: "var(--text)", fontWeight: 500 }}>
                          {row.cargo_nome}
                          {isDirty && <span style={{ marginLeft: 5, fontSize: 10, color: "#F59E0B" }}>●</span>}
                        </td>
                        <td style={{ padding: "8px 8px" }}>
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3, padding: "2px 7px", borderRadius: 20, background: `${GRUPO_COR[row.grupo] ?? "#888"}22`, color: GRUPO_COR[row.grupo] ?? "#888" }}>
                            {row.grupo}
                          </span>
                        </td>
                        {TURNOS.map(t => (
                          <td key={t.key} style={{ padding: "8px 4px", textAlign: "center" }}>
                            <input type="number" min={0} value={getEdited(row, edits, t.key, t.editKey)} onChange={e => onTurnoChange(row.id, t.editKey, e.target.value)} style={inpNumStyle} title={t.tip} />
                          </td>
                        ))}
                        <td style={{ padding: "8px 8px", textAlign: "center", fontWeight: 700, color: "var(--text)" }}>{alvoTotal}</td>
                        <td style={{ padding: "8px 8px", textAlign: "center", color: "var(--text-2)" }}>{row.headcount_atual}</td>
                        <td style={{ padding: "8px 8px", textAlign: "center" }}>
                          <span style={{ fontWeight: 700, color: gapCor(gap), fontSize: 13 }}>{gapLabel(gap)}</span>
                        </td>
                        <td style={{ padding: "8px 0 8px 4px", textAlign: "right" }}>
                          <button type="button" title="Remover" onClick={() => onRemove(row.id)} disabled={isPending}
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, padding: 0, border: "none", background: "none", cursor: isPending ? "wait" : "pointer", color: "var(--text-3)", borderRadius: 6 }}>
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      {rows.length > 0 && (
        <div style={{ marginTop: 4, display: "flex", gap: 14, flexWrap: "wrap" }}>
          {TURNOS.map(t => (
            <span key={t.key} style={{ fontSize: 11, color: "var(--text-3)" }}>
              <strong style={{ color: "var(--text-2)" }}>{t.label}</strong> = {t.tip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-componente: Resumo (pizza) ────────────────────────────────────────────

function ResumoView({ rows, edits }: { rows: QuadroRow[]; edits: Record<string, LocalEdit> }) {
  const setores = Array.from(new Set(rows.map(r => r.setor))).sort();

  const dados = setores
    .map(setor => ({
      name:  setor,
      value: rows.filter(r => r.setor === setor).reduce((s, r) => s + computeAlvo(r, edits), 0),
    }))
    .filter(d => d.value > 0);

  const total = dados.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-3)", fontSize: 13 }}>
        Nenhum alvo definido. Edite os turnos na Grade e salve.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
      <PieChart width={320} height={280}>
        <Pie data={dados} cx="50%" cy="50%" innerRadius={70} outerRadius={115} dataKey="value" nameKey="name" paddingAngle={2} strokeWidth={0}>
          {dados.map((entry, i) => <Cell key={i} fill={SETOR_COR[entry.name] ?? "#888"} />)}
        </Pie>
        <Tooltip
          formatter={(v) => { const n = typeof v === "number" ? v : 0; return [`${n} vaga${n !== 1 ? "s" : ""}`, ""] as [string, string]; }}
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
        />
      </PieChart>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
          Alvo por setor
        </div>
        {dados.map(d => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: SETOR_COR[d.name] ?? "#888", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--text)", minWidth: 80 }}>{d.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{d.value}</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>({Math.round(d.value / total * 100)}%)</span>
          </div>
        ))}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>Total: </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{total}</span>
        </div>
      </div>
    </div>
  );
}

// ── Organograma — algoritmo de layout ────────────────────────────────────────

const ORG_W  = 160;
const ORG_H  = 56;
const H_GAP  = 20;
const V_GAP  = 52;

interface TreeNode {
  cargoId:    string;
  nome:       string;
  grupo:      string;
  children:   TreeNode[];
  subtreeW:   number;
  x:          number;
  y:          number;
}

interface OrgEdge { x1: number; y1: number; x2: number; y2: number; }

function measureTree(node: TreeNode): number {
  if (node.children.length === 0) {
    node.subtreeW = ORG_W;
  } else {
    const sum  = node.children.reduce((s, c) => s + measureTree(c), 0);
    const gaps = Math.max(0, node.children.length - 1) * H_GAP;
    node.subtreeW = Math.max(ORG_W, sum + gaps);
  }
  return node.subtreeW;
}

function placeTree(node: TreeNode, centerX: number, y: number): void {
  node.x = centerX - ORG_W / 2;
  node.y = y;
  if (node.children.length === 0) return;
  const totalW = node.children.reduce((s, c) => s + c.subtreeW, 0)
    + Math.max(0, node.children.length - 1) * H_GAP;
  let cursor = centerX - totalW / 2;
  for (const child of node.children) {
    placeTree(child, cursor + child.subtreeW / 2, y + ORG_H + V_GAP);
    cursor += child.subtreeW + H_GAP;
  }
}

function flattenTree(node: TreeNode, acc: TreeNode[] = []): TreeNode[] {
  acc.push(node);
  node.children.forEach(c => flattenTree(c, acc));
  return acc;
}

function collectEdges(node: TreeNode, edges: OrgEdge[]): void {
  for (const child of node.children) {
    edges.push({
      x1: node.x + ORG_W / 2, y1: node.y + ORG_H,
      x2: child.x + ORG_W / 2, y2: child.y,
    });
    collectEdges(child, edges);
  }
}

// ── Sub-componente: Organograma ───────────────────────────────────────────────

function OrganogramaView({ rows, orgNodes }: { rows: QuadroRow[]; orgNodes: OrgNodeRaw[] }) {
  const layout = useMemo(() => {
    if (rows.length === 0) return null;
    if (orgNodes.length === 0) return null;

    const orgById: Record<string, OrgNodeRaw> = {};
    orgNodes.forEach(n => { orgById[n.id] = n; });

    // Mapa de pai canônico (catálogo global)
    const canonParent: Record<string, string | null> = {};
    orgNodes.forEach(n => { canonParent[n.id] = n.reporta_a_cargo_id; });

    // Cargos presentes no quadro desta casa
    const presentIds = new Set(rows.map(r => r.cargo_id));
    const rowByCargo: Record<string, QuadroRow> = {};
    rows.forEach(r => { rowByCargo[r.cargo_id] = r; });

    // Para cada cargo presente, encontra o pai efetivo (ancestral presente mais próximo)
    const effectParent: Record<string, string | null> = {};
    for (const id of presentIds) {
      let p: string | null = canonParent[id] ?? null;
      while (p !== null && !presentIds.has(p)) {
        p = canonParent[p] ?? null;
      }
      effectParent[id] = (p !== null && presentIds.has(p)) ? p : null;
    }

    // Mapa filhos de display
    const childMap: Record<string, string[]> = {};
    for (const [id, parent] of Object.entries(effectParent)) {
      const key = parent ?? "__root__";
      if (!childMap[key]) childMap[key] = [];
      childMap[key].push(id);
    }

    // Ordenar irmãos por ordem_hierarquia canônica
    const orderOf = (id: string) => orgById[id]?.ordem_hierarquia ?? 999;
    for (const arr of Object.values(childMap)) {
      arr.sort((a, b) => orderOf(a) - orderOf(b));
    }

    // Construir TreeNodes recursivamente
    function buildNode(id: string): TreeNode {
      const r = rowByCargo[id];
      const o = orgById[id];
      return {
        cargoId:  id,
        nome:     r?.cargo_nome ?? o?.nome ?? id,
        grupo:    r?.grupo ?? o?.grupo ?? "",
        children: (childMap[id] ?? []).map(buildNode),
        subtreeW: 0, x: 0, y: 0,
      };
    }

    const rootIds = childMap["__root__"] ?? [];
    if (rootIds.length === 0) return null;

    const roots = rootIds.map(buildNode);

    // Medir larguras
    roots.forEach(r => measureTree(r));

    // Calcular largura total do SVG
    const totalRootsW = roots.reduce((s, r) => s + r.subtreeW, 0)
      + Math.max(0, roots.length - 1) * H_GAP;
    const svgW = Math.max(ORG_W, totalRootsW) + 40;

    // Posicionar raízes (centralizado)
    let cursor = 20 + Math.max(0, (svgW - 40 - totalRootsW) / 2);
    for (const root of roots) {
      placeTree(root, cursor + root.subtreeW / 2, 20);
      cursor += root.subtreeW + H_GAP;
    }

    // Coletar todos os nós e arestas
    const allNodes = roots.flatMap(r => flattenTree(r));
    const edges: OrgEdge[] = [];
    roots.forEach(r => collectEdges(r, edges));

    const maxY  = allNodes.reduce((m, n) => Math.max(m, n.y + ORG_H), 0);
    const svgH  = maxY + 24;

    return { allNodes, edges, svgW, svgH };
  }, [rows, orgNodes]);

  if (rows.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-3)", fontSize: 13 }}>
        Nenhum cargo no quadro. Adicione cargos na Grade para ver o organograma.
      </div>
    );
  }

  if (orgNodes.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-3)", fontSize: 13 }}>
        Hierarquia canônica não disponível. Aplique as migrations 000007a-c no SQL Editor.
      </div>
    );
  }

  if (!layout) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-3)", fontSize: 13 }}>
        Nenhuma estrutura hierárquica detectada para os cargos deste quadro.
      </div>
    );
  }

  const { allNodes, edges, svgW, svgH } = layout;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <svg width={svgW} height={svgH} style={{ display: "block" }}>
        {/* Arestas */}
        {edges.map((e, i) => {
          const my = (e.y1 + e.y2) / 2;
          return (
            <path key={i}
              d={`M${e.x1},${e.y1} C${e.x1},${my} ${e.x2},${my} ${e.x2},${e.y2}`}
              fill="none" stroke="var(--border)" strokeWidth={1.5} />
          );
        })}

        {/* Nós */}
        {allNodes.map(n => {
          const cor = GRUPO_COR[n.grupo] ?? "#888";
          const label = n.nome.length > 18 ? n.nome.slice(0, 17) + "…" : n.nome;
          return (
            <g key={n.cargoId} transform={`translate(${n.x},${n.y})`}>
              <rect width={ORG_W} height={ORG_H} rx={8}
                fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1} />
              <rect x={0} y={0} width={4} height={ORG_H} rx={2} fill={cor} />
              <text x={ORG_W / 2 + 2} y={24}
                textAnchor="middle" fontSize={11.5}
                fill="var(--text)" fontWeight={500}
                fontFamily="var(--font-body), sans-serif">
                {label}
              </text>
              <text x={ORG_W / 2 + 2} y={40}
                textAnchor="middle" fontSize={9.5}
                fill={cor} fontWeight={600}
                fontFamily="var(--font-body), sans-serif">
                {n.grupo}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legenda */}
      <div style={{ marginTop: 16, display: "flex", gap: 14, flexWrap: "wrap" }}>
        {Object.entries(GRUPO_COR).map(([g, c]) => (
          <div key={g} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>{g}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 12 }}>
        Exibe apenas os cargos presentes nesta casa. Intermediários ausentes são omitidos
        e seus subordinados ligados ao ancestral presente mais próximo.
      </p>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function QuadroIdealClient({ units, initialUnitId, initialRows, cargos, orgNodes }: Props) {
  const [selectedId, setSelectedId]      = useState<string | null>(initialUnitId);
  const [rows, setRows]                  = useState<QuadroRow[]>(initialRows);
  const [edits, setEdits]                = useState<Record<string, LocalEdit>>({});
  const [view, setView]                  = useState<ViewMode>("grade");
  const [isPending, startTransition]     = useTransition();

  const [showAdd, setShowAdd]            = useState(false);
  const [addCargoId, setAddCargoId]      = useState("");
  const [addError, setAddError]          = useState("");

  const [saved, setSaved]                = useState(false);
  const [saveErr, setSaveErr]            = useState("");

  const dirtyCount = Object.keys(edits).length;

  async function loadUnit(unitId: string) {
    const data = await getQuadroCompleto(unitId);
    setRows(data);
    setEdits({});
    setSaved(false);
    setSaveErr("");
  }

  function handleUnitChange(id: string) {
    setSelectedId(id);
    startTransition(async () => { await loadUnit(id); });
  }

  function initEdit(rowId: string): LocalEdit {
    const row = rows.find(r => r.id === rowId)!;
    return {
      alvoManha:         row.alvo_manha,
      alvoTarde:         row.alvo_tarde,
      alvoNoite:         row.alvo_noite,
      alvoMadrugada:     row.alvo_madrugada,
      alvoIntermediario: row.alvo_intermediario,
    };
  }

  function handleTurnoChange(rowId: string, editKey: EditKey, raw: string) {
    const val = Math.max(0, parseInt(raw, 10) || 0);
    setEdits(prev => {
      const base = prev[rowId] ?? initEdit(rowId);
      return { ...prev, [rowId]: { ...base, [editKey]: val } };
    });
    setSaved(false); setSaveErr("");
  }

  function handleSave() {
    if (dirtyCount === 0) return;
    setSaveErr(""); setSaved(false);
    const payload = Object.entries(edits).map(([id, e]) => ({
      id,
      alvoManha:         e.alvoManha,
      alvoTarde:         e.alvoTarde,
      alvoNoite:         e.alvoNoite,
      alvoMadrugada:     e.alvoMadrugada,
      alvoIntermediario: e.alvoIntermediario,
    }));
    startTransition(async () => {
      const r = await salvarQuadroIdeal(payload);
      if (!r.ok) { setSaveErr(r.error ?? "Erro ao salvar"); return; }
      setRows(prev => prev.map(row => {
        const e = edits[row.id];
        if (!e) return row;
        const total = e.alvoManha + e.alvoTarde + e.alvoNoite + e.alvoMadrugada + e.alvoIntermediario;
        return {
          ...row,
          alvo_manha:         e.alvoManha,
          alvo_tarde:         e.alvoTarde,
          alvo_noite:         e.alvoNoite,
          alvo_madrugada:     e.alvoMadrugada,
          alvo_intermediario: e.alvoIntermediario,
          qtd_alvo:           total,
          gap:                total - row.headcount_atual,
        };
      }));
      setEdits({});
      setSaved(true);
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const r = await removerCargoDoQuadro(id);
      if (r.ok) {
        setRows(prev => prev.filter(row => row.id !== id));
        setEdits(prev => { const n = { ...prev }; delete n[id]; return n; });
      }
    });
  }

  function openAdd() { setAddCargoId(""); setAddError(""); setShowAdd(true); }

  function handleAdd() {
    if (!addCargoId)  { setAddError("Selecione um cargo"); return; }
    if (!selectedId)  { setAddError("Selecione uma unidade primeiro"); return; }
    if (rows.find(r => r.cargo_id === addCargoId)) { setAddError("Cargo já está no quadro desta unidade"); return; }
    setAddError("");
    startTransition(async () => {
      const r = await adicionarCargoAoQuadro(selectedId!, addCargoId);
      if (!r.ok) { setAddError(r.error ?? "Erro ao adicionar"); return; }
      setShowAdd(false);
      await loadUnit(selectedId!);
    });
  }

  const cargosSetores     = Array.from(new Set(cargos.map(c => c.setor))).sort();
  const cargoIdsNoQuadro  = new Set(rows.map(r => r.cargo_id));
  const cargosDisponiveis = cargos.filter(c => !cargoIdsNoQuadro.has(c.id));
  const totAlvo           = rows.reduce((s, r) => s + computeAlvo(r, edits), 0);
  const totAtual          = rows.reduce((s, r) => s + r.headcount_atual, 0);
  const totGap            = totAlvo - totAtual;

  const VIEWS: { key: ViewMode; label: string }[] = [
    { key: "grade",       label: "Grade"       },
    { key: "resumo",      label: "Resumo"      },
    { key: "organograma", label: "Organograma" },
  ];

  return (
    <div>
      {/* Modal — Adicionar cargo */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, width: "100%", maxWidth: 400 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Adicionar cargo ao Quadro Ideal</div>
            <div style={{ marginBottom: 18 }}>
              <label style={lblStyle}>Cargo</label>
              <select value={addCargoId} onChange={e => setAddCargoId(e.target.value)} style={inpStyle} autoFocus>
                <option value="">Selecione do catálogo…</option>
                {cargosSetores.map(setor => {
                  const opts = cargosDisponiveis.filter(c => c.setor === setor);
                  if (opts.length === 0) return null;
                  return (
                    <optgroup key={setor} label={setor}>
                      {opts.map(c => <option key={c.id} value={c.id}>{c.nome}{c.tem_nivel ? " (I / II)" : ""}</option>)}
                    </optgroup>
                  );
                })}
              </select>
              {addError && <div style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{addError}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text-2)", cursor: "pointer" }}>Cancelar</button>
              <button type="button" onClick={handleAdd} disabled={isPending} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: "var(--brand)", color: "var(--primary-foreground)", cursor: isPending ? "wait" : "pointer", opacity: isPending ? 0.7 : 1 }}>
                {isPending ? "Adicionando…" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <select value={selectedId ?? ""} onChange={e => handleUnitChange(e.target.value)} disabled={isPending}
          style={{ padding: "7px 12px", fontSize: 13, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface-2)", color: "var(--text)", cursor: "pointer" }}>
          <option value="" disabled>Selecionar unidade…</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        {selectedId && rows.length > 0 && (
          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            {VIEWS.map(v => (
              <button key={v.key} type="button" onClick={() => setView(v.key)}
                style={{ padding: "6px 14px", fontSize: 12, fontWeight: view === v.key ? 700 : 400, border: "none", borderRight: v.key !== "organograma" ? "1px solid var(--border)" : "none", background: view === v.key ? "var(--brand)" : "var(--surface-2)", color: view === v.key ? "var(--primary-foreground)" : "var(--text-2)", cursor: "pointer" }}>
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {dirtyCount > 0 && !isPending && (
          <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 500 }}>
            {dirtyCount} cargo{dirtyCount > 1 ? "s" : ""} com alterações não salvas
          </span>
        )}
        {saved && dirtyCount === 0 && <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 500 }}>Salvo</span>}
        {saveErr && <span style={{ fontSize: 12, color: "#DC2626" }}>{saveErr}</span>}

        {dirtyCount > 0 && (
          <button type="button" onClick={handleSave} disabled={isPending}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", background: "var(--brand)", color: "var(--primary-foreground)", cursor: isPending ? "wait" : "pointer", opacity: isPending ? 0.7 : 1 }}>
            <Save size={14} />
            {isPending ? "Salvando…" : "Salvar alterações"}
          </button>
        )}

        <button type="button" onClick={openAdd} disabled={!selectedId || isPending}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", cursor: selectedId && !isPending ? "pointer" : "not-allowed", opacity: selectedId && !isPending ? 1 : 0.5 }}>
          <Plus size={14} />
          Adicionar cargo
        </button>
      </div>

      {/* Totais */}
      {rows.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Alvo total", val: totAlvo,  color: "var(--text)"  },
            { label: "Ativos",     val: totAtual, color: "var(--text)"  },
            { label: "Gap",        val: totGap,   color: gapCor(totGap) },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-3)", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {!selectedId && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-3)", fontSize: 13 }}>
          Selecione uma unidade para ver o Quadro Ideal.
        </div>
      )}
      {selectedId && rows.length === 0 && !isPending && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-3)", fontSize: 13 }}>
          Nenhum cargo no quadro desta unidade ainda.{" "}
          <button type="button" onClick={openAdd} style={{ color: "var(--brand)", background: "none", border: "none", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
            Adicionar o primeiro cargo
          </button>
        </div>
      )}

      {rows.length > 0 && view === "grade" && (
        <GradeView rows={rows} edits={edits} onTurnoChange={handleTurnoChange} onRemove={handleRemove} isPending={isPending} />
      )}
      {rows.length > 0 && view === "resumo" && (
        <ResumoView rows={rows} edits={edits} />
      )}
      {rows.length > 0 && view === "organograma" && (
        <OrganogramaView rows={rows} orgNodes={orgNodes} />
      )}
    </div>
  );
}
