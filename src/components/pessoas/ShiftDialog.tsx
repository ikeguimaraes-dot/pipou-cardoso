"use client";

// Diálogo de turno compartilhado entre a view semana (EscalaGrid) e a view
// mês (EscalaMonthView). Inclui o campo Área obrigatório (Sprint Escala · M1).

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@kph/ui/button";
import { Input } from "@kph/ui/input";
import { Label } from "@kph/ui/label";
import { Textarea } from "@kph/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kph/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kph/ui/dialog";

import { calculateLaborCost, hoursWorked } from "@/lib/pessoas/labor";
import { formatBRL } from "@/lib/format";
import { SHIFT_AREAS } from "@kph/db/types/pessoas";
import type { Employee, Shift, ShiftTipo } from "@kph/db/types/pessoas";

export type ShiftFormState = {
  employeeId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: ShiftTipo;
  area: string; // "" até o gestor escolher — obrigatório pra salvar
  observacao: string;
};

export const TIPO_LABEL: Record<ShiftTipo, string> = {
  normal: "Normal",
  extra: "Extra",
  folga: "Folga",
  feriado: "Feriado",
};

/** Form vazio para criar turno num dia/colaborador. */
export function emptyShiftForm(
  employeeId: string,
  data: string,
  area = "",
): ShiftFormState {
  return {
    employeeId,
    data,
    horaInicio: "10:00",
    horaFim: "18:00",
    tipo: "normal",
    area,
    observacao: "",
  };
}

/** Form preenchido a partir de um turno existente (modo edição). */
export function shiftToForm(shift: Shift): ShiftFormState {
  return {
    employeeId: shift.employee_id,
    data: shift.data,
    horaInicio: shift.hora_inicio.slice(0, 5),
    horaFim: shift.hora_fim.slice(0, 5),
    tipo: (shift.tipo as ShiftTipo) ?? "normal",
    area: shift.area ?? "",
    observacao: shift.observacao ?? "",
  };
}

export function ShiftDialog({
  isEdit,
  initial,
  employees,
  onClose,
  onSave,
  onDelete,
}: {
  isEdit: boolean;
  initial: ShiftFormState;
  employees: Employee[];
  onClose: () => void;
  onSave: (form: ShiftFormState) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<ShiftFormState>(initial);

  const valid =
    form.employeeId &&
    form.data &&
    form.horaInicio &&
    form.horaFim &&
    form.tipo &&
    form.area; // área obrigatória (M1)

  return (
    <Dialog open={true} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar turno" : "Novo turno"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ajuste horário, área, tipo ou colaborador."
              : "Preencha o turno e o custo é calculado automaticamente."}
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Colaborador">
            <Select
              value={form.employeeId}
              onValueChange={(v) => v && setForm({ ...form, employeeId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nome} {e.sobrenome} · {e.funcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Field label="Data">
              <Input
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </Field>
            <Field label="Início">
              <Input
                type="time"
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
              />
            </Field>
            <Field label="Fim">
              <Input
                type="time"
                value={form.horaFim}
                onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Área">
              <Select
                value={form.area}
                onValueChange={(v) => v && setForm({ ...form, area: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área..." />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_AREAS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipo">
              <Select
                value={form.tipo}
                onValueChange={(v) => v && setForm({ ...form, tipo: v as ShiftTipo })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_LABEL) as ShiftTipo[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Observação (opcional)">
            <Textarea
              rows={2}
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
              placeholder="Cobertura de almoço, evento, etc."
            />
          </Field>

          <PreviewCost form={form} employees={employees} />
        </div>

        <DialogFooter>
          {isEdit && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className={buttonVariants({ variant: "ghost" })}
              style={{ color: "var(--destructive)", marginRight: "auto" }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!valid} onClick={() => valid && onSave(form)}>
            {isEdit ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Label
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--text-3)",
        }}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

function PreviewCost({
  form,
  employees,
}: {
  form: ShiftFormState;
  employees: Employee[];
}) {
  const emp = employees.find((e) => e.id === form.employeeId);
  if (!emp || form.tipo === "folga") return null;
  const horas = hoursWorked(form.horaInicio, form.horaFim);
  const custo = calculateLaborCost(emp.salario_base, form.horaInicio, form.horaFim);
  return (
    <div
      style={{
        marginTop: 4,
        padding: "10px 12px",
        borderRadius: 8,
        background: "var(--brand-soft)",
        border: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--text-2)" }}>
        <span style={{ color: "var(--text-3)" }}>Duração: </span>
        <strong style={{ color: "var(--text)" }}>{horas.toFixed(1)}h</strong>
      </div>
      <div style={{ color: "var(--text-2)" }}>
        <span style={{ color: "var(--text-3)" }}>Custo estimado: </span>
        <strong style={{ color: "var(--brand)" }}>{formatBRL(custo)}</strong>
      </div>
    </div>
  );
}
