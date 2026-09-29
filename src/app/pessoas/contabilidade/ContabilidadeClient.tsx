"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useUnit } from "@kph/auth/context";
import { KpiCard } from "@kph/ui/kpi-card";
import {
  listarPeriodos,
  coletarPeriodo,
  listarFechamento,
  upsertLancamentoManual,
  type FechamentoPeriodo,
  type FechamentoLinha,
} from "./actions";
import { EspelhoFopag } from "./EspelhoFopag";
import { ExportDominioButton } from "@/components/pessoas/ExportDominioButton";

// ── helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtN = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Normaliza entrada do usuário para formato canônico MM/YYYY exigido pelo DB.
// Aceita: "07/2026", "7/2026", "jul/26", "jul/2026", "07/26"
const MESES: Record<string, string> = {
  jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06",
  jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
};
function normalizeCompetencia(s: string): string {
  const t = s.trim().toLowerCase();
  // Já no formato correto MM/YYYY
  if (/^\d{2}\/\d{4}$/.test(t)) return t;
  // M/YYYY → zero-pad
  const mYYYY = t.match(/^(\d{1})\/(\d{4})$/);
  if (mYYYY) return `0${mYYYY[1]}/${mYYYY[2]}`;
  // MM/YY or M/YY → expand year
  const mYY = t.match(/^(\d{1,2})\/(\d{2})$/);
  if (mYY && mYY[1] && mYY[2]) return `${mYY[1].padStart(2, "0")}/20${mYY[2]}`;
  // "jul/26" or "jul/2026"
  const named = t.match(/^([a-záéíóú]+)\/(\d{2,4})$/);
  if (named && named[1] && named[2]) {
    const mm = MESES[named[1]];
    if (mm) {
      const yr = named[2].length === 2 ? `20${named[2]}` : named[2];
      return `${mm}/${yr}`;
    }
  }
  return s.trim(); // devolve original — o DB CHECK vai rejeitar se inválido
}

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  ABERTO:             { label: "Aberto",            bg: "#EFF6FF", color: "#1D4ED8" },
  EM_CONFERENCIA:     { label: "Em Conferência",    bg: "#FEF9C3", color: "#92400E" },
  ENVIADO_ESCRITORIO: { label: "Enviado Escritório", bg: "#F3E8FF", color: "#6B21A8" },
  APROVADO:           { label: "Aprovado",          bg: "#D1FAE5", color: "#065F46" },
  FECHADO:            { label: "Fechado",           bg: "#F3F4F6", color: "#374151" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? { label: status, bg: "#F3F4F6", color: "#374151" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 5,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.6,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function OrigemBadge({ origem }: { origem: string }) {
  const isManual = origem === "MANUAL";
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 5,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
      background: isManual ? "#FEF3C7" : "var(--surface-2)",
      color: isManual ? "#92400E" : "var(--text-3)",
    }}>
      {origem}
    </span>
  );
}

