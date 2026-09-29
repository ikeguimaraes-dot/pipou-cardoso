import { requireRole } from "@kph/auth/server";
import { buscarTalentos, getNovosBancoCount } from "../actions";
import { BancoTalentosClient } from "./BancoTalentosClient";

export const dynamic = "force-dynamic";

export default async function BancoTalentosPage() {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  const ALL_STATUSES = ["novo", "entrevista", "triagem", "aprovado", "banco_talentos", "reprovado", "desistiu"];
  const [{ talentos: inicial, total }, novosCount] = await Promise.allSettled([
    buscarTalentos({ offset: 0, statusSelecionados: ALL_STATUSES }),
    getNovosBancoCount(),
  ]).then(([t, n]) => [
    t.status === "fulfilled" ? t.value : { talentos: [], total: 0 },
    n.status === "fulfilled" ? n.value : 0,
  ] as const);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--text-3)" }}>
          Pessoas · Recrutamento
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6, flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: "var(--text)", letterSpacing: -0.4 }}>
            Recrutamento &amp; Seleção
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href="/pessoas/recrutamento/importar-cvs"
              style={{ fontSize: 12, color: "var(--text-2)", textDecoration: "none", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 8, fontWeight: 600 }}
            >
              + Importar CVs
            </a>
            <a
              href="/pessoas/vagas"
              style={{ fontSize: 12, color: "var(--text-3)", textDecoration: "none", padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
            >
              ← Vagas
            </a>
          </div>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, maxWidth: 620 }}>
          Gerencie o pipeline completo de candidatos do Cardoso — da captação à contratação.
        </p>
        <div style={{ display: "flex", gap: 2, marginTop: 20, borderBottom: "1px solid var(--border)" }}>
          <a
            href="/pessoas/recrutamento"
            style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: "6px 6px 0 0", textDecoration: "none", color: "var(--text-3)", background: "transparent", display: "inline-block" }}
          >
            Pipeline
          </a>
          <a
            href="/pessoas/recrutamento/banco-talentos"
            style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: "6px 6px 0 0", textDecoration: "none", color: "var(--text)", background: "var(--surface-2)", borderBottom: "2px solid var(--brasa)", marginBottom: "-1px", display: "inline-block" }}
          >
            Banco de Talentos
          </a>
          <a
            href="/pessoas/recrutamento/quadro-ideal"
            style={{ fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: "6px 6px 0 0", textDecoration: "none", color: "var(--text-3)", background: "transparent", display: "inline-block" }}
          >
            Quadro Ideal
          </a>
        </div>
      </header>

      <BancoTalentosClient talentos={inicial} totalInicial={total} />
    </div>
  );
}
