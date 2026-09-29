"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  format,
  isSameDay,
  parse,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Copy,
  GripVertical,
  Loader2,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@kph/ui/button";
import { Textarea } from "@kph/ui/textarea";
import { Label } from "@kph/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kph/ui/dialog";

import {
  clearAvailability,
  copyShiftsFromPreviousWeek,
  createShift,
  deleteShift,
  setAvailability,
  updateShift,
} from "@/lib/pessoas/actions";
import {
  ShiftDialog,
  emptyShiftForm,
  shiftToForm,
} from "@/components/pessoas/ShiftDialog";
import type { ShiftFormState } from "@/components/pessoas/ShiftDialog";
import { calculateLaborCost, hoursWorked } from "@/lib/pessoas/labor";
import { avatarColor, formatBRL, initials } from "@/lib/format";
import { SHIFT_AREAS } from "@kph/db/types/pessoas";
import type {
  Employee,
  EmployeeAvailability,
  Shift,
  ShiftArea,
  ShiftInsert,
} from "@kph/db/types/pessoas";

type Props = {
  unitId: string;
  unitName: string;
  employees: Employee[];
  shifts: Shift[];
  availability: EmployeeAvailability[];
  weekStartIso: string; // "YYYY-MM-DD" (domingo)
};

type ModalState =
  | { open: false }
  | { open: true; mode: "create"; initial: ShiftFormState }
  | { open: true; mode: "edit"; shift: Shift; initial: ShiftFormState };

type AvailModalState =
  | { open: false }
  | {
      open: true;
      employeeId: string;
      employeeName: string;
      data: string;
      current: EmployeeAvailability | null;
    };

type AreaTab = "Todas" | ShiftArea;

