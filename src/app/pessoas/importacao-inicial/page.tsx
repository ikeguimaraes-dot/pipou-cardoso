import { requireRole } from "@kph/auth/server";
import { pendenciasContext } from "@/lib/pessoas/pendencias-server";
import { InitialImportClient } from "./client";
export default async function InitialImportPage() {
  await requireRole(["founder"]);
  const {units}=await pendenciasContext();
  return <section className="grid gap-6"><h1 className="text-3xl font-semibold">Importar base inicial</h1><InitialImportClient units={units}/></section>;
}
