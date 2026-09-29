import { requireRole } from "@kph/auth/server";
import { getCargos, getOrganograma, getQuadroCompleto, getUnidadesComQuadro } from "../actions";
import { QuadroIdealClient } from "./QuadroIdealClient";

export const dynamic = "force-dynamic";

export default async function QuadroIdealPage() {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  const [unidades, cargosRes, orgRes] = await Promise.allSettled([
    getUnidadesComQuadro(),
    getCargos(),
    getOrganograma(),
  ]);

  const units    = unidades.status  === "fulfilled" ? unidades.value  : [];
  const cargos   = cargosRes.status === "fulfilled" ? cargosRes.value : [];
  const orgNodes = orgRes.status    === "fulfilled" ? orgRes.value    : [];

  // Carrega o quadro da primeira unidade para pré-popular a tela
  const firstUnit = units[0] ?? null;
  const initialRows = firstUnit ? await getQuadroCompleto(firstUnit.id) : [];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "var(--text-3)",
          }}
        >
          Pessoas · Recrutamento
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 6,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              margin: 0,
              color: "var(--text)",
              letterSpacing: -0.4,
            }}
          >
            Recrutamento &amp; Seleção
          </h1>
          <a
            href="/pessoas/vagas"
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              textDecoration: "none",
              padding: "6px 12px",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            ← Vagas
          </a>
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.6,
            maxWidth: 620,
          }}
        >
          Gerencie o pipeline completo de candidatos do Cardoso — da captação à
          contratação.
        </p>
        <div
          style={{
            display: "flex",
            gap: 2,
            marginTop: 20,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <a
            href="/pessoas/recrutamento"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: "6px 6px 0 0",
              textDecoration: "none",
              color: "var(--text-3)",
              background: "transparent",
              display: "inline-block",
            }}
          >
            Pipeline
          </a>
          <a
            href="/pessoas/recrutamento/banco-talentos"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: "6px 6px 0 0",
              textDecoration: "none",
              color: "var(--text-3)",
              background: "transparent",
              display: "inline-block",
            }}
          >
            Banco de Talentos
          </a>
          <a
            href="/pessoas/recrutamento/quadro-ideal"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: "6px 6px 0 0",
              textDecoration: "none",
              color: "var(--text)",
              background: "var(--surface-2)",
              borderBottom: "2px solid var(--brasa)",
              marginBottom: "-1px",
              display: "inline-block",
            }}
          >
            Quadro Ideal
          </a>
        </div>
      </header>

      <QuadroIdealClient
        units={units}
        initialUnitId={firstUnit?.id ?? null}
        initialRows={initialRows}
        cargos={cargos}
        orgNodes={orgNodes}
      />
    </div>
  );
}
