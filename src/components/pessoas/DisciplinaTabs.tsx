"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarX,
  CheckCircle2,
  CircleMinus,
  FileWarning,
  Gavel,
  Gift,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react";

import { Button } from "@kph/ui/button";
import { Input } from "@kph/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kph/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kph/ui/tabs";
import { Textarea } from "@kph/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kph/ui/table";

import { ScoreBar } from "@/components/pessoas/ScoreBar";
import { WarningDialog } from "@/components/pessoas/WarningDialog";
import { AbsenceDialog } from "@/components/pessoas/AbsenceDialog";

import {
  ABSENCE_LABEL,
  SCORE_EVENT_LABEL,
  WARNING_LABEL,
  scoreColor,
  SCORE_COLORS,
} from "@/lib/pessoas/score";
import { addScoreBonus, createDisciplinaryAction, listScoreEvents } from "@/lib/pessoas/actions";
import type { DisciplinaryActionRow } from "@/lib/pessoas/actions";
import { triggerMonthlyScore } from "@/lib/pessoas/score-monthly";
import { avatarColor, formatDateBR, initials } from "@/lib/format";
import type {
  AbsenceTipo,
  AbsenceWithEmployee,
  EmployeeScore,
  EmployeeStub,
  ScoreEvent,
  WarningNivel,
  WarningWithEmployee,
} from "@kph/db/types/pessoas";

const NIVEL_COLOR: Record<WarningNivel, { bg: string; fg: string }> = {
  verbal: { bg: "rgba(245,158,11,0.16)", fg: "#A16207" },
  escrita: { bg: "rgba(249,115,22,0.16)", fg: "#C2410C" },
  suspensao: { bg: "rgba(239,68,68,0.16)", fg: "#B91C1C" },
};

const ABSENCE_COLOR: Record<AbsenceTipo, { bg: string; fg: string }> = {
  injustificada: { bg: "rgba(239,68,68,0.16)", fg: "#B91C1C" },
  justificada: { bg: "rgba(59,130,246,0.16)", fg: "#1D4ED8" },
  atestado: { bg: "rgba(34,197,94,0.16)", fg: "#15803D" },
  falta_abono: { bg: "var(--muted)", fg: "var(--muted-foreground)" },
};

type ModalState =
  | { kind: "none" }
  | { kind: "warning"; employeeId?: string }
  | { kind: "absence"; employeeId?: string }
  | { kind: "medida"; employeeId?: string };

