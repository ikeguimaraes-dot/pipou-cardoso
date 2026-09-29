import { requireRole } from "@kph/auth/server";
import { getVagas, getJobDescriptions, getBrandsVagas, getDashboardRS, getCandidatesByVaga, getEmployeesRS, getCargoGrupos, getUnidades } from "./actions";
import { VagasClient } from "./VagasClient";

export const dynamic = "force-dynamic";

export default async function VagasPage() {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  const [vagas, jds, brands, dashboard, candidatesByVaga, employees, cargoGrupos, units] = await Promise.all([
    getVagas(),
    getJobDescriptions(),
    getBrandsVagas(),
    getDashboardRS(),
    getCandidatesByVaga(),
    getEmployeesRS(),
    getCargoGrupos(),
    getUnidades(),
  ]);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--text-3)" }}>
          Pessoas · Vagas
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 0", color: "var(--text)", letterSpacing: -0.4 }}>
          Recrutamento & Seleção
        </h1>
      </header>

      <VagasClient
        vagas={vagas}
        jds={jds}
        brands={brands}
        dashboard={dashboard}
        candidatesByVaga={candidatesByVaga}
        employees={employees}
        cargoGrupos={cargoGrupos}
        units={units}
      />
    </div>
  );
}
