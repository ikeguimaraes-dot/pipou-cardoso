"use client";

import { CalendarDays, CalendarCheck, Clock, X } from "lucide-react";
import type { VacationSchedule, VacationScheduleStatus } from "@kph/db/types/pessoas";

const STATUS_CONFIG: Record<VacationScheduleStatus, { label: string; bg: string; fg: string; icon: React.ReactNode }> = {
  agendado: { label: "Agendado", bg: "rgba(59,130,246,0.12)", fg: "#1D4ED8", icon: <Clock size={12} /> },
  em_curso: { label: "Em curso", bg: "rgba(245,158,11,0.12)", fg: "#A16207", icon: <CalendarDays size={12} /> },
  concluido: { label: "Concluído", bg: "rgba(34,197,94,0.12)", fg: "#15803D", icon: <CalendarCheck size={12} /> },
  cancelado: { label: "Cancelado", bg: "rgba(239,68,68,0.12)", fg: "#B91C1C", icon: <X size={12} /> },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function diasAte(isoInicio: string | null): string {
  if (!isoInicio) return "";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(isoInicio + "T00:00:00");
  const diff = Math.round((inicio.getTime() - hoje.getTime()) / 86400000);
  if (diff < 0) return "";
  if (diff === 0) return "começa hoje";
  if (diff === 1) return "começa amanhã";
  return `em ${diff} dias`;
}

export function MinhasFerias({
  nome,
  vacations,
}: {
  nome: string;
  vacations: VacationSchedule[];
}) {
  if (vacations.length === 0) {
    return <EmptyState nome={nome} />;
  }

  const proxima = vacations.find(
    (v) => v.status === "agendado" || v.status === "em_curso"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Próximas férias destaque */}
      {proxima && (
        <div
          style={{
            background: "var(--brand-soft)",
            border: "1px solid color-mix(in srgb, var(--brand) 30%, transparent)",
            borderRadius: 12,
            padding: "18px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--brand)",
              color: "var(--primary-foreground)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CalendarDays size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--brand)", marginBottom: 4 }}>
              {proxima.status === "em_curso" ? "Férias em andamento" : "Próximas férias"}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
              {formatDate(proxima.data_inicio)} → {formatDate(proxima.data_fim)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, display: "flex", gap: 16 }}>
              <span>{proxima.total_dias ?? "—"} dias corridos</span>
              {proxima.data_retorno && <span>Retorno: {formatDate(proxima.data_retorno)}</span>}
              {proxima.status === "agendado" && (
                <span style={{ color: "var(--brand)", fontWeight: 600 }}>
                  {diasAte(proxima.data_inicio)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Histórico completo */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "var(--text-3)",
            marginBottom: 8,
          }}
        >
          Histórico
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          {vacations.map((v, idx) => {
            const status = (v.status as VacationScheduleStatus) ?? "agendado";
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.agendado;

            return (
              <div
                key={v.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderTop: idx === 0 ? "none" : "1px solid var(--border)",
                }}
              >
                {/* Período */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                    {formatDate(v.data_inicio)} → {formatDate(v.data_fim)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
                    {v.total_dias ?? "—"} dias
                    {v.data_retorno ? ` · retorno ${formatDate(v.data_retorno)}` : ""}
                  </div>
                </div>

                {/* Status badge */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 99,
                    flexShrink: 0,
                    background: cfg.bg,
                    color: cfg.fg,
                  }}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ nome }: { nome: string }) {
  return (
    <div
      style={{
        padding: "56px 28px",
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
          width: 48,
          height: 48,
          borderRadius: 99,
          background: "var(--brand-soft)",
          color: "var(--brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CalendarDays size={20} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
        Nenhuma férias agendada
      </div>
      <p style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 340, lineHeight: 1.55, margin: 0 }}>
        Olá, <strong style={{ color: "var(--text-2)" }}>{nome}</strong>. Suas férias aparecerão
        aqui quando forem agendadas pelo RH.
      </p>
    </div>
  );
}