export function DisciplinaTabs({
  unitId,
  unitName,
  warnings,
  absences,
  scores,
  employees,
  disciplinaryActions,
}: {
  unitId: string;
  unitName: string;
  warnings: WarningWithEmployee[];
  absences: AbsenceWithEmployee[];
  scores: EmployeeScore[];
  employees: EmployeeStub[];
  disciplinaryActions: DisciplinaryActionRow[];
}) {
  const [modal, setModal] = useState<ModalState>({ kind: "none" });
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  const selected = useMemo(
    () => scores.find((s) => s.employee.id === selectedEmpId) ?? null,
    [scores, selectedEmpId],
  );

  const kpis = useMemo(() => {
    const scoreMedio = scores.length
      ? Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length)
      : null;
    const advertencias = warnings.length;
    const abaixoDe70 = scores.filter((s) => s.score < 70).length;
    const bonusNoMes = 0; // sem campo de tipo "bonus" específico disponível aqui
    return { scoreMedio, advertencias, abaixoDe70, bonusNoMes };
  }, [scores, warnings]);

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 22 }}>
        <DKpiCard
          icon={<ShieldCheck size={18} />}
          label="Score médio da unit"
          value={kpis.scoreMedio != null ? `${kpis.scoreMedio}/100` : "—"}
        />
        <DKpiCard
          icon={<TrendingDown size={18} />}
          label="Advertências totais"
          value={kpis.advertencias}
          highlight={kpis.advertencias > 0}
        />
        <DKpiCard
          icon={<AlertTriangle size={18} />}
          label="Colabs score < 70"
          value={kpis.abaixoDe70}
          highlight={kpis.abaixoDe70 > 0}
          highlightColor="red"
        />
        <DKpiCard
          icon={<Gift size={18} />}
          label="Faltas no período"
          value={absences.length}
        />
      </div>

      <Tabs defaultValue="warnings">
        <TabsList variant="line">
          <TabsTrigger value="warnings">
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            Advertências ({warnings.length})
          </TabsTrigger>
          <TabsTrigger value="absences">
            <CalendarX className="mr-1.5 h-3.5 w-3.5" />
            Faltas ({absences.length})
          </TabsTrigger>
          <TabsTrigger value="score">
            <TrendingDown className="mr-1.5 h-3.5 w-3.5" />
            Score Geral
          </TabsTrigger>
          <TabsTrigger value="medidas">
            <Gavel className="mr-1.5 h-3.5 w-3.5" />
            Medidas Disciplinares ({disciplinaryActions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="warnings">
          <SectionToolbar
            label={`${unitName} · ${warnings.length} advertência${warnings.length === 1 ? "" : "s"}`}
            actionLabel="Nova advertência"
            onAction={() => setModal({ kind: "warning" })}
          />
          <WarningsTable warnings={warnings} />
        </TabsContent>

        <TabsContent value="absences">
          <SectionToolbar
            label={`${unitName} · ${absences.length} falta${absences.length === 1 ? "" : "s"}`}
            actionLabel="Registrar falta"
            onAction={() => setModal({ kind: "absence" })}
          />
          <AbsencesTable absences={absences} />
        </TabsContent>

        <TabsContent value="score">
          <ScoreTable
            unitId={unitId}
            scores={scores}
            onSelect={(id) => setSelectedEmpId(id)}
          />
        </TabsContent>

        <TabsContent value="medidas">
          <MedidasContent
            unitId={unitId}
            unitName={unitName}
            actions={disciplinaryActions}
            onNew={() => setModal({ kind: "medida" })}
          />
        </TabsContent>
      </Tabs>

      {modal.kind === "warning" && (
        <WarningDialog
          employees={employees}
          {...(modal.employeeId !== undefined ? { initialEmployeeId: modal.employeeId } : {})}
          onClose={() => setModal({ kind: "none" })}
        />
      )}
      {modal.kind === "absence" && (
        <AbsenceDialog
          employees={employees}
          {...(modal.employeeId !== undefined ? { initialEmployeeId: modal.employeeId } : {})}
          onClose={() => setModal({ kind: "none" })}
        />
      )}
      {modal.kind === "medida" && (
        <MedidaFormModal
          unitId={unitId}
          employees={employees}
          initialEmployeeId={modal.employeeId}
          onClose={() => setModal({ kind: "none" })}
        />
      )}

      {/* Drawer-ish overlay com detalhe do score (simples, sem lib de drawer) */}
      {selected && (
        <ScoreDetailOverlay
          row={selected}
          onClose={() => setSelectedEmpId(null)}
        />
      )}
    </>
  );
}

// ── Subcomponentes de UI ───────────────────────────────────────

function SectionToolbar({
  label,
  actionLabel,
  onAction,
}: {
  label: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "16px 0 12px",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</span>
      <Button onClick={onAction}>
        <Plus className="mr-2 h-4 w-4" />
        {actionLabel}
      </Button>
    </div>
  );
}

