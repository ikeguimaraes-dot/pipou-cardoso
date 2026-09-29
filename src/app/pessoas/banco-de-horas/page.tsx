import { Suspense } from "react";

import { listMyHourBank, listHourBankByUnit } from "@/lib/pessoas/actions";
import { requireUser, getUserTier } from "@kph/auth/server";
import { getCurrentUnit } from "@kph/auth/unit";
import { MeuBancoDeHoras } from "./MeuBancoDeHoras";
import { BancoDeHorasUnit } from "./BancoDeHorasUnit";

export const dynamic = "force-dynamic";

export default async function BancoDeHorasPage() {
  const user = await requireUser();
  const tier = getUserTier(user);

  if (tier === "T1") {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <header style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--text-3)" }}>
            Minha área · Banco de Horas
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 0", color: "var(--text)", letterSpacing: -0.4 }}>
            Banco de horas
          </h1>
        </header>

        <Suspense fallback={<Skeleton />}>
          <T1BancoSection />
        </Suspense>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--text-3)" }}>
          Pessoas · Banco de Horas
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 0", color: "var(--text)", letterSpacing: -0.4 }}>
          Banco de horas — unit
        </h1>
      </header>

      <Suspense fallback={<Skeleton />}>
        <T3BancoSection />
      </Suspense>
    </div>
  );
}

async function T1BancoSection() {
  const entries = await listMyHourBank();
  const nome = entries[0]?.nome ?? "Colaborador";
  return <MeuBancoDeHoras nome={nome} entries={entries} />;
}

async function T3BancoSection() {
  const unit = await getCurrentUnit();
  if (!unit) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-3)", fontSize: 13 }}>
        Selecione uma unit no topo.
      </div>
    );
  }
  const entries = await listHourBankByUnit(unit.id);
  return <BancoDeHorasUnit unitName={unit.name} entries={entries} />;
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ height: 56, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, opacity: 0.7 }} />
      ))}
    </div>
  );
}
