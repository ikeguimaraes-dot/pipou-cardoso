"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kph/ui/table";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { Payslip } from "@kph/db/types/pessoas";
import { FileText } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aprovado: "Aprovado",
  pago: "Pago",
};

const STATUS_COLOR: Record<string, string> = {
  rascunho: "var(--text-3)",
  aprovado: "#16A34A",
  pago: "var(--brand-secondary)",
};

export function HoleritesTab({
  records,
}: {
  records: Payslip[];
}) {
  if (records.length === 0) {
    return (
      <EmptyState>Nenhum holerite encontrado para este colaborador.</EmptyState>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Competência</TableHead>
          <TableHead className="text-right">Salário base</TableHead>
          <TableHead className="text-right">H. extras</TableHead>
          <TableHead className="text-right">Gorjeta</TableHead>
          <TableHead className="text-right">Descontos</TableHead>
          <TableHead className="text-right">Líquido</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((p) => {
          const totalDescontos =
            Number(p.desconto_inss) +
            Number(p.desconto_irrf) +
            Number(p.desconto_vale_transporte) +
            Number(p.desconto_vale_refeicao) +
            Number(p.outros_descontos);
          const statusColor = STATUS_COLOR[p.status] ?? "var(--text-3)";
          return (
            <TableRow key={p.id}>
              <TableCell style={{ fontWeight: 600 }}>
                {formatDateBR(p.competencia)}
              </TableCell>
              <TableCell className="text-right">
                {formatBRL(Number(p.salario_base))}
              </TableCell>
              <TableCell className="text-right" style={{ color: "#16A34A" }}>
                {Number(p.horas_extras) > 0 ? formatBRL(Number(p.horas_extras)) : "—"}
              </TableCell>
              <TableCell className="text-right" style={{ color: "var(--brand-secondary)" }}>
                {Number(p.gorjeta) > 0 ? formatBRL(Number(p.gorjeta)) : "—"}
              </TableCell>
              <TableCell className="text-right" style={{ color: "var(--destructive)" }}>
                {totalDescontos > 0 ? `− ${formatBRL(totalDescontos)}` : "—"}
              </TableCell>
              <TableCell
                className="text-right"
                style={{ fontWeight: 700, color: "var(--brand-secondary)" }}
              >
                {formatBRL(Number(p.liquido))}
              </TableCell>
              <TableCell>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: statusColor,
                    background: statusColor + "18",
                    padding: "2px 8px",
                    borderRadius: 999,
                  }}
                >
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </TableCell>
              <TableCell>
                {p.pdf_url ? (
                  // LGPD: acessa PDF via rota autenticada — não expõe pdf_url direto ao cliente.
                  <a
                    href={`/pessoas/api/holerites/pdf?id=${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      color: "var(--brand-secondary)",
                      textDecoration: "none",
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <FileText size={12} />
                    PDF
                  </a>
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
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