function WarningsTable({ warnings }: { warnings: WarningWithEmployee[] }) {
  if (warnings.length === 0) {
    return (
      <EmptyState
        icon={<ShieldAlert size={20} />}
        title="Nenhuma advertência registrada"
        desc="Documente verbal/escrita/suspensão pra blindar a casa em rescisões."
      />
    );
  }
  return (
    <TableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <Th>Colaborador</Th>
            <Th>Nível</Th>
            <Th>Descrição</Th>
            <Th>Data</Th>
            <Th align="right">Impacto</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warnings.map((w) => {
            const emp = w.employee;
            const fullName = emp ? `${emp.nome} ${emp.sobrenome}` : "—";
            const c = NIVEL_COLOR[w.nivel as WarningNivel] ?? {
              bg: "var(--muted)",
              fg: "var(--text)",
            };
            return (
              <TableRow key={w.id}>
                <TableCell>
                  <NameCell name={fullName} sub={emp?.funcao ?? ""} />
                </TableCell>
                <TableCell>
                  <Pill bg={c.bg} fg={c.fg}>
                    {WARNING_LABEL[w.nivel as WarningNivel] ?? w.nivel}
                  </Pill>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>{w.descricao}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                    {formatDateBR(w.data)}
                  </span>
                </TableCell>
                <TableCell style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: 12, color: "var(--destructive)" }}>
                    {w.score_impact}
                  </strong>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableShell>
  );
}

function AbsencesTable({ absences }: { absences: AbsenceWithEmployee[] }) {
  if (absences.length === 0) {
    return (
      <EmptyState
        icon={<CalendarX size={20} />}
        title="Nenhuma falta registrada"
        desc="Registre faltas com tipo e motivo — score só desce em injustificadas."
      />
    );
  }
  return (
    <TableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <Th>Colaborador</Th>
            <Th>Tipo</Th>
            <Th>Motivo</Th>
            <Th>Data</Th>
            <Th align="right">Impacto</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((a) => {
            const emp = a.employee;
            const fullName = emp ? `${emp.nome} ${emp.sobrenome}` : "—";
            const c = ABSENCE_COLOR[a.tipo as AbsenceTipo] ?? {
              bg: "var(--muted)",
              fg: "var(--text)",
            };
            return (
              <TableRow key={a.id}>
                <TableCell>
                  <NameCell name={fullName} sub={emp?.funcao ?? ""} />
                </TableCell>
                <TableCell>
                  <Pill bg={c.bg} fg={c.fg}>
                    {ABSENCE_LABEL[a.tipo as AbsenceTipo] ?? a.tipo}
                  </Pill>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {a.motivo ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                    {formatDateBR(a.data)}
                  </span>
                </TableCell>
                <TableCell style={{ textAlign: "right" }}>
                  <strong
                    style={{
                      fontSize: 12,
                      color: a.score_impact < 0 ? "var(--destructive)" : "var(--text-3)",
                    }}
                  >
                    {a.score_impact === 0 ? "—" : a.score_impact}
                  </strong>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableShell>
  );
}

function ScoreTable({
  unitId,
  scores,
  onSelect,
}: {
  unitId: string;
  scores: EmployeeScore[];
  onSelect: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [calcResult, setCalcResult] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<"todos" | "verde" | "amarelo" | "vermelho">("todos");

  function handleCalcBonuses() {
    setCalcResult(null);
    const today = new Date();
    const periodo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    if (
      !window.confirm(
        `Calcular bônus do mês ${periodo.slice(0, 7)} pra unidade? Vai inserir score_events de assiduidade, pontualidade e aniversário.`,
      )
    )
      return;
    startTransition(async () => {
      const r = await triggerMonthlyScore(unitId, periodo);
      if (!r.ok) {
        setCalcResult(`Falha: ${r.error}`);
        return;
      }
      setCalcResult(
        `${r.data.events_inserted} bônus aplicado${r.data.events_inserted === 1 ? "" : "s"} ` +
          `(assiduidade ${r.data.detail.assiduidade}, pontualidade ${r.data.detail.pontualidade}, aniversário ${r.data.detail.aniversario}).`,
      );
      router.refresh();
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scores.filter((s) => {
      const z = scoreColor(s.score);
      if (zoneFilter === "verde" && z !== "green") return false;
      if (zoneFilter === "amarelo" && z !== "yellow") return false;
      if (zoneFilter === "vermelho" && z !== "red") return false;
      if (!q) return true;
      const name = `${s.employee.nome} ${s.employee.sobrenome}`.toLowerCase();
      return name.includes(q) || (s.employee.funcao ?? "").toLowerCase().includes(q);
    });
  }, [scores, search, zoneFilter]);

  // Distribuição por zona pra o cartão de resumo
  const dist = useMemo(() => {
    const r = { green: 0, yellow: 0, red: 0 };
    for (const s of scores) r[scoreColor(s.score)]++;
    return r;
  }, [scores]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        }}
      >
        <ZoneCard label="Verde · > 80" count={dist.green} color={SCORE_COLORS.green.fg} />
        <ZoneCard label="Amarelo · 60-80" count={dist.yellow} color={SCORE_COLORS.yellow.fg} />
        <ZoneCard label="Vermelho · < 60" count={dist.red} color={SCORE_COLORS.red.fg} />
      </div>

      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "minmax(200px, 1fr) auto auto",
        }}
      >
        <Input
          placeholder="Buscar nome ou função…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={zoneFilter} onValueChange={(v) => v && setZoneFilter(v as typeof zoneFilter)}>
          <SelectTrigger style={{ minWidth: 140 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas zonas</SelectItem>
            <SelectItem value="verde">Verde</SelectItem>
            <SelectItem value="amarelo">Amarelo</SelectItem>
            <SelectItem value="vermelho">Vermelho</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleCalcBonuses} disabled={pending} variant="outline">
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Sparkles className="mr-2 h-4 w-4" />
          Calcular bônus do mês
        </Button>
      </div>

      {calcResult && (
        <div
          style={{
            padding: "10px 12px",
            background: "var(--brand-soft)",
            border: "1px solid var(--brand)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--brand)",
          }}
        >
          {calcResult}
        </div>
      )}

      <TableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <Th>Colaborador</Th>
              <Th>Score</Th>
              <Th align="right">Adv</Th>
              <Th align="right">Faltas</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} style={emptyTd}>
                  Nenhum colaborador na zona/filtro.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => {
                const fullName = `${s.employee.nome} ${s.employee.sobrenome}`.trim();
                return (
                  <TableRow
                    key={s.employee.id}
                    onClick={() => onSelect(s.employee.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <NameCell name={fullName} sub={s.employee.funcao ?? ""} />
                    </TableCell>
                    <TableCell>
                      <ScoreBar
                        score={s.score}
                        warnings={s.warnings_count}
                        absences={s.absences_count}
                      />
                    </TableCell>
                    <TableCell style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ fontSize: 12, color: s.warnings_count > 0 ? "var(--destructive)" : "var(--text-3)" }}>
                        {s.warnings_count}
                      </span>
                    </TableCell>
                    <TableCell style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ fontSize: 12, color: s.absences_count > 0 ? "var(--destructive)" : "var(--text-3)" }}>
                        {s.absences_count}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────

function ScoreDetailOverlay({
  row,
  onClose,
}: {
  row: EmployeeScore;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [events, setEvents] = useState<ScoreEvent[] | null>(null);
  const [showBonus, setShowBonus] = useState(false);
  const [bonusDelta, setBonusDelta] = useState<string>("");
  const [bonusDesc, setBonusDesc] = useState<string>("");
  const [bonusError, setBonusError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listScoreEvents(row.employee.id).then((evts) => {
      if (!cancelled) setEvents(evts);
    });
    return () => {
      cancelled = true;
    };
  }, [row.employee.id]);

  const fullName = `${row.employee.nome} ${row.employee.sobrenome}`.trim();
  const c = SCORE_COLORS[scoreColor(row.score)];

  function handleSaveBonus() {
    setBonusError(null);
    const delta = Number(bonusDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      setBonusError("Delta inválido (use número diferente de zero, positivo ou negativo).");
      return;
    }
    if (!bonusDesc.trim()) {
      setBonusError("Descrição obrigatória.");
      return;
    }
    startTransition(async () => {
      const r = await addScoreBonus(row.employee.id, delta, bonusDesc.trim());
      if (!r.ok) {
        setBonusError(r.error);
        return;
      }
      // Refresh local state
      setShowBonus(false);
      setBonusDelta("");
      setBonusDesc("");
      const evts = await listScoreEvents(row.employee.id);
      setEvents(evts);
      router.refresh();
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: 14,
          border: "1px solid var(--border)",
          padding: "22px 24px",
          maxWidth: 580,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: "var(--text-3)",
              }}
            >
              Score
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: "4px 0 0",
                color: "var(--text)",
              }}
            >
              {fullName}
            </h3>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              {row.employee.funcao ?? "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-3)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: c.bg,
            border: `1px solid ${c.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: c.fg,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Score atual
            </span>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: c.fg,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.score}
              <span style={{ fontSize: 14, opacity: 0.7 }}>/100</span>
            </span>
          </div>
          <ScoreBar
            score={row.score}
            warnings={row.warnings_count}
            absences={row.absences_count}
          />
        </div>

        <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
          <span style={{ color: "var(--text-3)" }}>
            Adv: <strong style={{ color: "var(--text)" }}>{row.warnings_count}</strong>
          </span>
          <span style={{ color: "var(--text-3)" }}>
            Faltas: <strong style={{ color: "var(--text)" }}>{row.absences_count}</strong>
          </span>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h4
              style={{
                fontSize: 13,
                fontWeight: 700,
                margin: 0,
                color: "var(--text)",
              }}
            >
              Histórico de eventos
            </h4>
            <Button size="sm" onClick={() => setShowBonus(true)} disabled={pending}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Bônus manual
            </Button>
          </div>

          {events == null ? (
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
              Carregando…
            </p>
          ) : events.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
              Sem eventos registrados.
            </p>
          ) : (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                background: "var(--surface-2)",
              }}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <Th>Tipo</Th>
                    <Th>Descrição</Th>
                    <Th>Data</Th>
                    <Th align="right">Δ</Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev) => {
                    const positive = ev.delta > 0;
                    const deltaColor = positive
                      ? "#15803D"
                      : ev.delta < 0
                      ? "#B91C1C"
                      : "var(--text-3)";
                    return (
                      <TableRow key={ev.id}>
                        <TableCell style={{ fontSize: 12, color: "var(--text-2)" }}>
                          {SCORE_EVENT_LABEL[ev.tipo] ?? ev.tipo}
                        </TableCell>
                        <TableCell
                          style={{
                            fontSize: 12,
                            color: "var(--text-2)",
                            maxWidth: 220,
                          }}
                        >
                          {ev.descricao ?? "—"}
                        </TableCell>
                        <TableCell style={{ fontSize: 11, color: "var(--text-3)" }}>
                          {formatDateBR(ev.created_at.slice(0, 10))}
                        </TableCell>
                        <TableCell
                          style={{
                            textAlign: "right",
                            fontSize: 13,
                            fontWeight: 700,
                            color: deltaColor,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {positive ? "+" : ""}{ev.delta}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {showBonus && (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 14,
              background: "var(--surface-2)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <h4
              style={{
                fontSize: 12,
                fontWeight: 700,
                margin: 0,
                color: "var(--text)",
              }}
            >
              Adicionar bônus manual
            </h4>
            <label
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-2)",
                }}
              >
                Delta (use negativo pra ajuste)
              </span>
              <Input
                type="number"
                step="1"
                value={bonusDelta}
                onChange={(e) => setBonusDelta(e.target.value)}
                placeholder="Ex: 10"
              />
            </label>
            <label
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-2)",
                }}
              >
                Descrição
              </span>
              <Textarea
                rows={2}
                value={bonusDesc}
                onChange={(e) => setBonusDesc(e.target.value)}
                placeholder="Motivo do bônus"
              />
            </label>
            {bonusError && (
              <div
                style={{
                  padding: "8px 10px",
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.30)",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#B91C1C",
                }}
              >
                {bonusError}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBonus(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveBonus} disabled={pending}>
                {pending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        )}

        <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5, margin: 0 }}>
          Score parte de 100. Penalidades: verbal −10, escrita −25, suspensão −50,
          falta injustificada −5. Bônus mensais: assiduidade +5, pontualidade +3,
          aniversário de admissão +2. Score sempre clampado em [0, 100].
        </p>
      </div>
    </div>
  );
}

function NameCell({ name, sub }: { name: string; sub: string }) {
  const color = avatarColor(name);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 99,
          background: `color-mix(in srgb, ${color} 18%, transparent)`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials(name)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{name}</span>
        {sub && (
          <span style={{ fontSize: 10, color: "var(--text-3)" }}>{sub}</span>
        )}
      </div>
    </div>
  );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 99,
        background: bg,
        color: fg,
      }}
    >
      {children}
    </span>
  );
}

function ZoneCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>
        {count}
      </span>
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>{children}</div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <TableHead style={align === "right" ? { textAlign: "right" } : undefined}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "var(--text-3)",
        }}
      >
        {children}
      </span>
    </TableHead>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: "48px 24px",
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
          width: 44,
          height: 44,
          borderRadius: 99,
          background: "var(--brand-soft)",
          color: "var(--brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</div>
      <p style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 380, margin: 0, lineHeight: 1.55 }}>
        {desc}
      </p>
    </div>
  );
}

// ── Medidas Disciplinares ─────────────────────────────────────────────────────

const MEDIDA_OPTIONS = [
  "Advertência escrita",
  "Advertência verbal",
  "Suspensão",
  "Dispensa por justa causa",
] as const;

const MEDIDA_COLOR: Record<string, { bg: string; fg: string }> = {
  "Advertência verbal":        { bg: "rgba(245,158,11,0.14)", fg: "#A16207" },
  "Advertência escrita":       { bg: "rgba(249,115,22,0.14)", fg: "#C2410C" },
  "Suspensão":                 { bg: "rgba(239,68,68,0.14)",  fg: "#B91C1C" },
  "Dispensa por justa causa":  { bg: "rgba(109,40,217,0.14)", fg: "#6D28D9" },
};

function MedidasContent({
  unitId,
  unitName,
  actions,
  onNew,
}: {
  unitId: string;
  unitName: string;
  actions: DisciplinaryActionRow[];
  onNew: () => void;
}) {
  const [filtroMedida, setFiltroMedida] = useState("todos");
  const [filtroEmp, setFiltroEmp] = useState("");

  const filtradas = useMemo(() => {
    return actions.filter((a) => {
      const medidaOk = filtroMedida === "todos" || a.medida === filtroMedida;
      const empOk =
        !filtroEmp ||
        `${a.employee?.nome ?? a.nome ?? ""} ${a.employee?.sobrenome ?? ""}`.toLowerCase().includes(filtroEmp.toLowerCase());
      return medidaOk && empOk;
    });
  }, [actions, filtroMedida, filtroEmp]);

  const kpis = useMemo(() => {
    const escritas = actions.filter((a) => a.medida === "Advertência escrita").length;
    const suspensoes = actions.filter((a) => a.medida === "Suspensão").length;
    const reincidentes = new Set(actions.filter((a) => a.reincidencia).map((a) => a.employee_id)).size;
    return { total: actions.length, escritas, suspensoes, reincidentes };
  }, [actions]);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18, marginTop: 14 }}>
        <MedidaKpiCard icon={<Gavel size={16} />} label="Total de medidas" value={kpis.total} />
        <MedidaKpiCard icon={<FileWarning size={16} />} label="Advertências escritas" value={kpis.escritas} highlight={kpis.escritas > 0} />
        <MedidaKpiCard icon={<CircleMinus size={16} />} label="Suspensões" value={kpis.suspensoes} highlight={kpis.suspensoes > 0} color="red" />
        <MedidaKpiCard icon={<AlertTriangle size={16} />} label="Colabs reincidentes" value={kpis.reincidentes} highlight={kpis.reincidentes > 0} color="red" />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Input
            placeholder="Filtrar colaborador…"
            value={filtroEmp}
            onChange={(e) => setFiltroEmp(e.target.value)}
            style={{ width: 200, height: 32, fontSize: 12 }}
          />
          <Select value={filtroMedida} onValueChange={(v) => setFiltroMedida(v ?? "todos")}>
            <SelectTrigger style={{ width: 200, height: 32, fontSize: 12 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as medidas</SelectItem>
              {MEDIDA_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={onNew}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova medida
        </Button>
      </div>

      {/* Tabela */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 200 }}>Colaborador</TableHead>
              <TableHead style={{ width: 180 }}>Medida</TableHead>
              <TableHead style={{ width: 100 }}>Data</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead style={{ width: 120 }}>Gestor</TableHead>
              <TableHead style={{ width: 90, textAlign: "center" }}>Reincidente</TableHead>
              <TableHead style={{ width: 80, textAlign: "center" }}>Assinou</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} style={emptyTd}>
                  Nenhuma medida registrada.
                </TableCell>
              </TableRow>
            ) : (
              filtradas.map((a) => {
                const nomeColab = a.employee
                  ? `${a.employee.nome} ${a.employee.sobrenome}`
                  : (a.nome ?? "—");
                const dataCerta = a.data_ocorrencia ?? a.data;
                const medidaStyle = MEDIDA_COLOR[a.medida ?? ""] ?? { bg: "var(--surface-2)", fg: "var(--text-3)" };
                return (
                  <TableRow key={a.id}>
                    <TableCell style={{ fontSize: 12, fontWeight: 500 }}>
                      {nomeColab}
                      {a.employee?.funcao && (
                        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>{a.employee.funcao}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                        background: medidaStyle.bg, color: medidaStyle.fg, whiteSpace: "nowrap",
                      }}>
                        {a.medida ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: 12, color: "var(--text-2)", whiteSpace: "nowrap" }}>
                      {dataCerta ? formatDateBR(dataCerta) : "—"}
                    </TableCell>
                    <TableCell style={{ fontSize: 12, color: "var(--text-2)", maxWidth: 260 }}>
                      <span title={a.motivo ?? ""} style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {a.motivo ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: 12, color: "var(--text-2)" }}>{a.gestor ?? "—"}</TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      {a.reincidencia ? (
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#B91C1C", background: "rgba(239,68,68,0.12)", padding: "2px 7px", borderRadius: 99 }}>Sim</span>
                      ) : (
                        <span style={{ fontSize: 10, color: "var(--text-3)" }}>1ª vez</span>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      {a.assinou ? (
                        <CheckCircle2 size={14} color="#15803D" />
                      ) : (
                        <CircleMinus size={14} color="#9CA3AF" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MedidaKpiCard({
  icon, label, value, highlight, color = "yellow",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
  color?: "yellow" | "red";
}) {
  const bg = highlight
    ? color === "red" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.14)"
    : "var(--brand-soft)";
  const fg = highlight
    ? color === "red" ? "#B91C1C" : "#A16207"
    : "var(--brand)";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 99, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, color: "var(--text-3)" }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      </div>
    </div>
  );
}

function MedidaFormModal({
  unitId,
  employees,
  initialEmployeeId,
  onClose,
}: {
  unitId: string;
  employees: EmployeeStub[];
  initialEmployeeId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [empId, setEmpId] = useState(initialEmployeeId ?? "");
  const [medida, setMedida] = useState<string>("Advertência escrita");
  const [motivo, setMotivo] = useState("");
  const [dataOcorrencia, setDataOcorrencia] = useState(() => new Date().toISOString().split("T")[0] ?? "");
  const [gestor, setGestor] = useState("");
  const [assinou, setAssinou] = useState(false);
  const [testemunha, setTestemunha] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [reincidenciaOverride, setReincidenciaOverride] = useState<"auto" | "sim" | "nao">("auto");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empId) { setError("Selecione o colaborador."); return; }
    if (!motivo.trim()) { setError("Informe o motivo."); return; }
    setError(null);

    startTransition(async () => {
      const result = await createDisciplinaryAction({
        unit_id: unitId,
        employee_id: empId,
        medida,
        motivo: motivo.trim(),
        data_ocorrencia: dataOcorrencia,
        gestor: gestor.trim(),
        assinou,
        testemunha: testemunha.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        reincidencia_override:
          reincidenciaOverride === "auto" ? null
          : reincidenciaOverride === "sim" ? true : false,
      });
      if (!result.ok) { setError(result.error); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", padding: 16 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Nova Medida Disciplinar</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Colaborador */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Colaborador *</label>
            <Select value={empId} onValueChange={(v) => setEmpId(v ?? "")}>
              <SelectTrigger style={{ fontSize: 12 }}>
                <SelectValue placeholder="Selecionar colaborador…" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.nome} {emp.sobrenome}
                    {emp.funcao ? ` — ${emp.funcao}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Medida */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Medida *</label>
            <Select value={medida} onValueChange={(v) => setMedida(v ?? "Advertência escrita")}>
              <SelectTrigger style={{ fontSize: 12 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIDA_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motivo */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Motivo *</label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da medida disciplinar…"
              rows={3}
              style={{ fontSize: 12 }}
            />
          </div>

          {/* Data + Gestor */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Data da ocorrência *</label>
              <Input type="date" value={dataOcorrencia} onChange={(e) => setDataOcorrencia(e.target.value)} style={{ fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Gestor responsável</label>
              <Input value={gestor} onChange={(e) => setGestor(e.target.value)} placeholder="Nome do gestor" style={{ fontSize: 12 }} />
            </div>
          </div>

          {/* Testemunha */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Testemunha</label>
            <Input value={testemunha} onChange={(e) => setTestemunha(e.target.value)} placeholder="Nome da testemunha (opcional)" style={{ fontSize: 12 }} />
          </div>

          {/* Assinou + Reincidência */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignItems: "start" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Colaborador assinou?</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                <input type="checkbox" checked={assinou} onChange={(e) => setAssinou(e.target.checked)} style={{ width: 14, height: 14 }} />
                Sim, assinou o documento
              </label>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Reincidência</label>
              <Select value={reincidenciaOverride} onValueChange={(v) => setReincidenciaOverride((v ?? "auto") as "auto" | "sim" | "nao")}>
                <SelectTrigger style={{ fontSize: 12 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (sistema calcula)</SelectItem>
                  <SelectItem value="sim">Forçar: Sim</SelectItem>
                  <SelectItem value="nao">Forçar: Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 4 }}>Observações internas</label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais (não aparecem no documento)…"
              rows={2}
              style={{ fontSize: 12 }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#B91C1C", background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: 6 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Registrar medida"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DKpiCard({
  icon,
  label,
  value,
  highlight,
  highlightColor = "yellow",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
  highlightColor?: "yellow" | "red";
}) {
  const bg = highlight
    ? highlightColor === "red" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.14)"
    : "var(--brand-soft)";
  const fg = highlight
    ? highlightColor === "red" ? "#B91C1C" : "#A16207"
    : "var(--brand)";
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 99, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

const emptyTd: React.CSSProperties = {
  textAlign: "center",
  padding: "32px 16px",
  color: "var(--text-3)",
  fontSize: 12,
};
