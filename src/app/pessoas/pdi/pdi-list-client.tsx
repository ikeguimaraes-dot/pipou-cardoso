"use client";

import Link from "next/link";
import type { PdiWithMetas, PdiStatus } from "./actions";

const STATUS_LABEL: Record<PdiStatus, string> = {
  ativo: "Ativo",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_COLOR: Record<PdiStatus, { fg: string; bg: string }> = {
  ativo:     { fg: "var(--brasa)", bg: "rgba(252,214,22,0.12)" },   // Brasa
  concluido: { fg: "#B8975A", bg: "rgba(184,151,90,0.12)" },  // Ouro
  cancelado: { fg: "#8A8278", bg: "var(--surface-2)" },        // Pedra
};

function progressoMedio(metas: PdiWithMetas["metas"]): number {
  if (metas.length === 0) return 0;
  return Math.round(metas.reduce((sum, m) => sum + m.progresso, 0) / metas.length);
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function PdiListClient({
  pdis,
  hasEmployee,
  page,
  totalPages,
  count,
}: {
  pdis: PdiWithMetas[];
  hasEmployee: boolean;
  page: number;
  totalPages: number;
  count: number;
}) {
  if (!hasEmployee) return null;

  if (pdis.length === 0) {
    return (
      <div
        style={{
          padding: "56px 24px",
          textAlign: "center",
          background: "var(--surface)",
          border: "1px dashed var(--border)",
          borderRadius: 12,
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "var(--brand-soft)", color: "var(--brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px", fontSize: 22,
        }}>
          🎯
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Seu plano de desenvolvimento começa aqui
        </div>
        <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 16px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
          Fale com seu gestor para criar o primeiro PDI, ou inicie você mesmo se tiver acesso.
        </p>
        <Link
          href="/pessoas/pdi/novo"
          style={{
            display: "inline-block", padding: "9px 20px", borderRadius: 8,
            background: "var(--brand)", color: "var(--primary-foreground)",
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}
        >
          Novo PDI
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pdis.map((pdi) => {
        const meta = STATUS_COLOR[pdi.status];
        const pct = progressoMedio(pdi.metas);
        const metasConcluidas = pdi.metas.filter((m) => m.status === "concluida").length;

        return (
          <Link
            key={pdi.id}
            href={`/pessoas/pdi/${pdi.id}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                cursor: "pointer",
                transition: "border-color var(--t)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                    {pdi.titulo}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                    {formatDate(pdi.data_inicio)} → {formatDate(pdi.data_fim)}
                    {" · "}
                    {pdi.metas.length} {pdi.metas.length === 1 ? "meta" : "metas"}
                    {pdi.metas.length > 0 && ` · ${metasConcluidas} concluída${metasConcluidas !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: meta.bg,
                    color: meta.fg,
                    whiteSpace: "nowrap",
                  }}
                >
                  {STATUS_LABEL[pdi.status]}
                </span>
              </div>

              {pdi.metas.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "var(--text-3)",
                      marginBottom: 6,
                    }}
                  >
                    <span>Progresso geral</span>
                    <span style={{ fontWeight: 700, color: pct === 100 ? "#15803D" : "var(--text-2)" }}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "var(--surface-2)",
                      borderRadius: 99,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: pct === 100 ? "#22C55E" : "var(--brand)",
                        borderRadius: 99,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {pdi.metas.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        style={{
                          flex: 1,
                          minWidth: 120,
                          background: "var(--surface-2)",
                          borderRadius: 8,
                          padding: "8px 10px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-2)",
                            fontWeight: 500,
                            marginBottom: 6,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={m.descricao}
                        >
                          {m.descricao}
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: "var(--border)",
                            borderRadius: 99,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${m.progresso}%`,
                              height: "100%",
                              background: m.status === "concluida" ? "#22C55E" : "var(--brand)",
                              borderRadius: 99,
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>
                          {m.progresso}% · prazo {formatDate(m.prazo)}
                        </div>
                      </div>
                    ))}
                    {pdi.metas.length > 4 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: 11,
                          color: "var(--text-3)",
                          paddingLeft: 4,
                        }}
                      >
                        +{pdi.metas.length - 4} mais
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Link>
        );
      })}

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginTop: 8,
            fontSize: 13,
            color: "var(--text-3)",
          }}
        >
          {page > 1 && (
            <Link
              href={`?page=${page - 1}`}
              style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}
            >
              ← Anterior
            </Link>
          )}
          <span>
            Página {page} de {totalPages} · {count} PDI{count !== 1 ? "s" : ""}
          </span>
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}`}
              style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}
            >
              Próximo →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
