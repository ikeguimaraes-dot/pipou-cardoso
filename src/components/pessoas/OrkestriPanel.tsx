/**
 * OrkestriPanel — painel Learning Machine por módulo.
 *
 * Server Component: busca propostas e passa para o client.
 * Parâmetro `modulo` torna o componente reutilizável para
 * Operação, Financeiro, Compras etc.
 *
 * Uso:
 *   <OrkestriPanel modulo="pessoas" />
 */

import { Suspense } from "react";
import { getProposals } from "@/app/pessoas/agentes/actions-proposals";
import { OrkestriPanelClient } from "./OrkestriPanelClient";

interface Props {
  modulo: string;
}

async function ProposalsLoader({ modulo }: Props) {
  const proposals = await getProposals(modulo, "pending");

  if (proposals.length === 0) {
    return (
      <div style={{
        padding: "24px 28px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        textAlign: "center",
      }}>
        <p style={{
          fontSize: 13, color: "var(--text-3)",
          margin: 0, lineHeight: 1.6,
        }}>
          Nenhuma proposta pendente.{" "}
          <span style={{ color: "var(--text-2)" }}>
            O Learning Machine gera novas propostas a cada execução semanal dos agentes.
          </span>
        </p>
      </div>
    );
  }

  return <OrkestriPanelClient proposals={proposals} />;
}

export function OrkestriPanel({ modulo }: Props) {
  return (
    <section>
      {/* Header da seção */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, gap: 12,
      }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--brand, #C4622D)",
            marginBottom: 4,
          }}>
            Orkestri · Learning Machine
          </div>
          <h2 style={{
            margin: 0, fontSize: 18, fontWeight: 700,
            color: "var(--text)", letterSpacing: -0.3,
          }}>
            Propostas de melhoria
          </h2>
        </div>
        <div style={{
          padding: "4px 10px",
          background: "rgba(252,214,22,0.08)",
          border: "1px solid rgba(252,214,22,0.20)",
          borderRadius: 6,
          fontSize: 11, fontWeight: 600,
          color: "var(--brand, #C4622D)",
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}>
          {modulo.charAt(0).toUpperCase() + modulo.slice(1)}
        </div>
      </div>

      <Suspense fallback={<OrkestriSkeleton />}>
        <ProposalsLoader modulo={modulo} />
      </Suspense>
    </section>
  );
}

function OrkestriSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          height: 88,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          animation: "pulse 1.6s ease-in-out infinite",
          opacity: 1 - i * 0.15,
        }} />
      ))}
    </div>
  );
}
