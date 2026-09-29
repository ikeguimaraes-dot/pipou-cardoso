import { Suspense } from "react";

import { listMySickLeaves, listSickLeavesByUnit } from "@/lib/pessoas/actions";
import { requireUser, getUserTier } from "@kph/auth/server";
import { getCurrentUnit } from "@kph/auth/unit";
import { MeusAtestados } from "./MeusAtestados";
import { AtestadosUnit } from "./AtestadosUnit";

export const dynamic = "force-dynamic";

export default async function AtestadosPage() {
  const user = await requireUser();
  const tier = getUserTier(user);

  if (tier === "T1") {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <header style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--text-3)" }}>
            Minha área · Atestados
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 0", color: "var(--text)", letterSpacing: -0.4 }}>
            Meus atestados
          </h1>
        </header>

        <Suspense fallback={<Skeleton />}>
          <T1Section />
        </Suspense>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--text-3)" }}>
          Pessoas · Atestados
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 0", color: "var(--text)", letterSpacing: -0.4 }}>
          Atestados médicos
        </h1>
      </header>

      <Suspense fallback={<Skeleton />}>
        <T3Section />
      </Suspense>
    </div>
  );
}

async function T1Section() {
  const atestados = await listMySickLeaves();
  const nome = atestados[0]?.nome ?? "Colaborador";
  return <MeusAtestados nome={nome} atestados={atestados} />;
}

async function T3Section() {
  const unit = await getCurrentUnit();
  if (!unit) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-3)", fontSize: 13 }}>
        Selecione uma unit no topo.
      </div>
    );
  }
  const atestados = await listSickLeavesByUnit(unit.id);
  return <AtestadosUnit unitName={unit.name} atestados={atestados} />;
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ height: 60, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, opacity: 0.7 }} />
      ))}
    </div>
  );
}
