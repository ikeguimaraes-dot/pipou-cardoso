"use server";

import { createSupabaseServerClient, createServiceClient } from "@kph/db/supabase/server";
import { requireRole } from "@kph/auth/server";
import { revalidatePath } from "next/cache";
import { isMotivoVaga, normalizeMotivoVaga, type MotivoEstruturado, type MotivoLegado } from "@/lib/pessoas/motivos-vaga";
export type { MotivoEstruturado } from "@/lib/pessoas/motivos-vaga";

// ─── Vagas (schema real do xlsx) ─────────────────────────────────

export async function getVagas(): Promise<VagaRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("job_openings")
      .select("id, title, description, cargo, area, motivo, motivo_estruturado, horario_escala, forma_contratacao, periodo_exp_dias, prioridade, sla_dias, responsavel_id, entrevistador_id, substituido_id, salario_min, salario_max, must_have, nice_to_have, data_solicitacao, status, recrutador, observacao, unit_id, brand_id, cargo_grupo_id, congelada, cancelada, motivo_congelamento, congelada_em, cancelada_em, created_at, units(name), brands(name), cargo_grupos(nome, sla_dias_uteis)")
      .order("created_at", { ascending: false });
    return (data ?? []) as VagaRow[];
  } catch {
    return [];
  }
}

export async function getCargoGrupos(): Promise<CargoGrupoSel[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("cargo_grupos")
      .select("id, nome, sla_dias_uteis")
      .eq("ativo", true)
      .order("sla_dias_uteis");
    return (data ?? []) as CargoGrupoSel[];
  } catch {
    return [];
  }
}

export async function getUnidades(): Promise<{ id: string; name: string }[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("units")
      .select("id, name")
      .eq("active", true)
      .order("name");
    return (data ?? []) as { id: string; name: string }[];
  } catch {
    return [];
  }
}

export async function getDashboardRS(): Promise<DashboardRS> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { abertas: 0, candidatos: 0, entrevistas_semana: 0, admissoes_90d: 0 };

    const hojeStr = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const hojeDate = new Date(`${hojeStr}T00:00:00`);
    const semanaFimDate = new Date(hojeDate);
    semanaFimDate.setDate(hojeDate.getDate() + 7);
    const semanaFimStr = semanaFimDate.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

    const [vagasRes, candidatosRes, entrevistasRes] = await Promise.all([
      supabase.from("job_openings").select("status", { count: "exact" }).in("status", ["aberta", "em_admissao", "teste"]),
      supabase.from("candidates").select("id", { count: "exact" }).not("status", "in", '("reprovado","desistiu")'),
      supabase.from("interviews").select("id", { count: "exact" }).gte("data_entrevista", hojeStr).lte("data_entrevista", semanaFimStr).in("status", ["agendada"]),
    ]);

    return {
      abertas: vagasRes.count ?? 0,
      candidatos: candidatosRes.count ?? 0,
      entrevistas_semana: entrevistasRes.count ?? 0,
      admissoes_90d: 0, // seria via movimentacoes_rh
    };
  } catch {
    return { abertas: 0, candidatos: 0, entrevistas_semana: 0, admissoes_90d: 0 };
  }
}

export async function getCandidatesByVaga(): Promise<Record<string, number>> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return {};
    const { data } = await supabase
      .from("candidates")
      .select("job_opening_id")
      .not("job_opening_id", "is", null);
    if (!data) return {};
    const counts: Record<string, number> = {};
    for (const row of data) {
      if (row.job_opening_id) {
        counts[row.job_opening_id] = (counts[row.job_opening_id] ?? 0) + 1;
      }
    }
    return counts;
  } catch {
    return {};
  }
}

export async function getJobDescriptions(): Promise<JDRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await (supabase as any)
      .from("job_descriptions")
      .select("*")
      .order("cargo");
    return (data ?? []) as JDRow[];
  } catch {
    return [];
  }
}

export async function getBrandsVagas(): Promise<{ id: string; name: string }[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("brands")
      .select("id, name")
      .eq("active", true)
      .order("name");
    return (data ?? []) as { id: string; name: string }[];
  } catch {
    return [];
  }
}

// ─── Mutações ────────────────────────────────────────────────────

