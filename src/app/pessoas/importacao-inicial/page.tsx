import { requireRole } from "@kph/auth/server";
import { pendenciasContext } from "@/lib/pessoas/pendencias-server";
import { InitialImportClient } from "./client";
export default async function InitialImportPage() {
  await requireRole(["founder"]);
  const {units}=await pendenciasContext();
  return <section className="grid gap-6"><h1 className="text-3xl font-semibold">Importar base inicial</h1><p className="rounded-lg border border-[var(--border)] p-4">Esta tela é para colaboradores já contratados. Para a base de recrutamento, use <a className="font-semibold text-[var(--brand)] underline" href="/pessoas/recrutamento/importar-planilha">Importar candidatos por planilha — Excel/CSV até 10 MB</a>.</p><InitialImportClient units={units}/></section>;
}
