import { requireRole } from "@kph/auth/server";
import { getRecrutamentoOptions, getCargos } from "../actions";
import { ImportarCVsClient } from "./ImportarCVsClient";

export const dynamic = "force-dynamic";

export default async function ImportarCVsPage() {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  const [optionsR, cargosCanon] = await Promise.all([
    getRecrutamentoOptions().catch(() => ({ units: [], cargos: [] })),
    getCargos().catch(() => []),
  ]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 32 }}>
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
            Importar CVs em Massa
          </h1>
          <a
            href="/pessoas/recrutamento/banco-talentos"
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              textDecoration: "none",
              padding: "6px 12px",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            ← Banco de Talentos
          </a>
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 13,
            color: "var(--text-2)",
            lineHeight: 1.6,
            maxWidth: 600,
          }}
        >
          Envie até 20 arquivos (PDF ou imagem). A IA extrai os dados de cada CV e
          gera uma fila de revisão — você confirma ou descarta cada candidato antes
          de qualquer gravação.
        </p>
      </header>

      <p style={{marginBottom:20}}>Tem uma base de contatos em Excel ou CSV? <a href="/pessoas/recrutamento/importar-planilha" style={{color:"var(--brand)"}}>Importar planilha com até 25.000 candidatos</a></p>
      <ImportarCVsClient units={optionsR.units} cargosCanon={cargosCanon} />
    </div>
  );
}