export async function criarVaga(input: {
  cargo: string;
  description?: string;
  cargo_grupo_id: string;
  area?: string;
  motivo_estruturado: MotivoEstruturado | null;
  horario_escala?: string;
  forma_contratacao?: string;
  periodo_exp_dias?: number;
  substituido_id?: string;
  brand_id?: string;
  unit_id?: string;
  recrutador?: string;
  observacao?: string;
  prioridade?: string;
  responsavel_id?: string;
  entrevistador_id?: string;
  salario_min?: number;
  salario_max?: number;
  must_have?: string;
  nice_to_have?: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const motivoEstruturado = normalizeMotivoVaga(input.motivo_estruturado);
  if (!isMotivoVaga(motivoEstruturado)) return { ok: false, error: "Selecione um motivo de abertura válido. O motivo é obrigatório." };
  if (!input.cargo_grupo_id) return { ok: false, error: "Grupo de cargo é obrigatório" };
  const sb = createServiceClient();
  if (!sb) return { ok: false, error: "Sem conexão" };

  // Busca sla_dias_uteis do grupo para persistir no sla_dias (compatibilidade)
  const { data: grupo } = await sb.from("cargo_grupos").select("sla_dias_uteis").eq("id", input.cargo_grupo_id).single();

  const { error } = await sb.from("job_openings").insert({
    title: input.cargo,
    description: input.description?.trim() || null,
    cargo: input.cargo,
    cargo_grupo_id: input.cargo_grupo_id,
    sla_dias: grupo?.sla_dias_uteis ?? 30,
    area: input.area ?? null,
    motivo_estruturado: motivoEstruturado,
    horario_escala: input.horario_escala ?? null,
    forma_contratacao: input.forma_contratacao ?? null,
    periodo_exp_dias: input.periodo_exp_dias ?? 90,
    substituido_id: input.substituido_id ?? null,
    brand_id: input.brand_id ?? null,
    unit_id: input.unit_id ?? null,
    recrutador: input.recrutador ?? null,
    observacao: input.observacao ?? null,
    prioridade: input.prioridade ?? "media",
    responsavel_id: input.responsavel_id ?? null,
    entrevistador_id: input.entrevistador_id ?? null,
    salario_min: input.salario_min ?? null,
    salario_max: input.salario_max ?? null,
    must_have: input.must_have ?? null,
    nice_to_have: input.nice_to_have ?? null,
    status: "aberta",
    is_active: true,
    data_solicitacao: new Date().toISOString().split("T")[0],
  });
  if (error) { console.error("[criarVaga]", error.message); return { ok: false, error: error.message }; }
  revalidatePath("/pessoas/vagas");
  return { ok: true };
}

export async function congelarVaga(vagaId: string, motivo: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return { ok: false, error: "Sem conexão" };
  const { error } = await sb.from("job_openings").update({
    congelada: true, motivo_congelamento: motivo.trim(), congelada_em: new Date().toISOString(),
  }).eq("id", vagaId);
  if (error) { console.error("[congelarVaga]", error.message); return { ok: false, error: error.message }; }
  revalidatePath("/pessoas/vagas");
  revalidatePath("/pessoas/recrutamento");
  return { ok: true };
}

export async function cancelarVaga(vagaId: string, motivo: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return { ok: false, error: "Sem conexão" };
  const { error } = await sb.from("job_openings").update({
    cancelada: true, status: "cancelada", motivo_congelamento: motivo.trim(), cancelada_em: new Date().toISOString(), is_active: false,
  }).eq("id", vagaId);
  if (error) { console.error("[cancelarVaga]", error.message); return { ok: false, error: error.message }; }
  revalidatePath("/pessoas/vagas");
  revalidatePath("/pessoas/recrutamento");
  return { ok: true };
}

export async function descongelarVaga(vagaId: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return { ok: false, error: "Sem conexão" };
  const { error } = await sb.from("job_openings").update({
    congelada: false, motivo_congelamento: null, congelada_em: null,
  }).eq("id", vagaId);
  if (error) { console.error("[descongelarVaga]", error.message); return { ok: false, error: error.message }; }
  revalidatePath("/pessoas/vagas");
  revalidatePath("/pessoas/recrutamento");
  return { ok: true };
}

export async function atualizarStatusVaga(
  id: string,
  status: VagaStatus
): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return { ok: false };
  const { error } = await sb
    .from("job_openings")
    .update({ status, is_active: ["aberta", "em_admissao", "teste"].includes(status) })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pessoas/vagas");
  return { ok: true };
}

export async function encerrarVaga(id: string): Promise<{ ok: boolean; error?: string }> {
  return atualizarStatusVaga(id, "fechada");
}