export function EscalaGrid({
  unitId,
  unitName,
  employees,
  shifts: initialShifts,
  availability: initialAvail,
  weekStartIso,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [avail, setAvail] = useState<EmployeeAvailability[]>(initialAvail);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [availModal, setAvailModal] = useState<AvailModalState>({ open: false });
  const [pendingShiftId, setPendingShiftId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [conflictKey, setConflictKey] = useState<string | null>(null);
  const [activeArea, setActiveArea] = useState<AreaTab>("Todas");

  // weekStartIso é usado como key no parent — trocar de semana remonta
  // o componente, então não precisamos sincronizar shifts via effect.

  const weekStart = parse(weekStartIso, "yyyy-MM-dd", new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const employeeById = useMemo(() => {
    const m = new Map<string, Employee>();
    for (const e of employees) m.set(e.id, e);
    return m;
  }, [employees]);

  // M1 — turnos da área ativa (em "Todas", todos).
  const areaShifts = useMemo(
    () => (activeArea === "Todas" ? shifts : shifts.filter((s) => s.area === activeArea)),
    [shifts, activeArea],
  );

  // M1 — numa área específica, só mostra colaboradores com turno nela.
  const visibleEmployees = useMemo(() => {
    if (activeArea === "Todas") return employees;
    const ids = new Set(areaShifts.map((s) => s.employee_id));
    return employees.filter((e) => ids.has(e.id));
  }, [activeArea, employees, areaShifts]);

  const shiftsByCell = useMemo(() => {
    const m = new Map<string, Shift[]>();
    for (const s of areaShifts) {
      const key = cellKey(s.employee_id, s.data);
      const arr = m.get(key) ?? [];
      arr.push(s);
      m.set(key, arr);
    }
    return m;
  }, [areaShifts]);

  // M4 — disponibilidade por célula (só marcações de indisponível interessam aqui).
  const availByCell = useMemo(() => {
    const m = new Map<string, EmployeeAvailability>();
    for (const a of avail) {
      if (!a.disponivel) m.set(cellKey(a.employee_id, a.data), a);
    }
    return m;
  }, [avail]);

  // Contagem de turnos por área (badge nas tabs).
  const areaCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of shifts) {
      if (s.area) m.set(s.area, (m.get(s.area) ?? 0) + 1);
    }
    return m;
  }, [shifts]);

  // Totais por dia + semana + horas por colaborador. Custo vem do banco (M3).
  const totals = useMemo(() => {
    const perDay = days.map(() => ({ horas: 0, custo: 0 }));
    const perEmployee = new Map<string, number>();
    let weekHoras = 0;
    let weekCusto = 0;
    const escaladosSet = new Set<string>();
    for (const s of areaShifts) {
      const emp = employeeById.get(s.employee_id);
      if (!emp) continue;
      if (s.tipo === "folga") continue;
      escaladosSet.add(s.employee_id);
      const horas = hoursWorked(s.hora_inicio, s.hora_fim);
      const custo = Number(s.labor_cost ?? 0) || 0; // M3 — persistido server-side
      const dayIdx = days.findIndex((d) => isSameDay(d, parseISO(s.data)));
      if (dayIdx >= 0) {
        const cell = perDay[dayIdx];
        if (cell) {
          cell.horas += horas;
          cell.custo += custo;
        }
      }
      weekHoras += horas;
      weekCusto += custo;
      perEmployee.set(
        s.employee_id,
        (perEmployee.get(s.employee_id) ?? 0) + horas,
      );
    }
    const heRiskIds = new Set<string>();
    for (const [empId, h] of perEmployee.entries()) {
      if (h > 44) heRiskIds.add(empId);
    }
    return {
      perDay,
      weekHoras,
      weekCusto,
      escalados: escaladosSet.size,
      heRisk: heRiskIds.size,
      heRiskIds,
      perEmployee,
    };
  }, [areaShifts, days, employeeById]);

  const navigateWeek = (offsetDays: number) => {
    const next = format(addDays(weekStart, offsetDays), "yyyy-MM-dd");
    router.push(`/pessoas/escala?inicio=${next}`);
  };

  const goToday = () => {
    const today = startOfWeek(new Date(), { weekStartsOn: 0 });
    router.push(`/pessoas/escala?inicio=${format(today, "yyyy-MM-dd")}`);
  };

  // M5 — pisca a célula em vermelho ao detectar conflito.
  const flashConflict = (key: string) => {
    setConflictKey(key);
    setTimeout(() => setConflictKey((k) => (k === key ? null : k)), 1200);
  };

  const openCreate = (employeeId: string, data: string) => {
    setModal({
      open: true,
      mode: "create",
      initial: emptyShiftForm(
        employeeId,
        data,
        activeArea === "Todas" ? "" : activeArea,
      ),
    });
  };

  const openEdit = (shift: Shift) => {
    setModal({ open: true, mode: "edit", shift, initial: shiftToForm(shift) });
  };

  const closeModal = () => setModal({ open: false });

  const handleSave = (form: ShiftFormState) => {
    const emp = employeeById.get(form.employeeId);
    if (!emp) return;
    const labor = calculateLaborCost(emp.salario_base, form.horaInicio, form.horaFim);
    const horaInicioSec = `${form.horaInicio}:00`;
    const horaFimSec = `${form.horaFim}:00`;

    if (modal.open && modal.mode === "edit") {
      const id = modal.shift.id;
      setPendingShiftId(id);
      setShifts((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                employee_id: form.employeeId,
                data: form.data,
                hora_inicio: horaInicioSec,
                hora_fim: horaFimSec,
                tipo: form.tipo,
                area: form.area,
                observacao: form.observacao || null,
                labor_cost: labor.toFixed(2),
              }
            : s,
        ),
      );
      closeModal();
      startTransition(async () => {
        const res = await updateShift(id, {
          employee_id: form.employeeId,
          data: form.data,
          hora_inicio: horaInicioSec,
          hora_fim: horaFimSec,
          tipo: form.tipo,
          area: form.area,
          observacao: form.observacao || null,
        } as never);
        setPendingShiftId(null);
        if (!res.ok) {
          if (res.conflict) {
            toast.error(res.error);
            flashConflict(cellKey(form.employeeId, form.data));
          } else {
            toast.error(`Falha ao salvar turno: ${res.error}`);
          }
          router.refresh();
          return;
        }
        // Usa o turno autoritativo do banco (custo já calculado server-side).
        setShifts((prev) => prev.map((s) => (s.id === id ? res.data : s)));
        if (res.warning) toast.warning(res.warning);
      });
      return;
    }

    // Create
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Shift = {
      id: optimisticId,
      employee_id: form.employeeId,
      unit_id: unitId,
      data: form.data,
      hora_inicio: horaInicioSec,
      hora_fim: horaFimSec,
      tipo: form.tipo,
      area: form.area,
      labor_cost: labor.toFixed(2),
      observacao: form.observacao || null,
      created_at: new Date().toISOString(),
    };
    setShifts((prev) => [...prev, optimistic]);
    closeModal();
    startTransition(async () => {
      const payload: ShiftInsert = {
        employee_id: form.employeeId,
        unit_id: unitId,
        data: form.data,
        hora_inicio: horaInicioSec,
        hora_fim: horaFimSec,
        tipo: form.tipo,
        area: form.area,
        observacao: form.observacao || null,
      };
      const res = await createShift(payload);
      if (!res.ok) {
        setShifts((prev) => prev.filter((s) => s.id !== optimisticId));
        if (res.conflict) {
          toast.error(res.error);
          flashConflict(cellKey(form.employeeId, form.data));
        } else {
          toast.error(`Falha ao criar turno: ${res.error}`);
        }
        return;
      }
      setShifts((prev) => prev.map((s) => (s.id === optimisticId ? res.data : s)));
      if (res.warning) toast.warning(res.warning);
    });
  };

  const handleDelete = () => {
    if (!modal.open || modal.mode !== "edit") return;
    const id = modal.shift.id;
    if (!window.confirm("Excluir este turno? Ação não pode ser desfeita.")) return;
    setPendingShiftId(id);
    setShifts((prev) => prev.filter((s) => s.id !== id));
    closeModal();
    startTransition(async () => {
      const res = await deleteShift(id);
      setPendingShiftId(null);
      if (!res.ok) {
        toast.error(`Falha ao excluir turno: ${res.error}`);
        router.refresh();
      }
    });
  };

  // Drag and drop — mover turno de uma célula pra outra.
  const handleDragStart = (e: React.DragEvent, shift: Shift) => {
    e.dataTransfer.setData("application/x-shift-id", shift.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverKey !== key) setDragOverKey(key);
  };

  const handleDragLeave = (key: string) => {
    if (dragOverKey === key) setDragOverKey(null);
  };

  const handleDrop = (e: React.DragEvent, employeeId: string, data: string) => {
    e.preventDefault();
    setDragOverKey(null);
    const shiftId = e.dataTransfer.getData("application/x-shift-id");
    if (!shiftId) return;
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;
    if (shift.employee_id === employeeId && shift.data === data) return;
    const emp = employeeById.get(employeeId);
    if (!emp) return;

    const prevSnapshot = shift;
    const labor = calculateLaborCost(emp.salario_base, shift.hora_inicio, shift.hora_fim);
    setPendingShiftId(shift.id);
    setShifts((prev) =>
      prev.map((s) =>
        s.id === shiftId
          ? { ...s, employee_id: employeeId, data, labor_cost: labor.toFixed(2) }
          : s,
      ),
    );
    startTransition(async () => {
      const res = await updateShift(shift.id, {
        employee_id: employeeId,
        data,
      } as never);
      setPendingShiftId(null);
      if (!res.ok) {
        // Reverte o movimento otimista.
        setShifts((prev) => prev.map((s) => (s.id === shiftId ? prevSnapshot : s)));
        if (res.conflict) {
          toast.error(res.error);
          flashConflict(cellKey(employeeId, data));
        } else {
          toast.error(`Falha ao mover turno: ${res.error}`);
          router.refresh();
        }
        return;
      }
      setShifts((prev) => prev.map((s) => (s.id === shiftId ? res.data : s)));
      if (res.warning) toast.warning(res.warning);
    });
  };

  // M4 — disponibilidade
  const openAvail = (employeeId: string, employeeName: string, data: string) => {
    setAvailModal({
      open: true,
      employeeId,
      employeeName,
      data,
      current: availByCell.get(cellKey(employeeId, data)) ?? null,
    });
  };

  const handleMarkUnavailable = (motivo: string) => {
    if (!availModal.open) return;
    const { employeeId, data } = availModal;
    const optimistic: EmployeeAvailability = {
      id: availModal.current?.id ?? `opt-avail-${Date.now()}`,
      employee_id: employeeId,
      unit_id: unitId,
      data,
      disponivel: false,
      motivo: motivo || null,
      created_at: new Date().toISOString(),
    };
    setAvail((prev) => [
      ...prev.filter((a) => !(a.employee_id === employeeId && a.data === data)),
      optimistic,
    ]);
    setAvailModal({ open: false });
    startTransition(async () => {
      const res = await setAvailability({
        employee_id: employeeId,
        unit_id: unitId,
        data,
        disponivel: false,
        motivo: motivo || null,
      });
      if (!res.ok) {
        toast.error(`Falha ao marcar indisponibilidade: ${res.error}`);
        router.refresh();
        return;
      }
      setAvail((prev) => prev.map((a) => (a.id === optimistic.id ? res.data : a)));
    });
  };

  const handleClearUnavailable = () => {
    if (!availModal.open) return;
    const { employeeId, data } = availModal;
    setAvail((prev) =>
      prev.filter((a) => !(a.employee_id === employeeId && a.data === data)),
    );
    setAvailModal({ open: false });
    startTransition(async () => {
      const res = await clearAvailability(employeeId, data);
      if (!res.ok) {
        toast.error(`Falha ao remover marcação: ${res.error}`);
        router.refresh();
      }
    });
  };

  const rangeLabel = `${format(weekStart, "d MMM", { locale: ptBR })} — ${format(
    addDays(weekStart, 6),
    "d MMM",
    { locale: ptBR },
  )}`;

  // Copiar semana anterior
  const [copying, setCopying] = useState(false);
  function handleCopyWeek() {
    if (
      !window.confirm(
        "Copiar todos os turnos da semana anterior? Turnos já existentes na semana atual serão preservados.",
      )
    )
      return;
    setCopying(true);
    startTransition(async () => {
      const r = await copyShiftsFromPreviousWeek(unitId, weekStartIso);
      setCopying(false);
      if (!r.ok) {
        toast.error(`Falha ao copiar: ${r.error}`);
        return;
      }
      toast.success(
        `Copiados ${r.data.copied} turno(s)${
          r.data.skipped > 0 ? ` · ${r.data.skipped} pulados (já existiam)` : ""
        }.`,
      );
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* M1 — Tabs de área */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: 4,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
        }}
      >
        {(["Todas", ...SHIFT_AREAS] as AreaTab[]).map((tab) => {
          const isActive = activeArea === tab;
          const count = tab === "Todas" ? shifts.length : areaCounts.get(tab) ?? 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveArea(tab)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? "var(--primary-foreground)" : "var(--text-2)",
                background: isActive ? "var(--brand)" : "transparent",
                border: "1px solid",
                borderColor: isActive ? "var(--brand)" : "var(--border)",
                borderRadius: 7,
                cursor: "pointer",
                transition: "background var(--t), color var(--t)",
              }}
            >
              {tab}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 99,
                  background: isActive
                    ? "rgba(255,255,255,0.22)"
                    : "var(--surface-2, var(--muted))",
                  color: isActive ? "#fff" : "var(--text-3)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <KpiCard
          label="Escalados na semana"
          value={String(totals.escalados)}
          hint={
            activeArea === "Todas"
              ? `de ${employees.length} ativos`
              : `na área ${activeArea}`
          }
          icon={<Users size={12} />}
        />
        <KpiCard
          label="Custo estimado semana"
          value={formatBRL(totals.weekCusto)}
          hint={`${totals.weekHoras.toFixed(1)}h planejadas`}
          icon={<TrendingUp size={12} />}
          tone="brand"
        />
        <KpiCard
          label="Risco de hora extra"
          value={String(totals.heRisk)}
          hint="colaboradores acima de 44h"
          icon={<AlertTriangle size={12} />}
          tone={totals.heRisk > 0 ? "warn" : "ok"}
        />
      </div>

      {/* Toolbar: navegação + totais */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 14px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-7)}>
            <ChevronLeft className="h-4 w-4" />
            Semana
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            <CalendarDays className="mr-2 h-3.5 w-3.5" />
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(7)}>
            Semana
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyWeek}
            disabled={copying}
            title="Duplica turnos da semana anterior pra esta semana"
          >
            {copying ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="mr-2 h-3.5 w-3.5" />
            )}
            Copiar semana anterior
          </Button>
          <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
            <span
              style={{
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 700,
                background: "var(--brand)",
                color: "var(--primary-foreground)",
                display: "inline-block",
                cursor: "default",
              }}
            >
              Semana
            </span>
            <a
              href={`/pessoas/escala?view=mes&mes=${weekStartIso.slice(0, 7)}`}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: "transparent",
                color: "var(--text-2)",
                textDecoration: "none",
                display: "inline-block",
                transition: "background var(--t)",
              }}
            >
              Mês
            </a>
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              marginLeft: 8,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {rangeLabel}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>· {unitName}</span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 18,
            fontSize: 12,
            color: "var(--text-2)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>
            <span style={{ color: "var(--text-3)" }}>Horas semana:</span>{" "}
            <span style={{ color: "var(--text)", fontWeight: 600 }}>
              {totals.weekHoras.toFixed(1)}h
            </span>
          </span>
          <span>
            <span style={{ color: "var(--text-3)" }}>Custo semana:</span>{" "}
            <span style={{ color: "var(--brand)", fontWeight: 700 }}>
              {formatBRL(totals.weekCusto)}
            </span>
          </span>
        </div>
      </div>

      {/* Grade */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "var(--surface)",
          overflow: "hidden",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(200px, 220px) repeat(7, minmax(120px, 1fr))",
            minWidth: 1080,
          }}
        >
          {/* Header row */}
          <div
            style={{
              padding: "10px 14px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "var(--text-3)",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-2, var(--surface))",
            }}
          >
            Colaborador
          </div>
          {days.map((d, i) => {
            const isToday = isSameDay(d, new Date());
            return (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border)",
                  borderLeft: "1px solid var(--border)",
                  background: "var(--surface-2, var(--surface))",
                  fontSize: 11,
                  color: isToday ? "var(--brand)" : "var(--text-3)",
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                <span style={{ textTransform: "uppercase" }}>
                  {format(d, "EEE", { locale: ptBR })}
                </span>{" "}
                <span
                  style={{
                    color: isToday ? "var(--brand)" : "var(--text)",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {format(d, "d")}
                </span>
              </div>
            );
          })}

          {/* Linhas */}
          {visibleEmployees.length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "40px 16px",
                textAlign: "center",
                fontSize: 12,
                color: "var(--text-3)",
                borderTop: "1px solid var(--border)",
              }}
            >
              Nenhum colaborador com turno na área {activeArea === "Todas" ? "" : activeArea}.
              Use a aba <strong>Todas</strong> pra escalar e definir a área no turno.
            </div>
          ) : (
            visibleEmployees.map((emp) => (
              <EmployeeRow
                key={emp.id}
                employee={emp}
                days={days}
                shiftsByCell={shiftsByCell}
                availByCell={availByCell}
                dragOverKey={dragOverKey}
                conflictKey={conflictKey}
                pendingShiftId={pendingShiftId}
                weekHours={totals.perEmployee.get(emp.id) ?? 0}
                heRisk={totals.heRiskIds.has(emp.id)}
                showArea={activeArea === "Todas"}
                onCellClick={openCreate}
                onCellContext={openAvail}
                onShiftClick={openEdit}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />
            ))
          )}

          {/* Footer: totais por dia */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: "2px solid var(--border)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "var(--text-3)",
              background: "var(--surface-2, var(--surface))",
            }}
          >
            Totais
          </div>
          {totals.perDay.map((t, i) => (
            <div
              key={i}
              style={{
                padding: "10px 12px",
                borderTop: "2px solid var(--border)",
                borderLeft: "1px solid var(--border)",
                background: "var(--surface-2, var(--surface))",
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span style={{ color: "var(--text)", fontWeight: 600 }}>
                {t.horas.toFixed(1)}h
              </span>
              <span style={{ color: t.custo > 0 ? "var(--brand)" : "var(--text-3)" }}>
                {t.custo > 0 ? formatBRL(t.custo) : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
        Clique numa célula vazia pra escalar · clique com o botão direito pra marcar
        indisponibilidade.
      </p>

      {/* Modal de turno */}
      {modal.open && (
        <ShiftDialog
          key={modal.mode === "edit" ? modal.shift.id : `new-${modal.initial.employeeId}-${modal.initial.data}`}
          isEdit={modal.mode === "edit"}
          initial={modal.initial}
          employees={employees}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* M4 — Modal de disponibilidade */}
      {availModal.open && (
        <AvailabilityModal
          state={availModal}
          onClose={() => setAvailModal({ open: false })}
          onMark={handleMarkUnavailable}
          onClear={handleClearUnavailable}
        />
      )}
    </div>
  );
}

function EmployeeRow({
  employee,
  days,
  shiftsByCell,
  availByCell,
  dragOverKey,
  conflictKey,
  pendingShiftId,
  weekHours,
  heRisk,
  showArea,
  onCellClick,
  onCellContext,
  onShiftClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  employee: Employee;
  days: Date[];
  shiftsByCell: Map<string, Shift[]>;
  availByCell: Map<string, EmployeeAvailability>;
  dragOverKey: string | null;
  conflictKey: string | null;
  pendingShiftId: string | null;
  weekHours: number;
  heRisk: boolean;
  showArea: boolean;
  onCellClick: (employeeId: string, data: string) => void;
  onCellContext: (employeeId: string, employeeName: string, data: string) => void;
  onShiftClick: (shift: Shift) => void;
  onDragStart: (e: React.DragEvent, shift: Shift) => void;
  onDragOver: (e: React.DragEvent, key: string) => void;
  onDragLeave: (key: string) => void;
  onDrop: (e: React.DragEvent, employeeId: string, data: string) => void;
}) {
  const fullName = `${employee.nome} ${employee.sobrenome}`.trim();
  const color = avatarColor(fullName);
  const rowTint = heRisk
    ? "color-mix(in srgb, #F59E0B 8%, var(--surface))"
    : "var(--surface)";

  return (
    <>
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 64,
          background: rowTint,
          position: "sticky",
          left: 0,
          zIndex: 1,
        }}
        title={heRisk ? `Risco de HE — ${weekHours.toFixed(1)}h planejadas (limite 44h)` : undefined}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 99,
            background: `color-mix(in srgb, ${color} 18%, transparent)`,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials(fullName)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {fullName}
            {heRisk && (
              <AlertTriangle
                size={11}
                style={{ color: "#A16207", flexShrink: 0 }}
                aria-label="Risco de HE"
              />
            )}
          </span>
          <span style={{ fontSize: 10, color: heRisk ? "#A16207" : "var(--text-3)" }}>
            {employee.funcao}
            {weekHours > 0 ? ` · ${weekHours.toFixed(1)}h` : ""}
          </span>
        </div>
      </div>
      {days.map((d, i) => {
        const dataIso = format(d, "yyyy-MM-dd");
        const key = cellKey(employee.id, dataIso);
        const cellShifts = shiftsByCell.get(key) ?? [];
        const unavailable = availByCell.get(key);
        const isOver = dragOverKey === key;
        const isConflict = conflictKey === key;
        const bg = isOver
          ? "color-mix(in srgb, var(--brand) 10%, transparent)"
          : unavailable
          ? "color-mix(in srgb, #F59E0B 16%, var(--surface))"
          : "transparent";
        return (
          <div
            key={i}
            onClick={() => cellShifts.length === 0 && onCellClick(employee.id, dataIso)}
            onContextMenu={(e) => {
              e.preventDefault();
              onCellContext(employee.id, fullName, dataIso);
            }}
            onDragOver={(e) => onDragOver(e, key)}
            onDragLeave={() => onDragLeave(key)}
            onDrop={(e) => onDrop(e, employee.id, dataIso)}
            title={unavailable ? `Indisponível${unavailable.motivo ? `: ${unavailable.motivo}` : ""}` : undefined}
            style={{
              padding: 6,
              borderTop: "1px solid var(--border)",
              borderLeft: "1px solid var(--border)",
              minHeight: 64,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              cursor: cellShifts.length === 0 ? "pointer" : "default",
              background: bg,
              transition: "background var(--t)",
              position: "relative",
              outline: isConflict ? "2px solid var(--destructive)" : undefined,
              outlineOffset: isConflict ? "-2px" : undefined,
              animation: isConflict ? "escala-blink 0.3s ease-in-out 3" : undefined,
            }}
            className="escala-cell"
          >
            {unavailable && cellShifts.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  color: "#B45309",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <CalendarOff size={12} />
              </div>
            )}
            {cellShifts.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-3)",
                  opacity: 0,
                  transition: "opacity var(--t)",
                }}
                className="escala-cell-add"
              >
                <Plus size={14} />
              </div>
            ) : (
              cellShifts.map((s) => (
                <ShiftPill
                  key={s.id}
                  shift={s}
                  funcao={employee.funcao}
                  showArea={showArea}
                  pending={pendingShiftId === s.id}
                  onClick={() => onShiftClick(s)}
                  onDragStart={(e) => onDragStart(e, s)}
                />
              ))
            )}
          </div>
        );
      })}
      <style>{`
        .escala-cell:hover .escala-cell-add { opacity: 0.7; }
        @keyframes escala-blink {
          0%, 100% { background: transparent; }
          50% { background: color-mix(in srgb, var(--destructive) 18%, transparent); }
        }
      `}</style>
    </>
  );
}