function Skeleton({ height = 80 }: { height?: number }) {
  return (
    <div style={{
      height, background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, opacity: 0.6, animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}

// ── Modal de edição ────────────────────────────────────────────────────────

type EditModal = {
  periodoId: string;
  employeeId: string;
  nome: string;
  codKph: string;
  descricao: string;
  valor: number | null;
  valorHoras: string | null;
  observacao: string | null;
  periodoFechado: boolean;
};

function LancamentoModal({
  modal,
  onClose,
  onSave,
}: {
  modal: EditModal;
  onClose: () => void;
  onSave: (valor: number | null, valorHoras: string | null, obs: string | null) => Promise<void>;
}) {
  const [valor, setValor] = useState(modal.valor != null ? String(modal.valor) : "");
  const [horas, setHoras] = useState(modal.valorHoras ?? "");
  const [obs, setObs] = useState(modal.observacao ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    if (modal.periodoFechado) return;
    setSaving(true);
    setErr(null);
    await onSave(
      valor !== "" ? parseFloat(valor.replace(",", ".")) : null,
      horas !== "" ? horas : null,
      obs !== "" ? obs : null,
    );
    setSaving(false);
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border-strong)",
        borderRadius: 16, padding: "24px 28px", width: 420, maxWidth: "94vw",
        boxShadow: "var(--shadow-lg, 0 20px 60px rgba(0,0,0,0.4))",
      }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700,
            textTransform: "uppercase" as const, letterSpacing: 1 }}>
            Lançamento Manual
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>
            {modal.nome}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
            {modal.codKph} · {modal.descricao}
          </div>
        </div>

        {modal.periodoFechado && (
          <div style={{
            padding: "10px 14px", borderRadius: 8,
            background: "#FEF2F2", color: "#991B1B",
            fontSize: 12, fontWeight: 600, marginBottom: 16,
          }}>
            Período aprovado/fechado — edição bloqueada.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)",
              textTransform: "uppercase" as const, letterSpacing: 0.8 }}>
              Valor (R$)
            </span>
            <input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              disabled={modal.periodoFechado || saving}
              style={{
                padding: "9px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--surface-2)",
                color: "var(--text)", fontSize: 14, outline: "none",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)",
              textTransform: "uppercase" as const, letterSpacing: 0.8 }}>
              Horas (h:mm)
            </span>
            <input
              type="text"
              placeholder="ex: 2:30"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              disabled={modal.periodoFechado || saving}
              style={{
                padding: "9px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--surface-2)",
                color: "var(--text)", fontSize: 14, outline: "none",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)",
              textTransform: "uppercase" as const, letterSpacing: 0.8 }}>
              Observação
            </span>
            <textarea
              rows={2}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              disabled={modal.periodoFechado || saving}
              style={{
                padding: "9px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--surface-2)",
                color: "var(--text)", fontSize: 13, outline: "none", resize: "vertical",
              }}
            />
          </label>
        </div>

        {err && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#EF4444", fontWeight: 600 }}>
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "9px 18px", borderRadius: 8,
              background: "var(--surface-2)", border: "1px solid var(--border)",
              color: "var(--text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          {!modal.periodoFechado && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "9px 18px", borderRadius: 8,
                background: "var(--brand, #C4622D)", border: "none",
                color: "var(--primary-foreground)", fontSize: 13, fontWeight: 600, cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────

export function ContabilidadeClient({ isFounder = false }: { isFounder?: boolean }) {
  const { unit, units } = useUnit();
  const unitId = unit?.id ?? null;

  const [periodos, setPeriodos] = useState<FechamentoPeriodo[]>([]);
  const [periodoSel, setPeriodoSel] = useState<string | null>(null);
  const [novaCompetencia, setNovaCompetencia] = useState("");
  const [linhas, setLinhas] = useState<FechamentoLinha[]>([]);
  const [loadingPeriodos, setLoadingPeriodos] = useState(false);
  const [loadingLinhas, setLoadingLinhas] = useState(false);
  const [coletando, startColeta] = useTransition();
  const [coletaMsg, setColetaMsg] = useState<string | null>(null);
  const [modal, setModal] = useState<EditModal | null>(null);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"colaborador" | "espelho">("colaborador");

  useEffect(() => setMounted(true), []);

  const fetchPeriodos = useCallback(async (uid: string) => {
    setLoadingPeriodos(true);
    const data = await listarPeriodos(uid);
    setPeriodos(data);
    setLoadingPeriodos(false);
    if (data.length > 0 && !periodoSel) setPeriodoSel(data[0]!.periodo_id);
  }, [periodoSel]);

  useEffect(() => {
    if (unitId) fetchPeriodos(unitId);
  }, [unitId, fetchPeriodos]);

  const fetchLinhas = useCallback(async (pid: string) => {
    setLoadingLinhas(true);
    const data = await listarFechamento(pid);
    setLinhas(data);
    setLoadingLinhas(false);
  }, []);

  useEffect(() => {
    if (periodoSel) fetchLinhas(periodoSel);
    else setLinhas([]);
  }, [periodoSel, fetchLinhas]);

  const periodoAtual = periodos.find((p) => p.periodo_id === periodoSel);
  const periodoFechado = periodoAtual
    ? ["APROVADO", "FECHADO"].includes(periodoAtual.status)
    : false;

  // KPIs calculados a partir das linhas
  const colabsDistintos = new Set(linhas.map((l) => l.employee_id)).size;
  const custoProventos = linhas
    .filter((l) => l.tipo_rubrica === "PROVENTO" && l.unidade_rubrica === "R$" && l.valor != null)
    .reduce((acc, l) => acc + (l.valor ?? 0), 0);
  const salarioBase = linhas
    .filter((l) => l.cod_kph === "PV-01" && l.valor != null)
    .reduce((acc, l) => acc + (l.valor ?? 0), 0);
  const gorjeta = linhas
    .filter((l) => l.cod_kph === "PV-07" && l.valor != null)
    .reduce((acc, l) => acc + (l.valor ?? 0), 0);

  const semCodFolha = new Set(
    linhas.filter((l) => !l.cod_folha).map((l) => l.employee_id),
  ).size;

  // Agrupar linhas por colaborador
  type ColabGroup = { nome: string; employee_id: string; cod_folha: string | null; linhas: FechamentoLinha[] };
  const colabMap = new Map<string, ColabGroup>();
  for (const l of linhas) {
    if (!colabMap.has(l.employee_id)) {
      colabMap.set(l.employee_id, { nome: l.nome, employee_id: l.employee_id, cod_folha: l.cod_folha, linhas: [] });
    }
    colabMap.get(l.employee_id)!.linhas.push(l);
  }
  const colabGroups = Array.from(colabMap.values()).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  function handleColetar() {
    if (!unitId) return;
    const comp = normalizeCompetencia(novaCompetencia || periodoAtual?.competencia || "");
    if (!comp) return;

    if (periodoAtual && !novaCompetencia.trim()) {
      const ok = window.confirm(
        `Período "${comp}" já existe. Recoletar irá atualizar os dados AUTO. Continuar?`,
      );
      if (!ok) return;
    }

    setColetaMsg(null);
    startColeta(async () => {
      const r = await coletarPeriodo(unitId, comp);
      if (r.ok) {
        setColetaMsg(`✓ Coleta ok — ${r.colabs} colabs, ${r.linhas} linhas.`);
        const novos = await listarPeriodos(unitId);
        setPeriodos(novos);
        const pid = r.periodo_id ?? novos[0]?.periodo_id;
        if (pid) {
          setPeriodoSel(pid);
          setNovaCompetencia("");
        }
      } else {
        setColetaMsg(`✗ ${r.error}`);
      }
    });
  }

  async function handleSaveLancamento(
    valor: number | null,
    valorHoras: string | null,
    obs: string | null,
  ) {
    if (!modal) return;
    const r = await upsertLancamentoManual(
      modal.periodoId,
      modal.employeeId,
      modal.codKph,
      valor,
      valorHoras,
      obs,
    );
    if (r.ok) {
      setModal(null);
      if (periodoSel) await fetchLinhas(periodoSel);
      if (unitId) {
        const novos = await listarPeriodos(unitId);
        setPeriodos(novos);
      }
    } else {
      alert(`Erro: ${r.error}`);
    }
  }

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Cabeçalho */}
      <header style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6,
          textTransform: "uppercase" as const, color: "var(--text-3)" }}>
          Pessoas · Contabilidade
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 0",
          color: "var(--text)", letterSpacing: -0.4 }}>
          Fechamento de Folha
        </h1>
      </header>

      {/* ── Seletor + Ação ─────────────────────────────────────────────── */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "18px 20px", marginBottom: 24,
        display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "flex-end",
      }}>
        {/* Seletor de período existente */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)",
            textTransform: "uppercase" as const, letterSpacing: 0.8 }}>
            Período
          </span>
          {loadingPeriodos ? (
            <div style={{ width: 180, height: 36, background: "var(--surface-2)",
              borderRadius: 8, border: "1px solid var(--border)" }} />
          ) : (
            <select
              value={periodoSel ?? ""}
              onChange={(e) => { setPeriodoSel(e.target.value || null); setNovaCompetencia(""); }}
              style={{
                padding: "8px 12px", borderRadius: 8, minWidth: 180,
                border: "1px solid var(--border)", background: "var(--surface-2)",
                color: "var(--text)", fontSize: 13, cursor: "pointer",
              }}
            >
              {periodos.length === 0 && <option value="">Nenhum período</option>}
              {periodos.map((p) => (
                <option key={p.periodo_id} value={p.periodo_id}>
                  {p.competencia} · {p.colabs} colabs
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", color: "var(--text-3)",
          fontSize: 13, paddingBottom: 4 }}>ou</div>

        {/* Nova competência */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)",
            textTransform: "uppercase" as const, letterSpacing: 0.8 }}>
            Nova Competência
          </span>
          <input
            type="text"
            placeholder="ex: 07/2026"
            value={novaCompetencia}
            onChange={(e) => { setNovaCompetencia(e.target.value); if (e.target.value) setPeriodoSel(null); }}
            style={{
              padding: "8px 12px", borderRadius: 8, width: 130,
              border: "1px solid var(--border)", background: "var(--surface-2)",
              color: "var(--text)", fontSize: 13, outline: "none",
            }}
          />
        </div>

        <button
          onClick={handleColetar}
          disabled={coletando || (!periodoSel && !novaCompetencia.trim()) || !unitId}
          style={{
            padding: "9px 20px", borderRadius: 8,
            background: "var(--brand, #C4622D)", color: "var(--primary-foreground)",
            border: "none", fontSize: 13, fontWeight: 600,
            cursor: coletando ? "wait" : "pointer",
            opacity: coletando ? 0.7 : 1, marginBottom: 0,
          }}
        >
          {coletando ? "Coletando…" : "Coletar mês"}
        </button>

        {coletaMsg && (
          <div style={{
            fontSize: 12, fontWeight: 600, padding: "8px 12px", borderRadius: 8,
            background: coletaMsg.startsWith("✓") ? "#D1FAE5" : "#FEE2E2",
            color: coletaMsg.startsWith("✓") ? "#065F46" : "#991B1B",
          }}>
            {coletaMsg}
          </div>
        )}

        {periodoAtual && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={periodoAtual.status} />
            {isFounder && periodoSel && (
              <ExportDominioButton
                periodoId={periodoSel}
                competencia={periodoAtual.competencia}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Toggle de visão ─────────────────────────────────────────── */}
      {periodoSel && (
        <div style={{
          display: "flex", gap: 4, marginBottom: 20,
          background: "var(--surface-2)", border: "1px solid var(--border)",
          borderRadius: 10, padding: 4, width: "fit-content",
        }}>
          {(["colaborador", "espelho"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "7px 18px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                background: view === v ? "var(--surface)" : "transparent",
                color: view === v ? "var(--text)" : "var(--text-3)",
                boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              }}
            >
              {v === "colaborador" ? "Por colaborador" : "Espelho FOPAG"}
            </button>
          ))}
        </div>
      )}

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      {view === "colaborador" && periodoSel && (
        <>
          {loadingLinhas ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={110} />)}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
                gap: 14, marginBottom: 8 }}>
                <KpiCard
                  label="Colaboradores"
                  value={colabsDistintos}
                  sub={semCodFolha > 0 ? `${semCodFolha} sem matrícula Domínio` : "Todos com matrícula"}
                  accent={semCodFolha > 0 ? "#EF4444" : undefined}
                />
                <KpiCard
                  label="Custo de Proventos (bruto)"
                  value={fmt(custoProventos)}
                  sub="Não inclui encargos patronais nem descontos"
                />
                <KpiCard
                  label="Salário Base"
                  value={fmt(salarioBase)}
                  sub="Soma de PV-01 dos colaboradores"
                />
                <KpiCard
                  label="Gorjeta"
                  value={fmt(gorjeta)}
                  sub={gorjeta === 0 ? "Sem gorjeta neste período" : "Soma de PV-07"}
                />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 20, paddingLeft: 2 }}>
                ⚠ "Custo de Proventos" é o custo bruto de remuneração — não é o líquido do FOPAG nem o custo total de pessoal (que inclui INSS + FGTS patronal).
              </div>
            </>
          )}

          {/* ── Aviso sem cod_folha ───────────────────────────────────── */}
          {semCodFolha > 0 && !loadingLinhas && (
            <div style={{
              marginBottom: 20, padding: "12px 16px", borderRadius: 10,
              background: "#FEF2F2", border: "1px solid #FECACA",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 16 }}>⚠</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
                  {semCodFolha} colaborador{semCodFolha > 1 ? "es" : ""} sem matrícula Domínio (cod_folha)
                </div>
                <div style={{ fontSize: 12, color: "#B91C1C", marginTop: 2 }}>
                  O Domínio não reconhece lançamento sem matrícula — preencher employee_codigos_dominio antes de exportar.
                  Colaboradores sinalizados em vermelho na tabela abaixo.
                </div>
              </div>
            </div>
          )}

          {/* ── Tabela de lançamentos ─────────────────────────────────── */}
          {loadingLinhas ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={48} />)}
            </div>
          ) : linhas.length === 0 ? (
            <div style={{
              padding: "56px 24px", textAlign: "center",
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                Nenhum lançamento neste período.
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                Use o botão "Coletar mês" para importar dados do ponto e gorjeta.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {colabGroups.map((colab) => {
                const semCC = !colab.cod_folha;
                return (
                  <div key={colab.employee_id} style={{
                    background: "var(--surface)", border: semCC
                      ? "1px solid #FCA5A5"
                      : "1px solid var(--border)",
                    borderRadius: 12, overflow: "hidden",
                  }}>
                    {/* Header do colaborador */}
                    <div style={{
                      padding: "12px 16px",
                      background: semCC ? "#FEF2F2" : "var(--surface-2)",
                      display: "flex", alignItems: "center", gap: 10,
                      borderBottom: "1px solid var(--border)",
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: semCC ? "#991B1B" : "var(--text)" }}>
                        {colab.nome}
                      </span>
                      {semCC ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#EF4444",
                          background: "#FEE2E2", padding: "2px 8px", borderRadius: 5 }}>
                          SEM MATRÍCULA DOMÍNIO
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                          CC {colab.cod_folha}
                        </span>
                      )}
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-3)" }}>
                        {colab.linhas.length} lançamento{colab.linhas.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Linhas do colaborador */}
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)" }}>
                            {["Código", "Descrição", "Grupo", "Valor R$", "Horas", "Origem", ""].map((h) => (
                              <th key={h} style={{
                                padding: "8px 12px", textAlign: "left" as const,
                                fontSize: 10, fontWeight: 700, color: "var(--text-3)",
                                textTransform: "uppercase" as const, letterSpacing: 0.6, whiteSpace: "nowrap",
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {colab.linhas.map((l, i) => (
                            <tr key={`${l.employee_id}-${l.cod_kph}`}
                              style={{
                                borderBottom: i < colab.linhas.length - 1
                                  ? "1px solid var(--border)"
                                  : "none",
                                background: l.origem_lancamento === "MANUAL"
                                  ? "rgba(251,191,36,0.06)"
                                  : "transparent",
                              }}
                            >
                              <td style={{ padding: "9px 12px", fontWeight: 600, color: "var(--text-2)" }}>
                                {l.cod_kph}
                              </td>
                              <td style={{ padding: "9px 12px", color: "var(--text)" }}>
                                {l.descricao_rubrica}
                              </td>
                              <td style={{ padding: "9px 12px", color: "var(--text-3)", fontSize: 11 }}>
                                {l.grupo.replace("_", " ")}
                              </td>
                              <td style={{ padding: "9px 12px", color: "var(--text)", fontWeight: 500 }}>
                                {l.valor != null ? fmtN(l.valor) : "—"}
                              </td>
                              <td style={{ padding: "9px 12px", color: "var(--text-2)" }}>
                                {l.valor_horas ?? "—"}
                              </td>
                              <td style={{ padding: "9px 12px" }}>
                                <OrigemBadge origem={l.origem_lancamento} />
                              </td>
                              <td style={{ padding: "9px 12px" }}>
                                <button
                                  onClick={() => setModal({
                                    periodoId: periodoSel!,
                                    employeeId: l.employee_id,
                                    nome: l.nome,
                                    codKph: l.cod_kph,
                                    descricao: l.descricao_rubrica,
                                    valor: l.valor,
                                    valorHoras: l.valor_horas,
                                    observacao: null,
                                    periodoFechado,
                                  })}
                                  style={{
                                    padding: "4px 10px", borderRadius: 6,
                                    border: "1px solid var(--border)",
                                    background: "var(--surface-2)", color: "var(--text-2)",
                                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                                  }}
                                >
                                  {periodoFechado ? "Ver" : "Editar"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Espelho FOPAG ───────────────────────────────────────────── */}
      {view === "espelho" && periodoSel && (
        <EspelhoFopag periodoId={periodoSel} periodoFechado={periodoFechado} />
      )}

      {!periodoSel && !loadingPeriodos && (
        <div style={{
          padding: "56px 24px", textAlign: "center",
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            Selecione uma unidade e um período para começar.
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>
            Ou informe uma nova competência (ex: 07/2026) e clique em "Coletar mês".
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <LancamentoModal
          modal={modal}
          onClose={() => setModal(null)}
          onSave={handleSaveLancamento}
        />
      )}
    </div>
  );
}