export async function criarJobDescription(input: {
  cargo: string;
  area: string;
  brand_id?: string;
  // Legado (retrocompatibilidade — não obrigatórios no novo fluxo)
  responsabilidades?: string;
  requisitos?: string;
  beneficios?: string;
  // Campos estruturados (migration 20260721000002)
  reporte_direto?: string;
  objetivo_cargo?: string;
  resp_gestao_operacional?: string;
  resp_gestao_pessoas?: string;
  resp_estoque_custos?: string;
  resp_qualidade_experiencia?: string;
  indicadores_performance?: string;
  req_formacao?: string;
  req_experiencia?: string;
  req_conhecimentos_tecnicos?: string;
  req_competencias_comportamentais?: string;
  responsabilidades_sobre_pessoas?: string;
  condicoes_trabalho?: string;
  indicadores_sucesso?: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return { ok: false };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb as any).from("job_descriptions").insert({
    cargo: input.cargo,
    area: input.area,
    brand_id: input.brand_id || null,
    responsabilidades: input.responsabilidades || null,
    requisitos: input.requisitos || null,
    beneficios: input.beneficios || null,
    reporte_direto: input.reporte_direto || null,
    objetivo_cargo: input.objetivo_cargo || null,
    resp_gestao_operacional: input.resp_gestao_operacional || null,
    resp_gestao_pessoas: input.resp_gestao_pessoas || null,
    resp_estoque_custos: input.resp_estoque_custos || null,
    resp_qualidade_experiencia: input.resp_qualidade_experiencia || null,
    indicadores_performance: input.indicadores_performance || null,
    req_formacao: input.req_formacao || null,
    req_experiencia: input.req_experiencia || null,
    req_conhecimentos_tecnicos: input.req_conhecimentos_tecnicos || null,
    req_competencias_comportamentais: input.req_competencias_comportamentais || null,
    responsabilidades_sobre_pessoas: input.responsabilidades_sobre_pessoas || null,
    condicoes_trabalho: input.condicoes_trabalho || null,
    indicadores_sucesso: input.indicadores_sucesso || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pessoas/vagas");
  return { ok: true };
}

// ─── Parse de JD via .docx + IA ──────────────────────────────────

const JD_PARSING_PROMPT = `Você está analisando o texto de uma Descrição de Cargo do Grupo KPH (hospitalidade premium — restaurantes fine dining e operações gastronômicas).

REGRA ABSOLUTA — ANTI-INVENÇÃO:
Preencha cada campo APENAS se houver uma seção ou parágrafo correspondente EXPLÍCITO no documento fonte.
Se a seção não existir no documento, retorne null para aquele campo — sem exceção.
NUNCA copie o conteúdo de um campo para preencher outro.
NUNCA infira, deduza ou invente conteúdo que não esteja escrito no documento.
Campos null são corretos e esperados. Campos inventados são um erro grave.

DISTINÇÕES OBRIGATÓRIAS entre campos que se confundem:

• "indicadores_performance" vs "indicadores_sucesso" — SÃO CAMPOS DISTINTOS:
  - "indicadores_performance" ← seções "Indicadores de Desempenho", "KPIs", "Indicadores de Performance". São métricas operacionais contínuas (ex: CMV, NPS, produtividade).
  - "indicadores_sucesso" ← seções "Indicadores de Sucesso", "Critérios de Sucesso", metas de médio/longo prazo (ex: "nos primeiros 90 dias...").
  - Se o documento tiver APENAS "Indicadores de Desempenho": preencha "indicadores_performance" e deixe "indicadores_sucesso" null.
  - Se o documento tiver APENAS "Indicadores de Sucesso": preencha "indicadores_sucesso" e deixe "indicadores_performance" null.
  - Nunca repita o mesmo conteúdo nos dois campos.

• "resp_gestao_pessoas" vs "responsabilidades_sobre_pessoas" — SÃO CAMPOS DISTINTOS:
  - "resp_gestao_pessoas" ← responsabilidades operacionais de liderança listadas na seção de Responsabilidades (ex: "liderar e treinar a equipe", "realizar feedback", "escalar profissionais").
  - "responsabilidades_sobre_pessoas" ← escopo de liderança: quantas e quais pessoas o cargo gerencia diretamente (ex: "Gerencia diretamente 4 bartenders e 2 auxiliares").
  - Se o cargo não gerencia ninguém (ex: Barman operacional): ambos ficam null.
  - Nunca repita o mesmo conteúdo nos dois campos.

Retorne SOMENTE um JSON válido (sem markdown, sem comentários) com esta estrutura exata:
{
  "cargo": "nome exato do cargo",
  "area": "uma de: Cozinha, Salão, Bar, Gestão, Administrativo, Compras, Marketing, Apoio, Recepção, Limpeza, Outros",
  "reporte_direto": "a quem o cargo reporta diretamente — apenas se explícito no documento, senão null",
  "objetivo_cargo": "objetivo e propósito geral do cargo (1-2 frases) — apenas se explícito, senão null",
  "resp_gestao_operacional": "responsabilidades operacionais listadas no documento, uma por linha — null se ausente",
  "resp_gestao_pessoas": "responsabilidades de liderança de equipe listadas no documento, uma por linha — null se cargo não lidera",
  "resp_estoque_custos": "responsabilidades de estoque e custos listadas no documento, uma por linha — null se ausente",
  "resp_qualidade_experiencia": "responsabilidades de qualidade e experiência do cliente listadas no documento, uma por linha — null se ausente",
  "indicadores_performance": "métricas operacionais contínuas (Indicadores de Desempenho / KPIs), uma por linha — null se ausente",
  "req_formacao": "formação acadêmica requerida — null se ausente",
  "req_experiencia": "experiência profissional requerida — null se ausente",
  "req_conhecimentos_tecnicos": "conhecimentos técnicos requeridos listados no documento, um por linha — null se ausente",
  "req_competencias_comportamentais": "competências comportamentais listadas no documento, uma por linha — null se ausente",
  "responsabilidades_sobre_pessoas": "escopo de liderança: quantas/quais pessoas gerencia diretamente — null se não lidera",
  "condicoes_trabalho": "condições de trabalho explicitadas no documento (horário, viagens, etc.) — null se ausente",
  "indicadores_sucesso": "indicadores ou critérios de sucesso no cargo (seção distinta de desempenho) — null se ausente",
  "beneficios": "benefícios oferecidos listados no documento, um por linha — null se ausente"
}

Texto da Descrição de Cargo:
{{TEXT}}`;

export type JDParsed = {
  cargo: string | null;
  area: string | null;
  reporte_direto: string | null;
  objetivo_cargo: string | null;
  resp_gestao_operacional: string | null;
  resp_gestao_pessoas: string | null;
  resp_estoque_custos: string | null;
  resp_qualidade_experiencia: string | null;
  indicadores_performance: string | null;
  req_formacao: string | null;
  req_experiencia: string | null;
  req_conhecimentos_tecnicos: string | null;
  req_competencias_comportamentais: string | null;
  responsabilidades_sobre_pessoas: string | null;
  condicoes_trabalho: string | null;
  indicadores_sucesso: string | null;
  beneficios: string | null;
};

export async function parseJobDescription(
  formData: FormData,
): Promise<{ ok: boolean; dados?: JDParsed; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Arquivo não encontrado" };
  if (!file.name.toLowerCase().endsWith(".docx"))
    return { ok: false, error: "Apenas arquivos .docx são suportados" };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY não configurada" };

  const buffer = Buffer.from(await file.arrayBuffer());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = (await import("mammoth")) as any;
  let text: string;
  try {
    const extracted = (await mammoth.extractRawText({ buffer })) as { value: string };
    text = extracted.value;
  } catch (e) {
    console.error("[parseJobDescription] mammoth error:", e);
    return { ok: false, error: "Erro ao ler o arquivo .docx" };
  }

  if (!text.trim()) return { ok: false, error: "Arquivo sem texto legível" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Anthropic = ((await import("@anthropic-ai/sdk")) as any).default;
  const client = new Anthropic({ apiKey }) as {
    messages: {
      create: (p: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text?: string }> }>;
    };
  };

  const response = await client.messages.create({
    model: process.env.CURRICULO_PARSING_MODEL ?? "claude-opus-4-8",
    max_tokens: 2048,
    messages: [
      { role: "user", content: JD_PARSING_PROMPT.replace("{{TEXT}}", text.slice(0, 8000)) },
    ],
  });

  const rawText = response.content
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text?: string }) => b.text ?? "")
    .join("");

  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let dados: JDParsed;
  try {
    dados = JSON.parse(cleaned) as JDParsed;
  } catch {
    console.error("[parseJobDescription] JSON parse error:", cleaned.slice(0, 300));
    return { ok: false, error: "Não foi possível extrair os dados da JD. Preencha manualmente." };
  }

  // Sanitize: todos os campos são text — garantir string | null
  const FIELDS = [
    "cargo", "area", "reporte_direto", "objetivo_cargo",
    "resp_gestao_operacional", "resp_gestao_pessoas", "resp_estoque_custos",
    "resp_qualidade_experiencia", "indicadores_performance",
    "req_formacao", "req_experiencia", "req_conhecimentos_tecnicos",
    "req_competencias_comportamentais", "responsabilidades_sobre_pessoas",
    "condicoes_trabalho", "indicadores_sucesso", "beneficios",
  ] as const;
  for (const f of FIELDS) {
    const v = dados[f];
    (dados as Record<string, unknown>)[f] = typeof v === "string" && v.trim() ? v.trim() : null;
  }

  return { ok: true, dados };
}

