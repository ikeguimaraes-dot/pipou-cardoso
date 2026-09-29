import Link from "next/link";
import { loadPendencias, PendenciasAccessError } from "@/lib/pessoas/pendencias-server";
import { defaultPeriod, saoPauloDate, validPeriod } from "@/lib/pessoas/pendencias-model";
import { PendenciasClient } from "./pendencias-client";
import "./pendencias.css";

export const dynamic = "force-dynamic";

export default async function PendenciasPage({ searchParams }: { searchParams: Promise<{ competencia?: string; visao?: string; unidade?: string }> }) {
  const { competencia, visao, unidade } = await searchParams;
  const period = competencia && validPeriod(competencia) ? competencia : defaultPeriod(saoPauloDate());
  const view = visao === "plataforma" ? "plataforma" : "rh";
  try {
    const snapshot = await loadPendencias(period);
    const initialUnit = snapshot.units.some(unit => unit.id === unidade) ? unidade! : "";
    return <PendenciasClient key={`${period}:${view}:${initialUnit}`} snapshot={snapshot} initialView={view} initialUnit={initialUnit} />;
  } catch (error) {
    const access = error instanceof PendenciasAccessError;
    console.error("[pendencias] Carregamento indisponível:", error instanceof Error ? error.name : "unknown");
    return <section className="rh-pendencias"><header><p className="rh-eyebrow">Pessoas / RH</p><h1>Central de Pendências</h1></header>
      <div className="rh-empty" role="alert"><h2>{access ? "Acesso restrito ao RH e à gestão" : "Não foi possível conferir as pendências"}</h2>
        <p>{access ? error.message : "A consulta não foi concluída. Tente novamente antes de interpretar a fila como completa."}</p>
        <Link className="rh-button" href={access ? "/pessoas" : `/pessoas/pendencias?competencia=${period}${view === "plataforma" ? "&visao=plataforma" : ""}`}>{access ? "Voltar para Pessoas" : "Tentar novamente"}</Link>
      </div></section>;
  }
}
