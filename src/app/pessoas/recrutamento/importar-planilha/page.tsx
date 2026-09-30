import { requireRole } from "@kph/auth/server";
import { pendenciasContext } from "@/lib/pessoas/pendencias-server";
import { TalentImportClient } from "./client";
export default async function TalentImportPage(){
  await requireRole(["founder"]);
  const {units}=await pendenciasContext();
  return <section className="grid gap-6"><a href="/pessoas/recrutamento/banco-talentos" className="text-sm">← Banco de Talentos</a><h1 className="text-3xl font-semibold">Importar candidatos por planilha</h1><TalentImportClient units={units}/></section>;
}
