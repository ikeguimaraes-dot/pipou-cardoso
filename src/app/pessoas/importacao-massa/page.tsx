import Link from "next/link";
import { pendenciasContext } from "@/lib/pessoas/pendencias-server";
import { BulkClient } from "./bulk-client";
import "./bulk.css";

export const dynamic = "force-dynamic";
export default async function BulkPage() {
  const context = await pendenciasContext().catch(() => null);
  if (!context) {
    return <section className="rh-bulk"><h1>Importação em massa</h1><p role="alert">Não foi possível confirmar seu acesso de RH às unidades. Entre novamente ou tente atualizar a página.</p><Link href="/pessoas">Voltar para Pessoas</Link></section>;
  }
  return <><Link className="mb-6 block text-[var(--brand)]" href="/pessoas/importacao-inicial">Cadastrar novos colaboradores pela base inicial →</Link><BulkClient units={context.units} /></>;
}