function ShiftPill({
  shift,
  funcao,
  showArea,
  pending,
  onClick,
  onDragStart,
}: {
  shift: Shift;
  funcao: string;
  showArea: boolean;
  pending: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const color = funcaoColor(funcao);
  const isFolga = shift.tipo === "folga";
  const horaIni = shift.hora_inicio.slice(0, 5);
  const horaFim = shift.hora_fim.slice(0, 5);
  const label = isFolga ? "Folga" : `${formatHora(horaIni)}–${formatHora(horaFim)}`;

  return (
    <div
      draggable={!pending}
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "5px 7px",
        borderRadius: 6,
        background: isFolga ? "var(--muted)" : color.bg,
        color: isFolga ? "var(--muted-foreground)" : color.fg,
        fontSize: 11,
        fontWeight: 600,
        cursor: pending ? "wait" : "grab",
        opacity: pending ? 0.6 : 1,
        userSelect: "none",
        fontVariantNumeric: "tabular-nums",
        position: "relative",
        border: `1px solid ${isFolga ? "var(--border)" : color.border}`,
      }}
      title={shift.observacao || label}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <GripVertical
          size={11}
          style={{ opacity: 0.4, flexShrink: 0, cursor: "grab" }}
        />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {shift.tipo === "extra" && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              background: "rgba(0,0,0,0.12)",
              padding: "1px 4px",
              borderRadius: 4,
              marginLeft: "auto",
            }}
          >
            EXTRA
          </span>
        )}
      </div>
      {showArea && shift.area && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            padding: "1px 5px",
            borderRadius: 4,
            background: "rgba(0,0,0,0.10)",
            alignSelf: "flex-start",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {shift.area}
        </span>
      )}
    </div>
  );
}

