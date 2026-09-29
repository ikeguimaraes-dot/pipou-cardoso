import { cookies } from "next/headers";
import Link from "next/link";
import { loadOrkestri } from "@/lib/pessoas/orkestri-server";
import { PendenciasAccessError } from "@/lib/pessoas/pendencias-server";
import { OrkestriClient } from "./orkestri-client";
import "./orkestri.css";

export const dynamic = "force-dynamic";

export default async function OrkestriPage({ searchParams }: { searchParams: Promise<{ unidades?: string; periodo?: string }> }) {
  const params = await searchParams;
  const unit = params.unidades === "todas" ? null : (await cookies()).get("kph_unit_id")?.value ?? null;
  try {
    return <OrkestriClient snapshot={await loadOrkestri(unit, params.periodo)} />;
  } catch (error) {
    return <section className="ork-page"><p className="ork-eyebrow">Orkestri / Pessoas</p><h1>Leitura executiva</h1>
      <div className="ork-panel" role="alert"><h2>{error instanceof PendenciasAccessError ? "Acesso restrito à gestão e ao RH" : "Não foi possível conferir os dados"}</h2>
        <p>{error instanceof PendenciasAccessError ? error.message : "Tente novamente. Nenhuma conclusão foi gerada com a consulta incompleta."}</p><Link href="/pessoas/orkestri?unidades=todas">Consultar casas autorizadas</Link></div></section>;
  }
}
