"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kph/ui/table";
import type { ScoreEvent } from "@kph/db/types/pessoas";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const TIPO_LABEL: Record<string, string> = {
  pontualidade: "Pontualidade",
  ausencia: "Ausência",
  advertencia: "Advertência",
  elogio: "Elogio",
  avaliacao: "Avaliação",
  bonus: "Bônus",
  penalidade: "Penalidade",
  ajuste: "Ajuste",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontWeight: 700,
          fontSize: 12,
          color: "#16A34A",
          background: "#DCFCE7",
          padding: "2px 8px",
          borderRadius: 999,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <TrendingUp size={11} />+{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontWeight: 700,
          fontSize: 12,
          color: "#DC2626",
          background: "#FEE2E2",
          padding: "2px 8px",
          borderRadius: 999,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <TrendingDown size={11} />{delta}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontWeight: 700,
        fontSize: 12,
        color: "var(--text-3)",
        background: "var(--surface)",
        padding: "2px 8px",
        borderRadius: 999,
      }}
    >
      <Minus size={11} />0
    </span>
  );
}

export function DisciplinaTab({
  records,
}: {
  records: ScoreEvent[];
}) {
  if (records.length === 0) {
    return (
      <EmptyState>
        Sem eventos de disciplina ou score registrados para este colaborador.
      </EmptyState>
    );
  }

  // Calcula saldo total
  const saldoTotal = records.reduce((acc, r) => acc + (r.delta ?? 0), 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
          {records.length} evento{records.length !== 1 ? "s" : ""} registrado{records.length !== 1 ? "s" : ""}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 8,
            background: saldoTotal >= 0 ? "#DCFCE722" : "#FEE2E222",
            border: `1px solid ${saldoTotal >= 0 ? "#16A34A44" : "#DC262644"}`,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Saldo total</span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: saldoTotal >= 0 ? "#16A34A" : "#DC2626",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {saldoTotal >= 0 ? `+${saldoTotal}` : saldoTotal} pts
          </span>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Delta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((ev) => (
            <TableRow key={ev.id}>
              <TableCell
                style={{
                  fontSize: 12,
                  color: "var(--text-3)",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(ev.created_at)}
              </TableCell>
              <TableCell>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text)",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  {TIPO_LABEL[ev.tipo] ?? ev.tipo}
                </span>
              </TableCell>
              <TableCell style={{ fontSize: 12, color: "var(--text-2)" }}>
                {ev.descricao || "—"}
              </TableCell>
              <TableCell className="text-right">
                <DeltaBadge delta={ev.delta ?? 0} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px 20px",
        color: "var(--text-3)",
        fontSize: 13,
        background: "var(--surface)",
        border: "1px dashed var(--border)",
        borderRadius: 8,
      }}
    >
      {children}
    </div>
  );
}