function AvailabilityModal({
  state,
  onClose,
  onMark,
  onClear,
}: {
  state: Extract<AvailModalState, { open: true }>;
  onClose: () => void;
  onMark: (motivo: string) => void;
  onClear: () => void;
}) {
  const [motivo, setMotivo] = useState(state.current?.motivo ?? "");
  const dateLabel = format(parseISO(state.data), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disponibilidade</DialogTitle>
          <DialogDescription style={{ textTransform: "capitalize" }}>
            {state.employeeName} · {dateLabel}
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Label
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}
          >
            Motivo (opcional)
          </Label>
          <Textarea
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Consulta médica, folga solicitada, etc."
          />
          <p style={{ fontSize: 11, color: "var(--text-3)", margin: 0 }}>
            Marca o colaborador como indisponível neste dia — a célula fica em âmbar.
            Em breve o próprio colaborador marca pelo HOS APP.
          </p>
        </div>

        <DialogFooter>
          {state.current && (
            <button
              type="button"
              onClick={onClear}
              style={{
                marginRight: "auto",
                fontSize: 13,
                color: "var(--text-2)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              Remover marcação
            </button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onMark(motivo)}>
            <CalendarOff className="mr-2 h-4 w-4" />
            Marcar indisponível
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "brand";
}) {
  const fg =
    tone === "warn"
      ? "#A16207"
      : tone === "ok"
      ? "#15803D"
      : tone === "brand"
      ? "var(--brand)"
      : "var(--text)";
  const bg =
    tone === "warn"
      ? "color-mix(in srgb, #F59E0B 6%, var(--surface))"
      : "var(--surface)";
  return (
    <div
      style={{
        background: bg,
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: 0.6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: fg,
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ---------- Helpers locais ----------

function cellKey(employeeId: string, dataIso: string): string {
  return `${employeeId}|${dataIso}`;
}

function formatHora(hhmm: string): string {
  const [hRaw, m] = hhmm.split(":");
  const h = hRaw ?? "00";
  if (m === "00") return `${Number(h)}h`;
  return `${h}:${m}h`;
}

function funcaoColor(funcao: string): {
  bg: string;
  fg: string;
  border: string;
} {
  const f = funcao.toLowerCase();
  if (f.includes("cozinh") || f.includes("chef")) {
    return {
      bg: "color-mix(in srgb, #F59E0B 16%, transparent)",
      fg: "#B45309",
      border: "color-mix(in srgb, #F59E0B 30%, transparent)",
    };
  }
  if (
    f.includes("garç") ||
    f.includes("garc") ||
    f.includes("salão") ||
    f.includes("salao") ||
    f.includes("atendent")
  ) {
    return {
      bg: "color-mix(in srgb, #3B82F6 14%, transparent)",
      fg: "#1D4ED8",
      border: "color-mix(in srgb, #3B82F6 28%, transparent)",
    };
  }
  if (f.includes("host") || f.includes("recep")) {
    return {
      bg: "color-mix(in srgb, #A855F7 14%, transparent)",
      fg: "#6D28D9",
      border: "color-mix(in srgb, #A855F7 28%, transparent)",
    };
  }
  return {
    bg: "var(--muted)",
    fg: "var(--text)",
    border: "var(--border)",
  };
}
