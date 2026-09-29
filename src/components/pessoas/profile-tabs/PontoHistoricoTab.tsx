"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kph/ui/table";
import type { TimeClockPunch } from "@kph/db/types/pessoas";
import { CheckCircle, XCircle, Clock } from "lucide-react";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export function PontoHistoricoTab({
  records,
}: {
  records: TimeClockPunch[];
}) {
  if (records.length === 0) {
    return (
      <EmptyState>
        Nenhum registro de ponto encontrado para este colaborador.
      </EmptyState>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
        Últimos {records.length} registros
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Aprovado</TableHead>
            <TableHead>Selfie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((p) => (
            <TableRow key={p.id}>
              <TableCell style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatDate(p.timestamp_punch)}
              </TableCell>
              <TableCell style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {formatTime(p.timestamp_punch)}
              </TableCell>
              <TableCell>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    color: p.tipo === "entrada" ? "#16A34A" : "#DC2626",
                    background: p.tipo === "entrada" ? "#DCFCE7" : "#FEE2E2",
                  }}
                >
                  {p.tipo === "entrada" ? "Entrada" : "Saída"}
                </span>
              </TableCell>
              <TableCell style={{ fontSize: 11, color: "var(--text-3)" }}>
                {p.latitude != null && p.longitude != null
                  ? `${Number(p.latitude).toFixed(4)}, ${Number(p.longitude).toFixed(4)}`
                  : "—"}
              </TableCell>
              <TableCell>
                {p.aprovado === true ? (
                  <CheckCircle size={15} color="#16A34A" />
                ) : p.aprovado === false ? (
                  <XCircle size={15} color="#DC2626" />
                ) : (
                  <Clock size={15} color="var(--text-3)" />
                )}
              </TableCell>
              <TableCell>
                {p.device_info && p.device_info.startsWith("pontos/") ? (
                  <a
                    href={`/api/pessoas/ponto/foto?path=${encodeURIComponent(p.device_info)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11,
                      color: "var(--brand)",
                      textDecoration: "none",
                    }}
                  >
                    Ver
                  </a>
                ) : (
                  <span style={{ color: "var(--text-3)", fontSize: 11 }}>—</span>
                )}
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