export async function excluirJobDescription(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return { ok: false };
  const { error } = await sb.from("job_descriptions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pessoas/vagas");
  return { ok: true };
}

// ─── Tipos ───────────────────────────────────────────────────────

export type VagaStatus =
  | "aberta"
  | "congelada"
  | "fechada"
  | "em_admissao"
  | "cancelada"
  | "teste";

export type FormaContratacao = "CLT" | "PJ" | "freelance" | "temporario" | "estagio";

export type CargoGrupoSel = { id: string; nome: string; sla_dias_uteis: number };

export type VagaRow = {
  id: string;
  description?: string | null;
  title: string | null;
  cargo: string | null;
  area: string | null;
  motivo: string | null;
  motivo_estruturado: MotivoEstruturado | MotivoLegado | null;
  horario_escala: string | null;
  forma_contratacao: FormaContratacao | null;
  periodo_exp_dias: number | null;
  data_solicitacao: string | null;
  status: VagaStatus | null;
  recrutador: string | null;
  observacao: string | null;
  prioridade: string | null;
  sla_dias: number | null;
  responsavel_id: string | null;
  entrevistador_id: string | null;
  substituido_id: string | null;
  salario_min: number | null;
  salario_max: number | null;
  must_have: string | null;
  nice_to_have: string | null;
  unit_id: string | null;
  brand_id: string | null;
  cargo_grupo_id: string | null;
  congelada: boolean;
  cancelada: boolean;
  motivo_congelamento: string | null;
  congelada_em: string | null;
  cancelada_em: string | null;
  created_at: string;
  units?: { name: string } | null;
  brands?: { name: string } | null;
  cargo_grupos?: { nome: string; sla_dias_uteis: number } | null;
  is_active?: boolean;
};

