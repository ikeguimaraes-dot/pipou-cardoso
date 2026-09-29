import type { JDRow, FormaContratacao } from "@/app/pessoas/vagas/actions";

function section(label: string, value?: string | null): string {
  return value?.trim() ? `${label}\n${value.trim()}` : "";
}

/** Copies the JD into an editable vacancy snapshot; opening context stays separate. */
export function camposVagaDoJD(jd: JDRow, brandIds: readonly string[]) {
  const requirements = [
    section("Formação", jd.req_formacao),
    section("Experiência", jd.req_experiencia),
    section("Conhecimentos técnicos", jd.req_conhecimentos_tecnicos),
    section("Competências comportamentais", jd.req_competencias_comportamentais),
  ].filter(Boolean).join("\n\n") || jd.requisitos?.trim() || "";
  const responsibilities = [
    section("Gestão operacional", jd.resp_gestao_operacional),
    section("Gestão de pessoas", jd.resp_gestao_pessoas),
    section("Estoque e custos", jd.resp_estoque_custos),
    section("Qualidade e experiência", jd.resp_qualidade_experiencia),
  ].filter(Boolean).join("\n\n") || jd.responsabilidades?.trim() || "";
  const contracts: Record<string, FormaContratacao> = {
    clt: "CLT", pj: "PJ", freelance: "freelance", temporario: "temporario", estagio: "estagio",
  };
  return {
    cargo: jd.cargo,
    area: jd.area ?? "",
    brand_id: brandIds.includes(jd.brand_id ?? "") ? jd.brand_id! : "",
    forma_contratacao: contracts[jd.tipo_contrato?.trim().toLowerCase() ?? ""] ?? "",
    must_have: requirements,
    description: [
      section("Objetivo do cargo", jd.objetivo_cargo),
      section("Reporte direto", jd.reporte_direto),
      responsibilities,
      section("Responsabilidades sobre pessoas", jd.responsabilidades_sobre_pessoas),
      section("Indicadores de performance", jd.indicadores_performance),
      section("Indicadores de sucesso", jd.indicadores_sucesso),
      section("Condições de trabalho", jd.condicoes_trabalho),
      section("Benefícios", jd.beneficios),
    ].filter(Boolean).join("\n\n"),
  };
}
