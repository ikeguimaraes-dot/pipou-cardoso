import { requireRole } from "@kph/auth/server";
import { getCandidatos, getVagasParaFiltro, getRecrutamentoOptions, getCargos, getNovosBancoCount } from "./actions";
import { KanbanClient } from "./KanbanClient";
import "./recruitment.css";

export const dynamic = "force-dynamic";

export default async function RecrutamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ vaga?: string }>;
}) {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  const { vaga: vagaId } = await searchParams;
  const [candidatosR, vagasR, optionsR, cargosR, novosR] = await Promise.allSettled([
    getCandidatos(vagaId),
    getVagasParaFiltro(),
    getRecrutamentoOptions(),
    getCargos(),
    getNovosBancoCount(),
  ]);
  const candidatos   = candidatosR.status === "fulfilled" ? candidatosR.value : [];
  const vagas        = vagasR.status === "fulfilled" ? vagasR.value : [];
  const options      = optionsR.status === "fulfilled" ? optionsR.value : { units: [], cargos: [] };
  const cargosCanon  = cargosR.status === "fulfilled" ? cargosR.value : [];
  const novosCount   = novosR.status === "fulfilled" ? novosR.value : 0;

  return (
    <div className="recruit-workspace">
      <header className="recruit-header">
        <div className="recruit-eyebrow">
          Pipou Academy / Pessoas / Recrutamento
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6, flexWrap: "wrap", gap: 12 }}>
          <h1 className="recruit-title">
            Recrutamento &amp; Seleção
          </h1>
          <a
            href="/pessoas/vagas"
            style={{ fontSize: 12, color: "var(--text-3)", textDecoration: "none", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
          >
            Gerenciar vagas ↗
          </a>
        </div>
        <p className="recruit-subtitle">
          Pendências, candidatos e próximos passos em uma única visão.
        </p>
        <div style={{ display: "flex", gap: 2, marginTop: 20, borderBottom: "1px solid var(--border)" }}>
          <a
            href="/pessoas/recrutamento"
            style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: "6px 6px 0 0", textDecoration: "none", color: "var(--text)", background: "var(--surface-2)", borderBottom: "2px solid var(--brasa)", marginBottom: "-1px", display: "inline-block" }}
          >
            Pipeline
          </a>
          <a
            href="/pessoas/recrutamento/banco-talentos"
            style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: "6px 6px 0 0", textDecoration: "none", color: "var(--text-3)", background: "transparent", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            Banco de Talentos
            {novosCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, background: "var(--brasa, #C4622D)", color: "var(--primary-foreground)", borderRadius: 99, padding: "1px 6px", lineHeight: 1.6 }}>
                {novosCount} novo{novosCount > 1 ? "s" : ""}
              </span>
            )}
          </a>
          <a
            href="/pessoas/recrutamento/quadro-ideal"
            style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: "6px 6px 0 0", textDecoration: "none", color: "var(--text-3)", background: "transparent", display: "inline-block" }}
          >
            Quadro Ideal
          </a>
        </div>
      </header>

      <KanbanClient candidatos={candidatos} vagas={vagas} vagaIdInicial={vagaId} options={options} cargosCanon={cargosCanon} />
    </div>
  );
}