export type DashboardRS = {
  abertas: number;
  candidatos: number;
  entrevistas_semana: number;
  admissoes_90d: number;
};

export type JDRow = {
  id: string;
  tipo_contrato?: string | null;
  cargo: string;
  area: string;
  brand_id: string | null;
  cargo_id: string | null;
  created_at: string;
  updated_at: string;
  // Legado (retrocompatibilidade)
  responsabilidades: string | null;
  requisitos: string | null;
  beneficios: string | null;
  // Campos estruturados (migration 20260721000002)
  reporte_direto: string | null;
  objetivo_cargo: string | null;
  resp_gestao_operacional: string | null;
  resp_gestao_pessoas: string | null;
  resp_estoque_custos: string | null;
  resp_qualidade_experiencia: string | null;
  indicadores_performance: string | null;
  req_formacao: string | null;
  req_experiencia: string | null;
  req_conhecimentos_tecnicos: string | null;
  req_competencias_comportamentais: string | null;
  responsabilidades_sobre_pessoas: string | null;
  condicoes_trabalho: string | null;
  indicadores_sucesso: string | null;
};

/** Colaboradores ativos para selects de Responsável/Entrevistador na vaga. */
export async function getEmployeesRS(): Promise<{ id: string; nome: string }[]> {
  try {
    const sb = await createSupabaseServerClient();
    if (!sb) return [];
    const { data } = await sb
      .from("employees")
      .select("id, nome, sobrenome")
      .eq("ativo", true)
      .order("nome");
    return ((data ?? []) as { id: string; nome: string; sobrenome: string | null }[]).map((e) => ({
      id: e.id,
      nome: `${e.nome} ${e.sobrenome ?? ""}`.trim(),
    }));
  } catch {
    return [];
  }
}
