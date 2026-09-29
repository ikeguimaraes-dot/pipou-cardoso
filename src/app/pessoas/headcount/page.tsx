import { Suspense } from "react";
import Link from "next/link";
import { requireRole } from "@kph/auth/server";
import { getCurrentUnit } from "@kph/auth/unit";
import { getVacationAlerts } from "@/lib/pessoas/actions";
import {
  getHeadcountStats,
  getDistribuicaoMarcas,
  getDistribuicaoFuncoes,
  getDistribuicaoDepartamentos,
  getMovimentacoesRecentes,
  getVagasAbertas,
  getHeadcountBrands,
  type Period,
} from "@/lib/pessoas/headcount-actions";
import { HeadcountClient } from "./headcount-client";
import { createSupabaseServerClient } from "@kph/db/supabase/server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ period?: string; brandId?: string }>;
};

export default async function HeadcountPage({ searchParams }: Props) {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  const sp = await searchParams;
  const period: Period =
    sp.period === "trimestre" || sp.period === "ano" ? sp.period : "mes";
  const brandId = sp.brandId ?? "";

  const filters = { period, brandId: brandId || undefined };

  const [stats, marcas, funcoes, departamentos, movimentacoes, vagas, brands] =
    await Promise.all([
      getHeadcountStats(filters),
      getDistribuicaoMarcas(filters),
      getDistribuicaoFuncoes(filters),
      getDistribuicaoDepartamentos(filters),
      getMovimentacoesRecentes(filters),
      getVagasAbertas({ brandId: brandId || undefined }),
      getHeadcountBrands(),
    ]);

  return (
    <>
      <Suspense fallback={null}>
        <VacationAlertBanner />
      </Suspense>
      <Suspense fallback={null}>
        <PessoasInsightPanel />
      </Suspense>
      <HeadcountClient
        period={period}
        brandId={brandId}
        brands={brands}
        stats={stats}
        marcas={marcas}
        funcoes={funcoes}
        departamentos={departamentos}
        movimentacoes={movimentacoes}
        vagas={vagas}
      />
    </>
  );
}

async function PessoasInsightPanel() {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;

    // Insight gerado hoje pelo agente de Pessoas
    const today = new Date().toISOString().split("T")[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await supabase
      .from("kph_insights")
      .select("insight_text, dados_referencia, created_at")
      .eq("modulo", "pessoas")
      .gte("semana", today)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    const ref = data.dados_referencia as Record<string, unknown> | null;
    const score = ref && typeof ref.score === "number" ? ref.score : null;
    const scoreColor =
      score === null ? "var(--text-3)"
      : score >= 80 ? "#15803D"
      : score >= 60 ? "#A16207"
      : "#B91C1C";

    return (
      <div style={{ maxWidth: 1180, margin: "0 auto 16px" }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          padding: "14px 18px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
        }}>
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-3)" }}>
                IA · Pessoas · Hoje
              </span>
              {score !== null && (
                <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor }}>
                  Score {score}/100
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.55 }}>
              {data.insight_text}
            </p>
          </div>
        </div>
      </div>
    );
  } catch {
    return null;
  }
}

async function VacationAlertBanner() {
  const unit = await getCurrentUnit();
  if (!unit) return null;
  const alerts = await getVacationAlerts(unit.id);
  const { vencidas, vencendo30, vencendo60 } = alerts;
  const total = vencidas.length + vencendo30.length + vencendo60.length;
  if (total === 0) return null;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto 0", paddingBottom: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {vencidas.length > 0 && (
          <Link href="/pessoas/ferias" style={{ textDecoration: "none", flex: "1 1 220px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 10, cursor: "pointer" }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#B91C1C" }}>{vencidas.length} férias vencida{vencidas.length > 1 ? "s" : ""}</div>
                <div style={{ fontSize: 11, color: "#B91C1C" }}>Risco trabalhista — agendar agora</div>
              </div>
            </div>
          </Link>
        )}
        {(vencendo30.length > 0 || vencendo60.length > 0) && (
          <Link href="/pessoas/ferias" style={{ textDecoration: "none", flex: "1 1 220px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.40)", borderRadius: 10, cursor: "pointer" }}>
              <span style={{ fontSize: 20 }}>⏰</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#A16207" }}>{vencendo30.length + vencendo60.length} férias vencendo em 60 dias</div>
                <div style={{ fontSize: 11, color: "#A16207" }}>Ver detalhes em Férias</div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
