"use server";

import { createSupabaseServerClient, createServiceClient } from "@kph/db/supabase/server";
import { requireRole } from "@kph/auth/server";
import { revalidatePath } from "next/cache";
import { normalizarTelefone, toE164Br, isNumeroWhatsAppValido } from "@/lib/pessoas/utils";
import { enviarWhatsApp } from "@/lib/pessoas/whatsapp";
import {
  isGoogleConfigured,
  criarEventoCalendar,
  atualizarEventoCalendar,
  cancelarEventoCalendar,
  getEventSummary,
} from "@/lib/google/calendar";

export type { CandidatoStatus } from "@/lib/pessoas/recrutamento-config";
import type { CandidatoStatus } from "@/lib/pessoas/recrutamento-config";

// Forward declarations so Candidato can reference Agendamento
export type Agendamento = {
  id: string;
  candidate_id: string;
  tipo: 'entrevista' | 'teste_pratico';
  data_hora: string;
  duracao_min: number;
  modalidade: 'presencial' | 'video' | 'telefone' | null;
  local: string | null;
  unit_id: string | null;
  responsavel_id: string | null;
  status: 'agendado' | 'realizado' | 'cancelado' | 'nao_compareceu';
  observacoes: string | null;
  google_event_id: string | null;
  google_meet_link: string | null;
  transcricao_drive_id: string | null;
  resumo_ia: ParecerIA | null;
  roteiro_entrevista: RoteiroEntrevista | null;
  created_at: string;
};

export type CriterioIA = {
  nota: number | null;
  evidencia: string;
};

export type ParecerIA = {
  resumo_geral: string;
  experiencia_relevante: string;
  fit_cultural: string;
  pontos_fortes: string[];
  pontos_atencao: string[];
  recomendacao: 'contratar' | 'avaliar' | 'nao_contratar';
  recomendacao_justificativa: string;
  gerado_em: string;
  modelo: string;
  // Adicionados na Fase 4b — nota_ia + 8 critérios
  nota_ia?: number | null;
  criterios_avaliados?: number;
  criterios_total?: number;
  criterios?: {
    clareza_comunicacao: CriterioIA;
    escuta_responsividade: CriterioIA;
    experiencia_relatada: CriterioIA;
    dominio_tecnico: CriterioIA;
    trajetoria_estabilidade: CriterioIA;
    aderencia_ao_cargo: CriterioIA;
    motivacao_interesse: CriterioIA;
    viabilidade_pratica: CriterioIA;
  };
};

export type PerguntaRoteiro = {
  pergunta: string;
  criterio: string;
  dica?: string | null;
};

export type BlocoRoteiro = {
  titulo: string;
  perguntas: PerguntaRoteiro[];
};

export type RoteiroEntrevista = {
  origem: 'jd' | 'fallback';
  cargo: string;
  setor?: string | null;
  grupo?: string | null;
  faixa_salarial?: string | null;
  gerado_em: string;
  blocos: BlocoRoteiro[];
};

export type FeedbackOperacional = {
  id: string;
  candidate_id: string;
  agendamento_id: string | null;
  postura_apresentacao: number | null;
  ritmo_sob_pressao: number | null;
  dominio_tecnico: number | null;
  higiene_seguranca: number | null;
  trabalho_em_equipe: number | null;
  nota_final: number | null;
  parecer: string | null;
  created_at: string;
  updated_at: string;
};

export type PipelineEtapa =
  | "triagem" | "entrevista_rh" | "entrevista_gestor" | "proposta" | "admissao"
  | "triagem_cv" | "agendamento_entrevista" | "entrevista_realizada"
  | "avaliacao_adm" | "agendamento_teste" | "feedback_op" | "decisao";

import type { Experiencia, Formacao, Idioma, CurriculoPayload } from "./curriculo-constants";
import type { JDRow } from "@/app/pessoas/vagas/actions";

export type Candidato = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  nome?: string | null;
  name?: string | null;
  telefone?: string | null;
  access_code?: string | null;
  responsavel_id?: string | null;
  entrevistador_id?: string | null;
  email?: string | null;
  origem: string;
  area_interesse?: string | null;
  status: CandidatoStatus;
  nota_maya?: number | null;
  job_opening_id?: string | null;
  unit_id?: string | null;
  disc_profile?: string | null;
  conversa_id?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at?: string | null;
  welcome_message_sid?: string | null;
  welcome_delivery_status?: string | null;
  welcome_error_code?: string | null;
  welcome_sent_at?: string | null;
  job_openings?: {
    cargo?: string | null;
    title?: string | null;
    area?: string | null;
    cargo_grupo_id?: string | null;
    cargo_grupos?: { sla_dias_uteis: number } | null;
  } | null;
  units?: { name: string } | null;
  candidate_pipeline?: { etapa: string | null; status: string | null; de_status: string | null; para_status: string | null; motivo: string | null; autor_id: string | null; autor?: { nome: string; sobrenome: string } | { nome: string; sobrenome: string }[] | null; created_at: string }[];
  agendamentos?: Agendamento[];
  // Currículo (R&S-2 FASE 1)
  escolaridade_nivel?: string | null;
  pretensao_salarial?: number | null;
  disponibilidade_inicio?: string | null;
  turnos_disponiveis?: string[] | null;
  cidade?: string | null;
  bairro?: string | null;
  cv_storage_path?: string | null;
  experiencias?: Experiencia[] | null;
  formacoes?: Formacao[] | null;
  idiomas?: Idioma[] | null;
  habilidades?: string[] | null;
  // R&S-2 FASE 3b — Entrevista Diretoria
  cargo_id?: string | null;
  requer_entrevista_diretoria?: boolean | null;
  cargo?: { requer_entrevista_diretoria?: boolean | null } | null;
  // Sprint A+B — elo candidato→employee (Passo 0)
  employee_id?: string | null;
  promovido_em?: string | null;
};

export type VagaBasic = {
  id: string;
  cargo?: string | null;
  title?: string | null;
  area?: string | null;
  status?: string | null;
  congelada?: boolean;
  cancelada?: boolean;
  cargo_grupo_id?: string | null;
};

export async function getCandidatos(vagaId?: string): Promise<Candidato[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    let q = (supabase as any)
      .from("candidates")
      .select("*, requer_entrevista_diretoria, cargo_id, job_openings(cargo, title, area, cargo_grupo_id, cargo_grupos(sla_dias_uteis)), units(name), candidate_pipeline(etapa, status, de_status, para_status, motivo, created_at), candidate_agendamentos(id, tipo, data_hora, status, modalidade, google_meet_link, duracao_min, transcricao_drive_id, resumo_ia, roteiro_entrevista)")
      .order("created_at", { ascending: false });
    if (vagaId) q = q.eq("job_opening_id", vagaId);
    const { data } = await q;
    const candidatos = (data ?? []) as unknown as Candidato[];

    // candidates.cargo_id não tem FK para cargos → PostgREST não auto-join. Query separada.
    const cargoIds = [...new Set(candidatos.map((c) => c.cargo_id).filter((id): id is string => !!id))];
    const cargoMap: Record<string, { requer_entrevista_diretoria: boolean | null }> = {};
    if (cargoIds.length > 0) {
      const { data: cargosData } = await (supabase as any)
        .from("cargos")
        .select("id, requer_entrevista_diretoria")
        .in("id", cargoIds);
      for (const c of (cargosData ?? []) as { id: string; requer_entrevista_diretoria: boolean | null }[]) {
        cargoMap[c.id] = { requer_entrevista_diretoria: c.requer_entrevista_diretoria };
      }
    }

    return candidatos.map((c) =>
      mapCandidato({ ...c, cargo: c.cargo_id ? (cargoMap[c.cargo_id] ?? null) : null } as Candidato & { candidate_agendamentos?: Agendamento[] })
    );
  } catch (e) {
    console.error("[getCandidatos]", e);
    return [];
  }
}

export async function getVagasParaFiltro(): Promise<VagaBasic[]> {
  try {
    // Service client: lookup de vagas para dropdown — auth feita em requireRole() na página
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (createServiceClient() as any)
      .from("job_openings")
      .select("id, cargo, title, area, status, congelada, cancelada, cargo_grupo_id")
      .eq("congelada", false)
      .eq("cancelada", false)
      .in("status", ["aberta", "em_admissao", "teste"])
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as VagaBasic[];
  } catch (e) {
    console.error("[getVagasParaFiltro]", e);
    return [];
  }
}

// Mapeamento candidates.status → candidate_pipeline (etapa + status de entrada)
const ETAPA_POR_STATUS: Partial<Record<CandidatoStatus, { etapa: PipelineEtapa; status: "pendente" | "aprovado" | "reprovado" }>> = {
  // Funil novo (11 etapas)
  avaliacao_administrativa: { etapa: "avaliacao_adm",      status: "pendente" },
  feedback_operacional:     { etapa: "feedback_op",        status: "pendente" },
  contratado:               { etapa: "admissao",           status: "aprovado" },
  aprovado:                 { etapa: "admissao",           status: "aprovado" },
  // Legado (mantido para não quebrar tela existente)
  triagem:    { etapa: "triagem",       status: "pendente" },
  entrevista: { etapa: "entrevista_rh", status: "pendente" },
};

// ── Entrevista Diretoria: routing e toggle ────────────────────────────────────

export async function computarProximoDeAvaliacao(
  candidatoId: string
): Promise<"entrevista_diretoria" | "agendamento_teste"> {
  const sb = createServiceClient();
  if (!sb) return "entrevista_diretoria"; // safe default

  const { data: cand } = await (sb as any)
    .from("candidates")
    .select("requer_entrevista_diretoria, cargo_id")
    .eq("id", candidatoId)
    .maybeSingle();

  if (!cand) return "entrevista_diretoria";

  // Priority 1: manual override on the candidate
  if (cand.requer_entrevista_diretoria !== null && cand.requer_entrevista_diretoria !== undefined) {
    return cand.requer_entrevista_diretoria ? "entrevista_diretoria" : "agendamento_teste";
  }

  // Priority 2: from cargo — query separada porque candidates.cargo_id não tem FK para cargos
  if (cand.cargo_id) {
    const { data: cargo } = await (sb as any)
      .from("cargos")
      .select("requer_entrevista_diretoria")
      .eq("id", cand.cargo_id)
      .maybeSingle();
    const cargoRequer = (cargo as { requer_entrevista_diretoria?: boolean | null } | null)?.requer_entrevista_diretoria;
    if (cargoRequer !== null && cargoRequer !== undefined) {
      return cargoRequer ? "entrevista_diretoria" : "agendamento_teste";
    }
  }

  // Priority 3: no cargo_id → corporate/diretoria default
  return "entrevista_diretoria";
}

export async function setRequerDiretoria(
  candidatoId: string,
  valor: boolean | null
): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return { ok: false };

  const { error } = await (sb as any)
    .from("candidates")
    .update({ requer_entrevista_diretoria: valor })
    .eq("id", candidatoId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/pessoas/recrutamento");
  revalidatePath(`/pessoas/recrutamento/${candidatoId}`);
  return { ok: true };
}

export async function avancarEtapa(
  candidatoId: string,
  novoStatus: CandidatoStatus
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return { ok: false };

  // Gate: sair de avaliacao_administrativa exige os 4 fatores do score card RH
  if (novoStatus === "agendamento_teste" || novoStatus === "entrevista_diretoria") {
    const { data: av } = await (sb as any)
      .from("candidate_avaliacao")
      .select("aderencia_skills, experiencia, entrevista_tec, entrevista_comp")
      .eq("candidate_id", candidatoId)
      .maybeSingle();
    const av_ = av as { aderencia_skills: number | null; experiencia: number | null; entrevista_tec: number | null; entrevista_comp: number | null } | null;
    if (!av_ || av_.aderencia_skills === null || av_.experiencia === null || av_.entrevista_tec === null || av_.entrevista_comp === null) {
      return { ok: false, error: "Preencha os 4 fatores da Avaliação Administrativa antes de avançar." };
    }
  }

  // Gate: entrar em entrevista exige agendamento tipo entrevista com status realizado
  if (novoStatus === "entrevista") {
    const { data: ag } = await (sb as any)
      .from("candidate_agendamentos")
      .select("id")
      .eq("candidate_id", candidatoId)
      .eq("tipo", "entrevista")
      .eq("status", "realizado")
      .maybeSingle();
    if (!ag) {
      return { ok: false, error: "Registre um agendamento de entrevista com status 'realizado' antes de avançar." };
    }
  }

  // Gate: sair de feedback_operacional exige os 5 fatores do gestor
  if (novoStatus === "decisao") {
    const { data: fb } = await (sb as any)
      .from("candidate_feedback_operacional")
      .select("postura_apresentacao, ritmo_sob_pressao, dominio_tecnico, higiene_seguranca, trabalho_em_equipe")
      .eq("candidate_id", candidatoId)
      .maybeSingle();
    const fb_ = fb as {
      postura_apresentacao: number | null; ritmo_sob_pressao: number | null;
      dominio_tecnico: number | null; higiene_seguranca: number | null; trabalho_em_equipe: number | null;
    } | null;
    if (!fb_ || fb_.postura_apresentacao === null || fb_.ritmo_sob_pressao === null ||
        fb_.dominio_tecnico === null || fb_.higiene_seguranca === null || fb_.trabalho_em_equipe === null) {
      return { ok: false, error: "Preencha os 5 fatores do Feedback Operacional antes de avançar para Decisão." };
    }
  }

  // Gate: entrar em feedback_operacional exige agendamento de teste prático realizado
  if (novoStatus === "feedback_operacional") {
    const { data: ag } = await (sb as any)
      .from("candidate_agendamentos")
      .select("id")
      .eq("candidate_id", candidatoId)
      .eq("tipo", "teste_pratico")
      .eq("status", "realizado")
      .maybeSingle();
    if (!ag) {
      return { ok: false, error: "Registre um agendamento de teste prático com status 'realizado' antes de avançar." };
    }
  }

  // Resolve autor_id — null quando bypass ou employee sem user_id cadastrado (esperado)
  const { data: empRow } = await sb
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .maybeSingle();
  const autorId = (empRow as { id: string } | null)?.id ?? null;

  // Lê status anterior para log de transição
  const { data: cur } = await sb
    .from("candidates")
    .select("status")
    .eq("id", candidatoId)
    .maybeSingle();
  const statusAnterior = (cur as { status: CandidatoStatus } | null)?.status ?? null;

  // Server-side routing: avaliacao_administrativa → entrevista_diretoria ou agendamento_teste
  let statusEfetivo: CandidatoStatus = novoStatus;
  if (novoStatus === "entrevista_diretoria") {
    statusEfetivo = await computarProximoDeAvaliacao(candidatoId);
  }

  const { error } = await sb
    .from("candidates")
    .update({ status: statusEfetivo, updated_at: new Date().toISOString() })
    .eq("id", candidatoId);
  if (error) return { ok: false, error: error.message };

  // Grava transição — supabase-js resolve { error }, nunca rejeita; .then(onErr) não funciona
  const etapaEntry = ETAPA_POR_STATUS[statusEfetivo];
  const { error: pipeErr } = await sb.from("candidate_pipeline").insert({
    candidate_id: candidatoId,
    de_status: statusAnterior,
    para_status: statusEfetivo,
    autor_id: autorId,
    ...(etapaEntry ? { etapa: etapaEntry.etapa, status: etapaEntry.status } : {}),
  } as never);
  if (pipeErr) {
    console.error("[avancarEtapa] pipeline insert", pipeErr);
    throw new Error(pipeErr.message);
  }

  revalidatePath("/pessoas/recrutamento");
  revalidatePath(`/pessoas/recrutamento/${candidatoId}`);
  return { ok: true };
}

export async function registrarEtapaPipeline(
  candidatoId: string,
  etapa: PipelineEtapa,
  status: "pendente" | "aprovado" | "reprovado"
): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return { ok: false };
  const { error } = await sb.from("candidate_pipeline").insert({
    candidate_id: candidatoId,
    etapa,
    status,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pessoas/recrutamento");
  return { ok: true };
}

export async function getCandidato(id: string): Promise<Candidato | null> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await (supabase as any)
      .from("candidates")
      .select("*, requer_entrevista_diretoria, cargo_id, job_openings(cargo, title, area, status), units(name), candidate_pipeline(etapa, status, de_status, para_status, motivo, autor_id, autor:employees!autor_id(nome, sobrenome), created_at)")
      .eq("id", id)
      .single();
    if (!data) return null;
    const cand = data as unknown as Candidato;

    // candidates.cargo_id não tem FK para cargos → query separada
    let cargo: { requer_entrevista_diretoria?: boolean | null } | null = null;
    if (cand.cargo_id) {
      const { data: cargoData } = await (supabase as any)
        .from("cargos")
        .select("requer_entrevista_diretoria")
        .eq("id", cand.cargo_id)
        .maybeSingle();
      cargo = (cargoData as { requer_entrevista_diretoria?: boolean | null } | null) ?? null;
    }

    return mapCandidato({ ...cand, cargo } as Candidato & { candidate_agendamentos?: Agendamento[] });
  } catch (e) {
    console.error("[getCandidato]", e);
    return null;
  }
}

// Preenche nome/telefone (lidos pela UI) a partir das colunas reais full_name/phone.
function mapCandidato(c: Candidato & { candidate_agendamentos?: Agendamento[] }): Candidato {
  return {
    ...c,
    nome: c.nome ?? c.full_name ?? c.name ?? null,
    telefone: c.telefone ?? c.phone ?? null,
    agendamentos: c.candidate_agendamentos ?? [],
  };
}

export type FonteCandidato =
  | "maya"
  | "portal"
  | "indicacao_colaborador"
  | "indicacao"
  | "linkedin"
  | "indeed"
  | "catho"
  | "vagas_com_br"
  | "infojobs"
  | "instagram"
  | "mutirao"
  | "busca_ativa"
  | "banco_talentos_reativado"
  | "escola"
  | "sindicato"
  | "abordagem"
  | "manual"
  | "outro"
  // R&S-2: novas origens
  | "whatsapp"
  | "consultoria"
  | "ex_colaborador"
  | "cv_loja"
  | "cv_email"
  | "cat"
  | "ong"
  | "closeer"
  | "facebook";

/** Registro manual de candidato (indicação/mutirão/portal/etc). Upsert por telefone. */
export async function createCandidate(data: {
  full_name: string;
  phone: string;
  email?: string | null;
  area_interesse: string;
  cargo_id?: string | null;
  origem: FonteCandidato;
  job_opening_id?: string | null;
  unit_id?: string | null;
  observacoes?: string | null;
}): Promise<{ success: boolean; error?: string; candidate_id?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { success: false, error: "Sem conexão" };

    const nome = data.full_name?.trim();
    const phone = normalizarTelefone(data.phone);
    if (!nome) return { success: false, error: "Nome é obrigatório" };
    if (!phone) return { success: false, error: "Telefone é obrigatório" };
    if (!data.area_interesse?.trim()) return { success: false, error: "Cargo pretendido é obrigatório" };
    if (!data.origem) return { success: false, error: "Fonte do candidato é obrigatória" };

    // Resolve origem_id via FK para registrar a fonte estruturada
    const { data: origemRow } = await sb
      .from("origens_candidato")
      .select("id")
      .eq("codigo", data.origem)
      .single();

    const { data: row, error } = await (sb as any)
      .from("candidates")
      .upsert(
        {
          full_name: nome,
          phone,
          email: data.email?.trim().toLowerCase() || null,
          area_interesse: data.area_interesse.trim(),
          cargo_id: data.cargo_id ?? null,
          origem: data.origem,
          origem_id: origemRow?.id ?? null,
          status: "novo",
          job_opening_id: data.job_opening_id || null,
          unit_id: data.unit_id || null,
          observacoes: data.observacoes?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "phone,job_opening_id" },
      )
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/pessoas/recrutamento");
    return { success: true, candidate_id: row?.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export type RecrutamentoOptions = {
  units: { id: string; name: string }[];
  cargos: string[];
};

/** Unidades + cargos sugeridos (distinct de job_openings) para o modal de novo candidato. */
export async function getRecrutamentoOptions(): Promise<RecrutamentoOptions> {
  try {
    // Service client: lookup de units e cargos para dropdowns — auth feita em requireRole() na página
    const sb = createServiceClient();
    if (!sb) return { units: [], cargos: [] };
    const [{ data: units }, { data: vagas }] = await Promise.all([
      sb.from("units").select("id, name").eq("active", true).order("name"),
      (sb as any).from("job_openings").select("cargo").not("cargo", "is", null),
    ]);
    const cargos = Array.from(
      new Set(((vagas ?? []) as { cargo: string | null }[]).map((v) => (v.cargo ?? "").trim()).filter(Boolean)),
    ).sort();
    return { units: (units ?? []) as { id: string; name: string }[], cargos };
  } catch (e) {
    console.error("[getRecrutamentoOptions]", e);
    return { units: [], cargos: [] };
  }
}

/**
 * Aprova e contrata candidato em um único passo:
 * A) cria employee (idempotente por telefone; sem telefone cria sem campo)
 * B) upsert contatos_kph (pulado se sem telefone)
 * C) cria onboarding_run pré-preenchido
 * D) notificação WhatsApp via Maya — template quando TWILIO_WELCOME_TEMPLATE_SID configurado
 * E) atualiza status do candidato → 'aprovado' + grava welcome_message_sid/welcome_sent_at
 */
export async function contratarCandidato(
  candidatoId: string,
): Promise<{ ok: boolean; employeeId?: string; nome?: string; notificacao_ok?: boolean; welcome_message_sid?: string | null; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    // 1. Carregar candidato
    const { data: cand, error: cErr } = await sb
      .from("candidates")
      .select("id, full_name, phone, email, unit_id, area_interesse, status")
      .eq("id", candidatoId)
      .single();
    if (cErr || !cand) return { ok: false, error: "Candidato não encontrado" };

    const raw = cand as {
      id: string;
      full_name: string | null;
      phone: string | null;
      email: string | null;
      unit_id: string | null;
      area_interesse: string | null;
      status: CandidatoStatus | null;
    };

    // 2. Telefone canônico — espelha norm_fone_br() do banco
    const telefone = normalizarTelefone(raw.phone ?? "");
    // Sem telefone → contratação prossegue, notificação pulada

    // 3. Dividir full_name → nome + sobrenome
    const partes = (raw.full_name ?? "").trim().split(/\s+/);
    const nome = partes[0] ?? "";
    const sobrenome = partes.slice(1).join(" "); // "" quando nome único — NOT NULL, não pode ser null

    // Bloquear contratação com nome incompleto — previne employee "fantasma" sem sobrenome real.
    // candidates.cpf não existe ainda; validação de CPF será adicionada junto com a coluna.
    if (!nome || sobrenome.length < 2) {
      return {
        ok: false,
        error: `Nome incompleto no cadastro do candidato ("${raw.full_name ?? ""}"). ` +
               `Corrija o nome completo (mínimo: nome e sobrenome com 2+ caracteres) antes de contratar.`,
      };
    }

    // 4. Idempotência: employee já existe pelo telefone?
    let employeeId: string;
    const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const empPayload: Record<string, any> = {
      nome,
      sobrenome,
      data_admissao: hoje,
      ativo: true,
      status_rh: "ativo",
    };
    if (telefone) empPayload.telefone = telefone;
    if (raw.email) empPayload.email = raw.email;
    if (raw.unit_id) empPayload.unit_id = raw.unit_id;
    if (raw.area_interesse) empPayload.funcao = raw.area_interesse;

    if (telefone) {
      const { data: empExist } = await sb
        .from("employees")
        .select("id")
        .eq("telefone", telefone)
        .maybeSingle();
      if (empExist) {
        employeeId = (empExist as { id: string }).id;
      } else {
        const { data: novoEmp, error: empErr } = await sb
          .from("employees")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(empPayload as any)
          .select("id")
          .single();
        if (empErr || !novoEmp) return { ok: false, error: empErr?.message ?? "Falha ao criar colaborador" };
        employeeId = (novoEmp as { id: string }).id;
      }
    } else {
      const { data: novoEmp, error: empErr } = await sb
        .from("employees")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(empPayload as any)
        .select("id")
        .single();
      if (empErr || !novoEmp) return { ok: false, error: empErr?.message ?? "Falha ao criar colaborador" };
      employeeId = (novoEmp as { id: string }).id;
    }

    // 5. Upsert contatos_kph — fonte única de telefone→nome para o back-office
    if (telefone) {
      await sb.from("contatos_kph").upsert(
        {
          telefone,
          nome: raw.full_name,
          tipo: "colaborador",
          employee_id: employeeId,
          candidate_id: candidatoId,
        },
        { onConflict: "telefone" },
      );
    }

    // 6. Onboarding pré-preenchido (idempotente via UNIQUE employee_id+template_id)
    if (raw.unit_id) {
      const { data: tmpl } = await sb
        .from("onboarding_templates")
        .select("id")
        .eq("unit_id", raw.unit_id)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();
      if (tmpl) {
        const hoje2 = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
        await sb.from("onboarding_runs").upsert(
          {
            employee_id: employeeId,
            template_id: (tmpl as { id: string }).id,
            unit_id: raw.unit_id,
            status: "em_andamento",
            data_inicio: hoje2,
          },
          { onConflict: "employee_id,template_id" },
        );
      }
    }

    // 7. Atualizar status do candidato → contratado
    await sb
      .from("candidates")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ status: "contratado", employee_id: employeeId, updated_at: new Date().toISOString() } as any)
      .eq("id", candidatoId);

    // 7b. Registrar etapa admissão — idempotente: ignora se já existe aprovada
    const { data: admissaoExistente } = await (sb as unknown as { from: (t: string) => any })
      .from("candidate_pipeline")
      .select("id")
      .eq("candidate_id", candidatoId)
      .eq("etapa", "admissao")
      .eq("status", "aprovado")
      .maybeSingle();
    if (!admissaoExistente) {
      const { error: pipeErr } = await sb.from("candidate_pipeline").insert({
        candidate_id: candidatoId,
        etapa: "admissao",
        status: "aprovado",
        de_status: raw.status,
        para_status: "contratado",
      } as never);
      if (pipeErr) {
        console.error("[contratarCandidato] pipeline insert", pipeErr);
        throw new Error(pipeErr.message);
      }
    }

    // 8. Boas-vindas via Maya — template aprovado (TWILIO_WELCOME_TEMPLATE_SID) ou falha graciosa
    let notificacao_ok = false;
    let welcome_message_sid: string | null = null;
    let welcome_delivery_status_inicial: string | null = null;
    if (telefone && !isNumeroWhatsAppValido(telefone)) {
      console.warn(`[contratarCandidato] número inválido (${telefone}) — boas-vindas não enviada`);
      welcome_delivery_status_inicial = "invalid_number";
    } else if (telefone) {
      const templateSid = process.env.TWILIO_WELCOME_TEMPLATE_SID;
      if (!templateSid || !process.env.MAYA_BACKEND_URL || !process.env.TWILIO_STATUS_CALLBACK_URL) {
        console.warn("[contratarCandidato] TWILIO_WELCOME_TEMPLATE_SID não configurado — boas-vindas não enviada");
      } else {
        const mayaUrl = process.env.MAYA_BACKEND_URL!;
        const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL!;
        try {
          const res = await fetch(`${mayaUrl}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: toE164Br(telefone),
              message: `Oi, ${nome}! Que alegria ter você na equipe! 🎉 Acompanhei sua jornada até aqui e estou muito feliz com o resultado. Seu processo de integração já começou — o Theo, nosso assistente de RH, fica à disposição para holerite, férias e o que mais precisar. Seja muito bem-vindo(a)! — Maya`,
              operator_name: "Sistema PIPOU",
              content_sid: templateSid,
              content_variables: { "1": nome },
              status_callback: statusCallbackUrl,
            }),
          });
          if (res.ok) {
            const data = await res.json() as { ok: boolean; message_sid?: string | null };
            notificacao_ok = data.ok;
            welcome_message_sid = data.message_sid ?? null;
          } else {
            console.warn(`[contratarCandidato] /send status ${res.status}`);
          }
        } catch (err) {
          console.error("[contratarCandidato] Falha na notificação:", err);
        }
      }
    }

    // 9. Grava MessageSid + timestamp + status inicial (invalid_number quando aplicável)
    const welcomePatch: Record<string, unknown> = {
      welcome_sent_at: new Date().toISOString(),
    };
    if (welcome_message_sid) welcomePatch.welcome_message_sid = welcome_message_sid;
    if (welcome_delivery_status_inicial) welcomePatch.welcome_delivery_status = welcome_delivery_status_inicial;
    await (sb as unknown as { from: (t: string) => any })
      .from("candidates")
      .update(welcomePatch)
      .eq("id", candidatoId);

    revalidatePath("/pessoas/recrutamento");
    revalidatePath(`/pessoas/recrutamento/${candidatoId}`);
    return { ok: true, employeeId, nome, notificacao_ok, welcome_message_sid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

/** Move candidato para estágio final (reprovado/desistiu/banco_talentos). Registra transição no pipeline. */
export async function moverCandidato(
  candidatoId: string,
  novoStatus: CandidatoStatus,
  observacao?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { success: false, error: "Sem conexão" };

    // Resolve autor_id — null quando bypass ou employee sem user_id cadastrado (esperado)
    const { data: empRow } = await sb
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .eq("ativo", true)
      .maybeSingle();
    const autorId = (empRow as { id: string } | null)?.id ?? null;

    // Busca status atual + dados para WA dispatch
    const { data: cur, error: curErr } = await sb
      .from("candidates")
      .select("status, full_name, phone, area_interesse, job_openings(cargo, title)")
      .eq("id", candidatoId)
      .maybeSingle();
    if (curErr) console.error("[moverCandidato] candidato query falhou:", curErr.message);
    const statusAnterior = (cur as { status: CandidatoStatus } | null)?.status;

    const patch: { status: CandidatoStatus; updated_at: string; observacoes?: string } = {
      status: novoStatus,
      updated_at: new Date().toISOString(),
    };
    if (observacao && observacao.trim()) patch.observacoes = observacao.trim();
    const { error } = await sb.from("candidates").update(patch).eq("id", candidatoId);
    if (error) return { success: false, error: error.message };

    // Grava transição — todos os 7 destinos (fix: antes só reprovado/desistiu)
    // supabase-js resolve { error }, nunca rejeita; .then(onErr) não funcionava
    const { error: pipeErr } = await sb.from("candidate_pipeline").insert({
      candidate_id: candidatoId,
      de_status: statusAnterior,
      para_status: novoStatus,
      motivo: observacao?.trim() ?? null,
      autor_id: autorId,
    } as never);
    if (pipeErr) {
      console.error("[moverCandidato] pipeline insert", pipeErr);
      throw new Error(pipeErr.message);
    }

    // WA dispatch 2 — triagem (fire-and-forget; falha não aborta a movimentação)
    if (novoStatus === 'triagem') {
      const curAny = cur as Record<string, unknown> | null;
      const tel = (curAny?.phone ?? null) as string | null;
      if (tel) {
        const nomeWA = (curAny?.full_name ?? 'Candidato') as string;
        const jobOpenings = curAny?.job_openings as { cargo?: string | null; title?: string | null } | null;
        const cargoWA = (curAny?.area_interesse ?? jobOpenings?.cargo ?? jobOpenings?.title ?? 'Pipou') as string;
        enviarWhatsApp({
          telefone: normalizarTelefone(tel),
          templateEnvVar: 'TWILIO_TEMPLATE_TRIAGEM_SID',
          variables: { '1': nomeWA, '2': cargoWA },
        }).catch(err => console.error('[moverCandidato] WA triagem falhou:', err));
      }
    }

    revalidatePath("/pessoas/recrutamento");
    revalidatePath("/pessoas/recrutamento/banco-talentos");
    revalidatePath(`/pessoas/recrutamento/${candidatoId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

/** Candidatos aprovados cuja boas-vindas não foi entregue — painel de exceções RH. */
export async function getCandidatosEntregaFalha(): Promise<
  { id: string; nome: string | null; telefone: string | null; welcome_delivery_status: string | null; welcome_error_code: string | null; welcome_sent_at: string | null }[]
> {
  try {
    const sb = createServiceClient();
    if (!sb) return [];
    const { data } = await sb
      .from("candidates")
      .select("id, full_name, phone, welcome_delivery_status, welcome_error_code, welcome_sent_at")
      .eq("status", "contratado")
      .or("welcome_message_sid.is.null,welcome_delivery_status.in.(undelivered,failed)")
      .order("welcome_sent_at", { ascending: false })
      .limit(50);
    return ((data ?? []) as unknown as Array<{
      id: string;
      full_name: string | null;
      phone: string | null;
      welcome_delivery_status: string | null;
      welcome_error_code: string | null;
      welcome_sent_at: string | null;
    }>).map((r) => ({
      id: r.id,
      nome: r.full_name,
      telefone: r.phone,
      welcome_delivery_status: r.welcome_delivery_status,
      welcome_error_code: r.welcome_error_code,
      welcome_sent_at: r.welcome_sent_at,
    }));
  } catch (e) {
    console.error("[getCandidatosEntregaFalha]", e);
    return [];
  }
}

// ── Banco de Talentos: busca pesquisável ─────────────────────────────────────

export type TalentoFiltros = {
  termo?: string;
  cargo?: string;
  cidade?: string;
  escolaridade?: string;
  habilidade?: string;
  turno?: string;
  incluirAtivos?: boolean;      // legado — ignorado quando statusSelecionados presente
  incluirDesistentes?: boolean; // legado — ignorado quando statusSelecionados presente
  statusSelecionados?: string[]; // array explícito de status; se presente, substitui flags acima
  offset?: number;
};

export type TalentoBasic = {
  id: string;
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  area_interesse: string | null;
  cidade: string | null;
  escolaridade_nivel: string | null;
  habilidades: string[] | null;
  cv_storage_path: string | null;
  status: CandidatoStatus;
  origem: string;
  created_at: string;
};

/** Novos cadastros no Banco de Talentos nos últimos 7 dias. */
export async function getNovosBancoCount(): Promise<number> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await (sb as any)
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'banco_talentos')
      .gte('created_at', sevenDaysAgo);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function buscarTalentos(
  filtros: TalentoFiltros = {},
): Promise<{ talentos: TalentoBasic[]; total: number }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { talentos: [], total: 0 };

    const {
      termo,
      cargo,
      cidade,
      escolaridade,
      habilidade,
      turno,
      incluirAtivos = false,
      incluirDesistentes = false,
      statusSelecionados,
      offset = 0,
    } = filtros;

    let statuses: string[];
    if (statusSelecionados && statusSelecionados.length > 0) {
      statuses = statusSelecionados;
    } else {
      statuses = ["banco_talentos", "reprovado"];
      if (incluirDesistentes) statuses.push("desistiu");
      if (incluirAtivos) statuses.push(
        "novo", "triagem", "agendamento", "entrevista",
        "avaliacao_administrativa", "agendamento_teste",
        "feedback_operacional", "decisao", "contratado",
        "aprovado", // legado
      );
    }

    // Busca via RPC: habilidade usa unnest+ILIKE (parcial), não match exato de elemento.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any).rpc("buscar_talentos", {
      p_statuses:     statuses,
      p_termo:        termo?.trim()    || null,
      p_cargo:        cargo?.trim()    || null,
      p_cidade:       cidade?.trim()   || null,
      p_escolaridade: escolaridade     || null,
      p_habilidade:   habilidade?.trim() || null,
      p_turno:        turno?.trim()    || null,
      p_limit:        50,
      p_offset:       offset,
    });

    if (error) {
      console.error("[buscarTalentos]", error);
      return { talentos: [], total: 0 };
    }

    const rows = (data ?? []) as Array<{
      id: string;
      full_name: string | null;
      area_interesse: string | null;
      cidade: string | null;
      escolaridade_nivel: string | null;
      habilidades: string[] | null;
      cv_storage_path: string | null;
      status: string;
      origem: string;
      created_at: string;
      total_count: number;
    }>;

    const { data: contacts, error: contactError } = rows.length
      ? await (sb as any).from("candidates").select("id,cpf,phone").in("id", rows.map(r => r.id))
      : { data: [], error: null };
    if (contactError) throw contactError;
    const contactById = new Map<string, {cpf:string|null;phone:string|null}>((contacts ?? []).map((r:{id:string;cpf:string|null;phone:string|null}) => [r.id, r]));
    const total = rows.length > 0 ? Number(rows[0]?.total_count ?? 0) : 0;
    const talentos: TalentoBasic[] = rows.map((r) => ({
      id: r.id,
      nome: r.full_name,
      cpf: contactById.get(r.id)?.cpf ?? null,
      telefone: contactById.get(r.id)?.phone ?? null,
      area_interesse: r.area_interesse,
      cidade: r.cidade,
      escolaridade_nivel: r.escolaridade_nivel,
      habilidades: r.habilidades,
      cv_storage_path: r.cv_storage_path,
      status: r.status as CandidatoStatus,
      origem: r.origem,
      created_at: r.created_at,
    }));

    return { talentos, total };
  } catch (e) {
    console.error("[buscarTalentos]", e);
    return { talentos: [], total: 0 };
  }
}

// ── Gestão de vagas: congelar / cancelar ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFrom = { from: (t: string) => any };

export async function congelarVaga(
  vagaId: string,
  motivo: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient() as unknown as AnyFrom | null;
  if (!sb) return { ok: false, error: "Sem conexão" };
  const { error } = await sb
    .from("job_openings")
    .update({
      congelada: true,
      motivo_congelamento: motivo.trim(),
      congelada_em: new Date().toISOString(),
    })
    .eq("id", vagaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pessoas/recrutamento");
  revalidatePath("/pessoas/vagas");
  return { ok: true };
}

export async function cancelarVaga(
  vagaId: string,
  motivo: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient() as unknown as AnyFrom | null;
  if (!sb) return { ok: false, error: "Sem conexão" };
  const { error } = await sb
    .from("job_openings")
    .update({
      cancelada: true,
      status: "cancelada",
      motivo_congelamento: motivo.trim(),
      cancelada_em: new Date().toISOString(),
    })
    .eq("id", vagaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pessoas/recrutamento");
  revalidatePath("/pessoas/vagas");
  return { ok: true };
}

export async function descongelarVaga(vagaId: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient() as unknown as AnyFrom | null;
  if (!sb) return { ok: false, error: "Sem conexão" };
  const { error } = await sb
    .from("job_openings")
    .update({ congelada: false, motivo_congelamento: null, congelada_em: null })
    .eq("id", vagaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/pessoas/recrutamento");
  revalidatePath("/pessoas/vagas");
  return { ok: true };
}

// ── Currículo candidato (R&S-2 FASE 1) ────────────────────────────────────

import { ESCOLARIDADE_SLUGS, ESCOLARIDADE_LABEL } from "./curriculo-constants";

export async function updateCandidatoCurriculo(
  candidateId: string,
  payload: {
    escolaridade_nivel?: string | null;
    pretensao_salarial?: number | null;
    disponibilidade_inicio?: string | null;
    turnos_disponiveis?: string[];
    cidade?: string | null;
    bairro?: string | null;
    email?: string | null;
    experiencias?: Experiencia[];
    formacoes?: Formacao[];
    idiomas?: Idioma[];
    habilidades?: string[];
  },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    if (
      payload.escolaridade_nivel &&
      !(ESCOLARIDADE_SLUGS as readonly string[]).includes(payload.escolaridade_nivel)
    ) {
      return { ok: false, error: "Escolaridade inválida" };
    }

    const { error } = await sb
      .from("candidates")
      .update({
        escolaridade_nivel: payload.escolaridade_nivel ?? null,
        pretensao_salarial: payload.pretensao_salarial ?? null,
        disponibilidade_inicio: payload.disponibilidade_inicio || null,
        turnos_disponiveis: payload.turnos_disponiveis ?? [],
        cidade: payload.cidade?.trim() || null,
        bairro: payload.bairro?.trim() || null,
        ...(payload.email !== undefined ? { email: payload.email?.trim().toLowerCase() || null } : {}),
        experiencias: payload.experiencias ?? [],
        formacoes: payload.formacoes ?? [],
        idiomas: payload.idiomas ?? [],
        habilidades: payload.habilidades ?? [],
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", candidateId);

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/pessoas/recrutamento/${candidateId}`);
    revalidatePath("/pessoas/recrutamento");
    return { ok: true };
  } catch (e) {
    console.error("[updateCandidatoCurriculo]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function uploadCandidatoCV(
  candidateId: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { ok: false, error: "Nenhum arquivo enviado" };
    if (file.size > 10485760) return { ok: false, error: "Arquivo maior que 10 MB" };

    const ALLOWED = [
      "application/pdf", "image/jpeg", "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!ALLOWED.includes(file.type)) {
      return { ok: false, error: "Formato não suportado. Use PDF, JPG, PNG, DOC ou DOCX." };
    }

    const path = `${candidateId}/cv`;
    const buf = await file.arrayBuffer();
    const { error: uploadErr } = await sb.storage
      .from("candidate-cvs")
      .upload(path, buf, { contentType: file.type, upsert: true });

    if (uploadErr) return { ok: false, error: uploadErr.message };

    const { error } = await sb
      .from("candidates")
      .update({ cv_storage_path: path, updated_at: new Date().toISOString() } as never)
      .eq("id", candidateId);

    if (error) return { ok: false, error: error.message };
    revalidatePath(`/pessoas/recrutamento/${candidateId}`);
    return { ok: true };
  } catch (e) {
    console.error("[uploadCandidatoCV]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function getCandidatoCVUrl(
  candidateId: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };
    const { data, error } = await sb.storage
      .from("candidate-cvs")
      .createSignedUrl(`${candidateId}/cv`, 3600);
    if (error) return { ok: false, error: error.message };
    return { ok: true, url: data.signedUrl };
  } catch (e) {
    console.error("[getCandidatoCVUrl]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

// ── Parsing de CV com IA (R&S-2 FASE 2.5) ─────────────────────────────────

// Slugs válidos para sanitização pós-parse
const TURNO_SLUGS = ["manhã", "tarde", "noite", "madrugada", "fins de semana"] as const;

const CV_EXTRACTION_PROMPT = `Você é um extrator de dados de currículo. Analise o documento e extraia as informações no formato JSON abaixo.

REGRAS OBRIGATÓRIAS:
1. Extraia SOMENTE o que está escrito no documento. Nunca invente ou infira dados ausentes (exceto area_interesse — ver abaixo).
2. Campo ausente ou não encontrado: use null (textos), [] (arrays).
3. Datas de experiência: formato "MM/YYYY". Se só o ano, use "01/YYYY". Emprego atual: fim = null.
4. disponibilidade_inicio: formato "YYYY-MM-DD". Se não mencionada, null.
5. pretensao_salarial: número em reais, sem símbolo ou pontuação (ex: 2500). Se ausente, null.
6. Na dúvida sobre qualquer campo, deixe null/[]. Prefira vazio a impreciso.

DADOS PESSOAIS — extraia do cabeçalho/topo do currículo:
- full_name: nome completo do candidato exatamente como aparece no CV. Se ausente, null.
- phone: telefone ou WhatsApp. RETORNE APENAS OS DÍGITOS (sem máscara, parênteses, traços, espaços). 11 dígitos para celular (DDD+9+número, ex: "11987654321"), 10 para fixo (ex: "1134567890"). Se ausente, null.
- area_interesse: cargo pretendido declarado no CV (objetivo profissional, título de candidatura). Se não declarado explicitamente, INFIRA do cargo mais recente do histórico profissional. Escreva o cargo em português, sem empresa. Se impossível inferir, null.

ESCOLARIDADE — mapeie para UM dos slugs abaixo (exatamente como escrito) ou null se incerto:
- "analfabeto"
- "fundamental_5_incompleto"  → 1º ao 5º ano / Primário incompleto
- "fundamental_5_completo"    → 1º ao 5º ano / Primário completo
- "fundamental_6_9"           → 6º ao 9º ano / Ginásio / Fundamental 2
- "fundamental_completo"      → Fundamental completo (1º ao 9º ano)
- "medio_incompleto"          → Ensino Médio / 2º grau incompleto ou cursando
- "medio_completo"            → Ensino Médio / 2º grau completo
- "superior_incompleto"       → Faculdade / Graduação incompleta ou cursando
- "superior_completo"         → Graduação completa / Bacharelado / Licenciatura / Tecnólogo
- "pos_graduacao"             → Pós-graduação / MBA / Especialização / Mestrado / Doutorado
Se ambíguo ou inexistente: null.

TURNOS — use SOMENTE estes valores literais exatos (com acento onde indicado):
- "manhã"
- "tarde"
- "noite"
- "madrugada"
- "fins de semana"
Apenas inclua se o candidato mencionar explicitamente disponibilidade para aquele turno.

IDIOMAS nivel — use exatamente: "basico", "intermediario", "avancado" ou "fluente".

RETORNE APENAS O JSON A SEGUIR, sem texto antes ou depois, sem marcadores \`\`\`:
{
  "full_name": null,
  "phone": null,
  "area_interesse": null,
  "escolaridade_nivel": null,
  "pretensao_salarial": null,
  "disponibilidade_inicio": null,
  "cidade": null,
  "bairro": null,
  "turnos_disponiveis": [],
  "habilidades": [],
  "experiencias": [
    { "empresa": "", "cargo": "", "inicio": "MM/YYYY", "fim": null, "descricao": null }
  ],
  "formacoes": [
    { "instituicao": "", "curso": "", "nivel": "", "ano_conclusao": null }
  ],
  "idiomas": [
    { "idioma": "", "nivel": "" }
  ]
}`;

// Núcleo reutilizável — aceita buffer já convertido em base64 + mimeType.
// Não exportado (só async functions podem ser exportadas em "use server").
async function parseCurriculoCore(
  base64: string,
  mediaType: string,
): Promise<{ ok: boolean; rascunho?: CurriculoPayload; error?: string }> {
  const SUPPORTED_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const isPDF = mediaType === "application/pdf";
  const isImage = SUPPORTED_IMAGE.includes(mediaType);
  if (!isPDF && !isImage) {
    return {
      ok: false,
      error: `Formato "${mediaType}" não suportado para leitura automática. Use PDF ou imagem (JPG, PNG).`,
    };
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY não configurada no ambiente" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Anthropic = ((await import("@anthropic-ai/sdk")) as any).default;
  const client = new Anthropic({ apiKey, timeout: 55_000 }) as {
    messages: { create: (p: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text?: string }> }> };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileBlock: any = isPDF
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

  const response = await client.messages.create({
    model: process.env.CURRICULO_PARSING_MODEL ?? "claude-opus-4-8",
    max_tokens: 2048,
    messages: [{ role: "user", content: [fileBlock, { type: "text", text: CV_EXTRACTION_PROMPT }] }],
  });

  const rawText = response.content
    .filter(b => b.type === "text")
    .map(b => b.text ?? "")
    .join("");

  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let rascunho: CurriculoPayload;
  try {
    rascunho = JSON.parse(cleaned) as CurriculoPayload;
  } catch {
    console.error("[parseCurriculoCore] JSON parse error:", cleaned.slice(0, 300));
    return { ok: false, error: "Não foi possível extrair os dados do CV. Preencha manualmente." };
  }

  if (rascunho.escolaridade_nivel && !(ESCOLARIDADE_SLUGS as readonly string[]).includes(rascunho.escolaridade_nivel))
    rascunho.escolaridade_nivel = null;
  if (Array.isArray(rascunho.turnos_disponiveis))
    rascunho.turnos_disponiveis = rascunho.turnos_disponiveis.filter(t => (TURNO_SLUGS as readonly string[]).includes(t));
  // Sanitizar telefone: manter apenas dígitos (10 ou 11); descartar se fora do range
  if (rascunho.phone) {
    const digits = rascunho.phone.replace(/\D/g, "");
    rascunho.phone = digits.length >= 10 && digits.length <= 11 ? digits : null;
  }

  return { ok: true, rascunho };
}

// Wrapper FASE 2.5 — baixa do bucket e chama o núcleo.
export async function parseCurriculoFromCV(
  candidateId: string,
): Promise<{ ok: boolean; rascunho?: CurriculoPayload; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };
    const { data: blob, error: dlErr } = await sb.storage
      .from("candidate-cvs")
      .download(`${candidateId}/cv`);
    if (dlErr || !blob) return { ok: false, error: dlErr?.message ?? "CV não encontrado no storage" };
    const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
    return parseCurriculoCore(base64, blob.type);
  } catch (e) {
    console.error("[parseCurriculoFromCV]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado ao analisar CV" };
  }
}

// Wrapper FASE 2.6 — recebe arquivo do modal (sem candidateId ainda).
export async function parseCurriculoFromUpload(
  formData: FormData,
): Promise<{ ok: boolean; rascunho?: CurriculoPayload; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) return { ok: false, error: "Arquivo não encontrado" };
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Arquivo muito grande (máx 10 MB)" };
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    return parseCurriculoCore(base64, file.type);
  } catch (e) {
    console.error("[parseCurriculoFromUpload]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado ao analisar CV" };
  }
}

// ── 5B: Quadro Ideal ─────────────────────────────────────────────────────────

export type GapRow = {
  id: string;
  departamento: string;
  cargo: string;
  grupo: string;
  qtd_alvo: number;
  headcount_atual: number;
  gap: number;
};

export type CargoCanon = {
  id: string;
  nome: string;
  setor: string;
  grupo: string;
  tem_nivel: boolean;
};

export type OrgNodeRaw = {
  id: string;
  nome: string;
  setor: string;
  grupo: string;
  reporta_a_cargo_id: string | null;
  ordem_hierarquia: number | null;
};

// Etapa 2 por turno + Etapa 3 reporte: linha retornada por get_quadro_completo
export type QuadroRow = {
  id: string;
  cargo_id: string;
  cargo_nome: string;
  setor: string;
  grupo: string;
  tem_nivel: boolean;
  alvo_manha: number;
  alvo_tarde: number;
  alvo_noite: number;
  alvo_madrugada: number;
  alvo_intermediario: number;
  qtd_alvo: number;
  headcount_atual: number;
  gap: number;
  reporta_a_cargo_id: string | null;
  reporta_a_nome: string | null;
};

export async function getGapHeadcount(unitId: string): Promise<GapRow[]> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any).rpc("get_gap_headcount", { p_unit_id: unitId });
    if (error) { console.error("[getGapHeadcount]", error); return []; }
    return (data ?? []) as GapRow[];
  } catch (e) {
    console.error("[getGapHeadcount]", e);
    return [];
  }
}

export async function getCargos(): Promise<CargoCanon[]> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any)
      .from("cargos")
      .select("id, nome, setor, grupo, tem_nivel")
      .eq("ativo", true)
      .order("setor")
      .order("nome");
    if (error) { console.error("[getCargos]", error); return []; }
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id:       r.id,
      nome:     r.nome,
      setor:    r.setor,
      grupo:    r.grupo,
      tem_nivel: r.tem_nivel,
    })) as CargoCanon[];
  } catch (e) {
    console.error("[getCargos]", e);
    return [];
  }
}

export async function getQuadroCompleto(unitId: string): Promise<QuadroRow[]> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any).rpc("get_quadro_completo", { p_unit_id: unitId });
    if (error) { console.error("[getQuadroCompleto]", error); return []; }
    return (data ?? []) as QuadroRow[];
  } catch (e) {
    console.error("[getQuadroCompleto]", e);
    return [];
  }
}

export async function adicionarCargoAoQuadro(
  unitId: string,
  cargoId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false };
    // Buscar info do cargo no catálogo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cargo, error: cargoErr } = await (sb as any)
      .from("cargos")
      .select("nome, setor, grupo")
      .eq("id", cargoId)
      .single();
    if (cargoErr || !cargo) return { ok: false, error: "Cargo não encontrado no catálogo" };
    // Resolver cargo_grupo_id pelo nome do grupo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: grp, error: grpErr } = await (sb as any)
      .from("cargo_grupos")
      .select("id")
      .eq("nome", cargo.grupo)
      .single();
    if (grpErr || !grp) return { ok: false, error: `Grupo "${cargo.grupo}" não encontrado em cargo_grupos` };
    // Encerrar linha vigente existente para o mesmo cargo_id na unit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (sb as any)
      .from("quadro_ideal")
      .update({ vigente_ate: new Date().toISOString().split("T")[0] })
      .eq("unit_id", unitId)
      .eq("cargo_id", cargoId)
      .is("vigente_ate", null);
    // Inserir nova linha (turnos iniciam em 0; trigger seta qtd_alvo=0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb as any).from("quadro_ideal").insert({
      unit_id:        unitId,
      cargo_id:       cargoId,
      cargo:          cargo.nome,
      departamento:   cargo.setor,
      cargo_grupo_id: grp.id,
      qtd_alvo:       0,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/pessoas/recrutamento/quadro-ideal");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

export async function salvarQuadroIdeal(
  rows: {
    id: string;
    alvoManha: number;
    alvoTarde: number;
    alvoNoite: number;
    alvoMadrugada: number;
    alvoIntermediario: number;
  }[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    if (rows.length === 0) return { ok: true };
    const sb = createServiceClient();
    if (!sb) return { ok: false };
    for (const row of rows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (sb as any)
        .from("quadro_ideal")
        .update({
          alvo_manha:         row.alvoManha,
          alvo_tarde:         row.alvoTarde,
          alvo_noite:         row.alvoNoite,
          alvo_madrugada:     row.alvoMadrugada,
          alvo_intermediario: row.alvoIntermediario,
          // qtd_alvo atualizado pelo trigger fn_sync_qtd_alvo
        })
        .eq("id", row.id)
        .is("vigente_ate", null);
      if (error) return { ok: false, error: `Linha ${row.id}: ${error.message}` };
    }
    revalidatePath("/pessoas/recrutamento/quadro-ideal");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

export async function getOrganograma(): Promise<OrgNodeRaw[]> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any).rpc("get_organograma");
    if (error) { console.error("[getOrganograma]", error); return []; }
    return (data ?? []) as OrgNodeRaw[];
  } catch (e) {
    console.error("[getOrganograma]", e);
    return [];
  }
}

export async function removerCargoDoQuadro(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb as any)
      .from("quadro_ideal")
      .update({ vigente_ate: new Date().toISOString().split("T")[0] })
      .eq("id", id)
      .is("vigente_ate", null);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/pessoas/recrutamento/quadro-ideal");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

export async function getUnidadesComQuadro(): Promise<{ id: string; name: string }[]> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return [];
    const { data, error } = await sb
      .from("units")
      .select("id, name")
      .eq("active", true)
      .order("name");
    if (error) return [];
    return (data ?? []) as { id: string; name: string }[];
  } catch (e) {
    console.error("[getUnidadesComQuadro]", e);
    return [];
  }
}

// ── 5A: Importação em Massa de CVs ──────────────────────────────────────────

export type ResultadoCV = {
  nomeArquivo: string;
  ok: boolean;
  rascunho?: CurriculoPayload;
  error?: string;
  duplicata?: { tipo: "telefone" | "nome"; candidatoNome: string; candidatoId: string } | null;
};

export async function processarLoteCV(
  formData: FormData,
): Promise<{ resultados: ResultadoCV[]; totalOk: number; totalFalha: number }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { resultados: [], totalOk: 0, totalFalha: 0 };

    const files = formData.getAll("files") as Blob[];
    if (files.length === 0) return { resultados: [], totalOk: 0, totalFalha: 0 };
    const batch = files.slice(0, 20);

    const settled = await Promise.allSettled(
      batch.map(async (file, i): Promise<ResultadoCV> => {
        const nomeArquivo =
          (file as File & { name?: string }).name ?? `arquivo-${i + 1}`;
        try {
          if (file.size > 10 * 1024 * 1024)
            return { nomeArquivo, ok: false, error: "Arquivo muito grande (máx 10 MB)" };

          const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
          const resultado = await parseCurriculoCore(base64, file.type);
          if (!resultado.ok || !resultado.rascunho)
            return { nomeArquivo, ok: false, error: resultado.error ?? "Falha ao extrair dados" };

          let duplicata: ResultadoCV["duplicata"] = null;
          if (resultado.rascunho.phone) {
            const phone = normalizarTelefone(resultado.rascunho.phone);
            if (phone) {
              const { data: dup } = await sb
                .from("candidates")
                .select("id, full_name")
                .eq("phone", phone)
                .maybeSingle();
              if (dup) {
                const d = dup as { id: string; full_name: string | null };
                duplicata = { tipo: "telefone", candidatoNome: d.full_name ?? "?", candidatoId: d.id };
              }
            }
          }
          if (!duplicata && resultado.rascunho.full_name) {
            const { data: dups } = await sb
              .from("candidates")
              .select("id, full_name")
              .ilike("full_name", resultado.rascunho.full_name.trim())
              .limit(1);
            if (dups && dups.length > 0) {
              const d = dups[0] as { id: string; full_name: string | null };
              duplicata = { tipo: "nome", candidatoNome: d.full_name ?? "?", candidatoId: d.id };
            }
          }

          return { nomeArquivo, ok: true, rascunho: resultado.rascunho, duplicata };
        } catch (e) {
          return { nomeArquivo, ok: false, error: e instanceof Error ? e.message : "Erro interno" };
        }
      }),
    );

    const resultados: ResultadoCV[] = settled.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return {
        nomeArquivo: (batch[i] as File & { name?: string }).name ?? `arquivo-${i + 1}`,
        ok: false,
        error: (r.reason as Error)?.message ?? "Erro interno",
      };
    });

    return {
      resultados,
      totalOk: resultados.filter((r) => r.ok).length,
      totalFalha: resultados.filter((r) => !r.ok).length,
    };
  } catch (e) {
    console.error("[processarLoteCV]", e);
    return { resultados: [], totalOk: 0, totalFalha: 0 };
  }
}

export async function confirmarRascunho(params: {
  nome: string;
  phone: string;
  areaInteresse: string;
  cargoId?: string | null;
  origem: FonteCandidato;
  unitId?: string | null;
  jobOpeningId?: string | null;
  curriculo: {
    escolaridade_nivel?: string | null;
    pretensao_salarial?: number | null;
    disponibilidade_inicio?: string | null;
    turnos_disponiveis?: string[];
    cidade?: string | null;
    bairro?: string | null;
    experiencias?: Experiencia[];
    formacoes?: Formacao[];
    idiomas?: Idioma[];
    habilidades?: string[];
  };
}): Promise<{ ok: boolean; candidateId?: string; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const createResult = await createCandidate({
      full_name: params.nome,
      phone: params.phone,
      area_interesse: params.areaInteresse,
      cargo_id: params.cargoId ?? null,
      origem: params.origem,
      unit_id: params.unitId ?? null,
      job_opening_id: params.jobOpeningId ?? null,
    });
    if (!createResult.success || !createResult.candidate_id)
      return { ok: false, error: createResult.error ?? "Erro ao criar candidato" };

    await updateCandidatoCurriculo(createResult.candidate_id, params.curriculo);
    revalidatePath("/pessoas/recrutamento");
    revalidatePath("/pessoas/recrutamento/banco-talentos");
    return { ok: true, candidateId: createResult.candidate_id };
  } catch (e) {
    console.error("[confirmarRascunho]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

// ── Agendamentos ─────────────────────────────────────────────────────────────

export async function getAgendamentos(candidateId: string): Promise<Agendamento[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await (supabase as any)
      .from("candidate_agendamentos")
      .select("id, candidate_id, tipo, data_hora, duracao_min, modalidade, local, unit_id, responsavel_id, status, observacoes, google_event_id, google_meet_link, transcricao_drive_id, resumo_ia, roteiro_entrevista, created_at")
      .eq("candidate_id", candidateId)
      .order("data_hora", { ascending: false });
    if (error) { console.error("[getAgendamentos]", error); return []; }
    return (data ?? []) as Agendamento[];
  } catch (e) {
    console.error("[getAgendamentos]", e);
    return [];
  }
}

export async function criarAgendamento(params: {
  candidate_id: string;
  tipo: 'entrevista' | 'teste_pratico';
  data_hora: string;
  duracao_min?: number;
  modalidade?: string | null;
  local?: string | null;
  unit_id?: string | null;
  observacoes?: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string; googleError?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    // 1. INSERT sempre (não depende do Google)
    const { data, error } = await (sb as any)
      .from("candidate_agendamentos")
      .insert({
        candidate_id: params.candidate_id,
        tipo: params.tipo,
        data_hora: params.data_hora,
        duracao_min: params.duracao_min ?? 60,
        modalidade: params.modalidade ?? null,
        local: params.local ?? null,
        unit_id: params.unit_id ?? null,
        observacoes: params.observacoes ?? null,
        status: "agendado",
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    const agendamentoId = (data as { id: string }).id;

    // 2. Avança status do candidato
    const novoStatus: CandidatoStatus = params.tipo === 'entrevista' ? 'agendamento' : 'agendamento_teste';
    const { error: statusErr } = await (sb as any)
      .from("candidates")
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq("id", params.candidate_id);
    if (statusErr) console.error("[criarAgendamento] status update falhou:", statusErr.message);

    revalidatePath("/pessoas/recrutamento");
    revalidatePath(`/pessoas/recrutamento/${params.candidate_id}`);

    // 3. Google Calendar — try/catch isolado; falha não cancela o agendamento
    let googleError: string | undefined;
    const _gconfigured = isGoogleConfigured();
    console.log("[criarAgendamento:google] isGoogleConfigured=", _gconfigured, "| modalidade=", JSON.stringify(params.modalidade), "| agendamentoId=", agendamentoId);
    if (_gconfigured) {
      console.log("[criarAgendamento:google] ENTROU no bloco Google");
      try {
        // Buscar dados do candidato para o evento
        const { data: cand, error: candErr } = await (sb as any)
          .from("candidates")
          .select("full_name, email, phone, area_interesse, units(name), job_openings(cargo, title)")
          .eq("id", params.candidate_id)
          .maybeSingle();

        if (candErr) throw new Error(`candidato query falhou: ${candErr.message}`);

        const c = cand as {
          full_name?: string | null;
          email?: string | null; phone?: string | null;
          area_interesse?: string | null;
          units?: { name: string } | null;
          job_openings?: { cargo?: string | null; title?: string | null } | null;
        } | null;

        const nomeCandidate = c?.full_name ?? "Candidato";
        const cargoLabel = c?.area_interesse ?? c?.job_openings?.cargo ?? c?.job_openings?.title ?? null;
        const tipoLabel = params.tipo === 'entrevista' ? 'Entrevista' : 'Teste Prático';
        const unidade = c?.units?.name ?? "";
        const tel = c?.phone ?? "";
        // VERCEL_PROJECT_PRODUCTION_URL: env var de sistema do Vercel com o domínio estável de produção
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");

        const descricao = [
          cargoLabel ? `Cargo: ${cargoLabel}` : "",
          unidade ? `Unidade: ${unidade}` : "",
          tel ? `Telefone: ${tel}` : "",
          appUrl ? `Candidato: ${appUrl.replace(/\/$/, "")}/pessoas/recrutamento/${params.candidate_id}` : "",
          params.observacoes ? `\nObservações: ${params.observacoes}` : "",
        ].filter(Boolean).join("\n");

        const modalidade = (params.modalidade ?? null) as 'presencial' | 'video' | 'telefone' | null;
        const convidados = [c?.email].filter((e): e is string => !!e);

        // Título: omitir cargo se ausente; nunca exibir "Cargo não informado" ao candidato
        const tituloEvento = `[Pipou] ${tipoLabel} — ${nomeCandidate}${cargoLabel ? ` — ${cargoLabel}` : ''}`;

        const { eventId, meetLink } = await criarEventoCalendar({
          titulo: tituloEvento,
          descricao,
          local: modalidade === 'presencial' ? (params.local ?? null) : null,
          dataHoraInicio: params.data_hora,
          duracaoMin: params.duracao_min ?? 60,
          modalidade,
          convidados,
        });

        console.log("[criarAgendamento:google] evento criado: eventId=", eventId, "| meetLink=", meetLink);

        // UPDATE com event_id e meet_link
        const { error: updateErr } = await (sb as any)
          .from("candidate_agendamentos")
          .update({ google_event_id: eventId, google_meet_link: meetLink })
          .eq("id", agendamentoId)
          .select("id");
        console.log("[criarAgendamento:google] UPDATE result: error=", updateErr ? JSON.stringify(updateErr) : "null");

        // WA dispatch 3 — confirmação de agendamento em vídeo (fire-and-forget)
        if (modalidade === 'video' && tel && meetLink) {
          const agendaDate = new Date(params.data_hora);
          const dataFmt = agendaDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
          const horaFmt = agendaDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
          const meetCode = meetLink.split('/').pop() ?? '';
          enviarWhatsApp({
            telefone: normalizarTelefone(tel),
            templateEnvVar: 'TWILIO_TEMPLATE_AGENDAMENTO_SID',
            variables: { '1': nomeCandidate, '2': cargoLabel ?? 'Pipou', '3': dataFmt, '4': horaFmt, '5': meetCode },
          }).catch(err => console.error('[criarAgendamento] WA agendamento falhou:', err));
        }

        revalidatePath(`/pessoas/recrutamento/${params.candidate_id}`);
      } catch (gErr) {
        const msg = gErr instanceof Error ? gErr.message : String(gErr);
        console.error("[criarAgendamento] Google Calendar error:", msg);
        googleError = msg;
      }
    }

    // 4. Roteiro de entrevista — aguarda para estar pronto quando a recrutadora abrir o candidato
    if (params.tipo === 'entrevista') {
      console.log("[criarAgendamento:roteiro] iniciando para candidato", params.candidate_id, "| agendamento", agendamentoId);
      try {
        const roteiro = await gerarRoteiroCore(params.candidate_id, sb);
        if (roteiro) {
          console.log("[criarAgendamento:roteiro] gerado com", roteiro.blocos?.length ?? 0, "blocos | origem:", roteiro.origem);
          const { error: roteiroErr } = await (sb as any)
            .from("candidate_agendamentos")
            .update({ roteiro_entrevista: roteiro })
            .eq("id", agendamentoId);
          if (roteiroErr) console.error("[criarAgendamento:roteiro] UPDATE falhou:", roteiroErr.message);
          revalidatePath(`/pessoas/recrutamento/${params.candidate_id}`);
        } else {
          console.error("[criarAgendamento:roteiro] gerarRoteiroCore retornou null — verifique ANTHROPIC_API_KEY no Vercel e logs de [gerarRoteiroCore]");
        }
      } catch (rErr) {
        console.error("[criarAgendamento:roteiro] erro não tratado:", rErr instanceof Error ? rErr.message : String(rErr));
      }
    }

    return { ok: true, id: agendamentoId, googleError };
  } catch (e) {
    console.error("[criarAgendamento]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function marcarAgendamentoRealizado(agendamentoId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };
    const { error } = await (sb as any)
      .from("candidate_agendamentos")
      .update({ status: "realizado", updated_at: new Date().toISOString() })
      .eq("id", agendamentoId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/pessoas/recrutamento");
    return { ok: true };
  } catch (e) {
    console.error("[marcarAgendamentoRealizado]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function getFeedbackOperacional(candidateId: string): Promise<FeedbackOperacional | null> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return null;
    const { data, error } = await (sb as any)
      .from("candidate_feedback_operacional")
      .select("id, candidate_id, agendamento_id, postura_apresentacao, ritmo_sob_pressao, dominio_tecnico, higiene_seguranca, trabalho_em_equipe, nota_final, parecer, created_at, updated_at")
      .eq("candidate_id", candidateId)
      .maybeSingle();
    if (error) { console.error("[getFeedbackOperacional]", error); return null; }
    return (data ?? null) as FeedbackOperacional | null;
  } catch (e) {
    console.error("[getFeedbackOperacional]", e);
    return null;
  }
}

export async function salvarFeedbackOperacional(params: {
  candidateId: string;
  agendamentoId: string | null;
  posturaApresentacao: number | null;
  ritmoSobPressao: number | null;
  dominioTecnico: number | null;
  higieneSeguranca: number | null;
  trabalhoEmEquipe: number | null;
  parecer: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };
    const { error } = await (sb as any).rpc("upsert_feedback_operacional", {
      p_candidate_id:  params.candidateId,
      p_agendamento_id: params.agendamentoId,
      p_postura:       params.posturaApresentacao,
      p_ritmo:         params.ritmoSobPressao,
      p_dominio:       params.dominioTecnico,
      p_higiene:       params.higieneSeguranca,
      p_equipe:        params.trabalhoEmEquipe,
      p_parecer:       params.parecer,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/pessoas/recrutamento/${params.candidateId}`);
    revalidatePath("/pessoas/recrutamento");
    return { ok: true };
  } catch (e) {
    console.error("[salvarFeedbackOperacional]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

// ── Score Card ───────────────────────────────────────────────────────────────

export type AvaliacaoData = {
  aderencia_skills: number | null;
  experiencia: number | null;
  entrevista_tec: number | null;
  entrevista_comp: number | null;
  nota_final: number | null;
  aderencia_ia_sugerida: boolean;
  experiencia_ia_sugerida: boolean;
};

export async function getAvaliacao(candidateId: string): Promise<AvaliacaoData | null> {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const sb = createServiceClient();
  if (!sb) return null;
  const { data } = await (sb as any)
    .from("candidate_avaliacao")
    .select("aderencia_skills, experiencia, entrevista_tec, entrevista_comp, nota_final, aderencia_ia_sugerida, experiencia_ia_sugerida")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  if (!data) return null;
  const d = data as AvaliacaoData;
  return {
    aderencia_skills: d.aderencia_skills,
    experiencia: d.experiencia,
    entrevista_tec: d.entrevista_tec,
    entrevista_comp: d.entrevista_comp,
    nota_final: d.nota_final,
    aderencia_ia_sugerida: d.aderencia_ia_sugerida ?? false,
    experiencia_ia_sugerida: d.experiencia_ia_sugerida ?? false,
  };
}

export async function salvarAvaliacao(params: {
  candidateId: string;
  aderenciaSkills: number | null;
  experiencia: number | null;
  entrevistaTec: number | null;
  entrevistaComp: number | null;
  aderenciaIaSugerida: boolean;
  experienciaIaSugerida: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };
    const { error } = await (sb as any).rpc("upsert_avaliacao", {
      p_candidate_id:   params.candidateId,
      p_aderencia:      params.aderenciaSkills,
      p_experiencia:    params.experiencia,
      p_tec:            params.entrevistaTec,
      p_comp:           params.entrevistaComp,
      p_aderencia_ia:   params.aderenciaIaSugerida,
      p_experiencia_ia: params.experienciaIaSugerida,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/pessoas/recrutamento/${params.candidateId}`);
    return { ok: true };
  } catch (e) {
    console.error("[salvarAvaliacao]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function sugerirFatoresObjetivos(candidateId: string): Promise<{
  ok: boolean;
  aderencia?: number | null;
  aderencia_justificativa?: string;
  experiencia?: number | null;
  experiencia_justificativa?: string;
  error?: string;
}> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    const { data: cand } = await (sb as any)
      .from("candidates")
      .select("area_interesse, habilidades, experiencias")
      .eq("id", candidateId)
      .maybeSingle();
    if (!cand) return { ok: false, error: "Candidato não encontrado" };

    const cand_ = cand as { area_interesse: string | null; habilidades: string[] | null; experiencias: Experiencia[] | null };
    const cargo = cand_.area_interesse ?? "não especificado";
    const habilidades: string[] = cand_.habilidades ?? [];
    const experiencias: Experiencia[] = cand_.experiencias ?? [];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY não configurada" };

    const Anthropic = ((await import("@anthropic-ai/sdk")) as any).default;
    const client = new Anthropic({ apiKey, timeout: 55_000 }) as { messages: { create: (p: unknown) => Promise<{ content: { type: string; text: string }[] }> } };

    const expTexto = experiencias.length > 0
      ? experiencias.map((e) => `- ${e.cargo ?? "?"} em ${e.empresa ?? "?"} (${e.inicio ?? "?"} – ${e.fim ?? "atual"})`).join("\n")
      : "Nenhuma experiência informada";

    const habTexto = habilidades.length > 0 ? habilidades.join(", ") : "Nenhuma habilidade informada";

    const prompt = `Você é um avaliador técnico de recrutamento. Analise os dados abaixo e forneça notas de 0 a 10 com UMA casa decimal para dois fatores.

CARGO PRETENDIDO: ${cargo}

HABILIDADES DO CANDIDATO: ${habTexto}

EXPERIÊNCIAS PROFISSIONAIS:
${expTexto}

FATORES A AVALIAR:
1. aderencia_skills (0–10): O quanto as habilidades listadas são relevantes para o cargo.
2. experiencia (0–10): O quanto as experiências anteriores são sólidas e relevantes para o cargo.

REGRAS INEGOCIÁVEIS:
- Avalie SOMENTE habilidades e experiência profissional.
- PROIBIDO usar como fator: idade, gênero, origem, estado civil, aparência, foto, nome.
- Se NÃO houver base suficiente para avaliar um fator (campo vazio, "Nenhuma habilidade informada", "Nenhuma experiência informada"), retorne null para a nota e explique na justificativa o que faltou — nunca invente nota nem use 0.0 como substituto de ausência de dado.
- Retorne SOMENTE o JSON a seguir, sem markdown, sem texto adicional. Null é valor válido para as notas:

{"aderencia_skills":7.5,"aderencia_justificativa":"...","experiencia":null,"experiencia_justificativa":"Nenhuma experiência informada no cadastro — não foi possível avaliar."}`;

    const model = process.env.CURRICULO_PARSING_MODEL ?? "claude-opus-4-8";
    const response = await client.messages.create({
      model,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content.find((c) => c.type === "text")?.text ?? "{}";
    const parsed2 = JSON.parse(raw.trim()) as {
      aderencia_skills: number | null;
      aderencia_justificativa: string;
      experiencia: number | null;
      experiencia_justificativa: string;
    };

    const aderencia = parsed2.aderencia_skills != null ? Number(parsed2.aderencia_skills) : null;
    const experiencia = parsed2.experiencia != null ? Number(parsed2.experiencia) : null;

    return {
      ok: true,
      aderencia,
      aderencia_justificativa: parsed2.aderencia_justificativa,
      experiencia,
      experiencia_justificativa: parsed2.experiencia_justificativa,
    };
  } catch (e) {
    console.error("[sugerirFatoresObjetivos]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function atualizarAgendamento(
  agendamentoId: string,
  params: {
    data_hora?: string;
    duracao_min?: number;
    modalidade?: 'presencial' | 'video' | 'telefone';
    local?: string | null;
    observacoes?: string | null;
  }
): Promise<{ ok: boolean; error?: string; googleError?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    // Busca o agendamento atual para ter o google_event_id
    const { data: ag, error: agErr } = await (sb as any)
      .from("candidate_agendamentos")
      .select("id, candidate_id, google_event_id, duracao_min, data_hora, local")
      .eq("id", agendamentoId)
      .single();
    if (agErr) return { ok: false, error: agErr.message };

    const current = ag as { candidate_id: string; google_event_id: string | null; duracao_min: number; data_hora: string; local: string | null };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (params.data_hora !== undefined) updates.data_hora = params.data_hora;
    if (params.duracao_min !== undefined) updates.duracao_min = params.duracao_min;
    if (params.modalidade !== undefined) updates.modalidade = params.modalidade;
    if (params.local !== undefined) updates.local = params.local;
    if (params.observacoes !== undefined) updates.observacoes = params.observacoes;

    const { error } = await (sb as any)
      .from("candidate_agendamentos")
      .update(updates)
      .eq("id", agendamentoId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/pessoas/recrutamento");
    revalidatePath(`/pessoas/recrutamento/${current.candidate_id}`);

    let googleError: string | undefined;
    if (current.google_event_id && isGoogleConfigured()) {
      try {
        await atualizarEventoCalendar(current.google_event_id, {
          dataHoraInicio: params.data_hora ?? current.data_hora,
          duracaoMin: params.duracao_min ?? current.duracao_min,
          local: params.local !== undefined ? params.local : current.local,
        });
      } catch (gErr) {
        const msg = gErr instanceof Error ? gErr.message : String(gErr);
        console.error("[atualizarAgendamento] Google error:", msg);
        googleError = msg;
      }
    }

    return { ok: true, googleError };
  } catch (e) {
    console.error("[atualizarAgendamento]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function cancelarAgendamento(
  agendamentoId: string
): Promise<{ ok: boolean; error?: string; googleError?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    const { data: ag } = await (sb as any)
      .from("candidate_agendamentos")
      .select("candidate_id, google_event_id")
      .eq("id", agendamentoId)
      .single();
    const current = ag as { candidate_id: string; google_event_id: string | null } | null;

    const { error } = await (sb as any)
      .from("candidate_agendamentos")
      .update({ status: "cancelado", updated_at: new Date().toISOString() })
      .eq("id", agendamentoId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/pessoas/recrutamento");
    if (current?.candidate_id) revalidatePath(`/pessoas/recrutamento/${current.candidate_id}`);

    let googleError: string | undefined;
    if (current?.google_event_id && isGoogleConfigured()) {
      try {
        await cancelarEventoCalendar(current.google_event_id);
      } catch (gErr) {
        const msg = gErr instanceof Error ? gErr.message : String(gErr);
        console.error("[cancelarAgendamento] Google error:", msg);
        googleError = msg;
      }
    }

    return { ok: true, googleError };
  } catch (e) {
    console.error("[cancelarAgendamento]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function recriarEventoGoogle(
  agendamentoId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };
    if (!isGoogleConfigured()) return { ok: false, error: "Credenciais Google não configuradas" };

    const { data: ag, error: agErr } = await (sb as any)
      .from("candidate_agendamentos")
      .select("id, candidate_id, tipo, data_hora, duracao_min, modalidade, local, observacoes")
      .eq("id", agendamentoId)
      .single();
    if (agErr) return { ok: false, error: agErr.message };
    const agendamento = ag as {
      candidate_id: string; tipo: 'entrevista' | 'teste_pratico';
      data_hora: string; duracao_min: number;
      modalidade: 'presencial' | 'video' | 'telefone' | null;
      local: string | null; observacoes: string | null;
    };

    const { data: cand, error: candErr } = await (sb as any)
      .from("candidates")
      .select("full_name, email, phone, area_interesse, units(name), job_openings(cargo, title)")
      .eq("id", agendamento.candidate_id)
      .maybeSingle();
    if (candErr) throw new Error(`candidato query falhou: ${candErr.message}`);
    const c = cand as {
      full_name?: string | null;
      email?: string | null; phone?: string | null;
      area_interesse?: string | null;
      units?: { name: string } | null;
      job_openings?: { cargo?: string | null; title?: string | null } | null;
    } | null;

    const nomeCandidate = c?.full_name ?? "Candidato";
    const cargoLabel = c?.area_interesse ?? c?.job_openings?.cargo ?? c?.job_openings?.title ?? null;
    const tipoLabel = agendamento.tipo === 'entrevista' ? 'Entrevista' : 'Teste Prático';
    const unidade = c?.units?.name ?? "";
    const tel = c?.phone ?? "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");

    const descricao = [
      cargoLabel ? `Cargo: ${cargoLabel}` : "",
      unidade ? `Unidade: ${unidade}` : "",
      tel ? `Telefone: ${tel}` : "",
      appUrl ? `Candidato: ${appUrl.replace(/\/$/, "")}/pessoas/recrutamento/${agendamento.candidate_id}` : "",
      agendamento.observacoes ? `\nObservações: ${agendamento.observacoes}` : "",
    ].filter(Boolean).join("\n");

    const convidados = [c?.email].filter((e): e is string => !!e);

    const { eventId, meetLink } = await criarEventoCalendar({
      titulo: `[Pipou] ${tipoLabel} — ${nomeCandidate}${cargoLabel ? ` — ${cargoLabel}` : ''}`,
      descricao,
      local: agendamento.modalidade === 'presencial' ? agendamento.local : null,
      dataHoraInicio: agendamento.data_hora,
      duracaoMin: agendamento.duracao_min,
      modalidade: agendamento.modalidade,
      convidados,
    });

    await (sb as any)
      .from("candidate_agendamentos")
      .update({ google_event_id: eventId, google_meet_link: meetLink, updated_at: new Date().toISOString() })
      .eq("id", agendamentoId);

    revalidatePath("/pessoas/recrutamento");
    revalidatePath(`/pessoas/recrutamento/${agendamento.candidate_id}`);

    return { ok: true };
  } catch (e) {
    console.error("[recriarEventoGoogle]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

// ── FASE 4 — Transcrição + Parecer IA ─────────────────────────────────────────

function buildParecerPrompt(
  nome: string,
  cargo: string,
  transcricao: string,
  roteiro: RoteiroEntrevista | null,
): string {
  const perguntas = roteiro?.blocos
    .flatMap((b) => b.perguntas.map((p) => `- [${p.criterio}] ${p.pergunta}`))
    .join('\n') ?? '';

  return `Você é um especialista em recrutamento e seleção para o setor de hospitalidade. Analise a transcrição da entrevista abaixo e gere um parecer estruturado com avaliação de 8 critérios.

CANDIDATO: ${nome}
CARGO PRETENDIDO: ${cargo}
${perguntas ? `\nPERGUNTAS DO ROTEIRO USADAS NA ENTREVISTA:\n${perguntas}\n` : ''}

REGRAS INEGOCIÁVEIS (anti-alucinação):
1. Cite SOMENTE o que foi explicitamente dito na transcrição — nunca infira ou invente.
2. Se um tema não foi abordado, use "Não mencionado na entrevista."
3. Não atribua traços de personalidade sem evidência direta na fala.
4. pontos_fortes: 2 a 4 itens somente com evidências reais; array vazio se não houver.
5. pontos_atencao: 0 a 3 itens com evidências reais; array vazio se não houver.
6. recomendacao: "contratar" só com evidências sólidas; "avaliar" para casos inconclusos; "nao_contratar" se houver red flags claros.

REGRAS CRÍTICAS — NOTA IA:
7. null = critério não observável na transcrição. NUNCA use 0 no lugar de null — 0 é julgamento negativo, null é ausência de evidência.
8. nota_ia = média aritmética (1 casa decimal) dos critérios com nota ≠ null. Se menos de 3 critérios tiverem nota, nota_ia = null (base insuficiente).
9. Toda nota exige trecho ou paráfrase da transcrição no campo "evidencia". Sem evidência clara → nota = null.
10. A transcrição é gerada por STT e contém erros típicos (palavras truncadas, nomes errados). Não trate trechos incompreensíveis como fatos.

8 CRITÉRIOS A AVALIAR (nota 0–10 ou null):
- clareza_comunicacao: Articulação, objetividade, organização do raciocínio ao falar
- escuta_responsividade: Responsividade ao que foi perguntado; sinais de escuta ativa
- experiencia_relatada: Experiências profissionais mencionadas e relevância para o cargo
- dominio_tecnico: Conhecimento técnico aparente para o cargo (null se não houve abertura técnica na entrevista)
- trajetoria_estabilidade: Histórico de permanência e progressão de carreira
- aderencia_ao_cargo: Alinhamento entre perfil relatado e exigências do cargo
- motivacao_interesse: Motivação explicitada para o cargo e para a empresa
- viabilidade_pratica: Turnos disponíveis, deslocamento até o restaurante, pretensão salarial vs faixa do cargo

TRANSCRIÇÃO:
${transcricao.slice(0, 14000)}

Retorne SOMENTE o JSON a seguir, sem markdown, sem texto adicional. Os valores "..." devem ser preenchidos com conteúdo real:
{"resumo_geral":"...","experiencia_relevante":"...","fit_cultural":"...","pontos_fortes":["..."],"pontos_atencao":["..."],"recomendacao":"contratar","recomendacao_justificativa":"...","nota_ia":7.4,"criterios_avaliados":6,"criterios_total":8,"criterios":{"clareza_comunicacao":{"nota":8,"evidencia":"..."},"escuta_responsividade":{"nota":7,"evidencia":"..."},"experiencia_relatada":{"nota":6,"evidencia":"..."},"dominio_tecnico":{"nota":null,"evidencia":"Não houve pergunta técnica na entrevista."},"trajetoria_estabilidade":{"nota":null,"evidencia":"Não abordado."},"aderencia_ao_cargo":{"nota":7,"evidencia":"..."},"motivacao_interesse":{"nota":8,"evidencia":"..."},"viabilidade_pratica":{"nota":8,"evidencia":"..."}},"gerado_em":"","modelo":""}`;
}

export async function sincronizarTranscricao(
  agendamentoId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    if (!isGoogleConfigured()) return { ok: false, error: "Credenciais Google não configuradas" };

    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    // 1. Pegar agendamento
    const { data: ag, error: agErr } = await (sb as any)
      .from("candidate_agendamentos")
      .select("id, candidate_id, tipo, google_event_id, status, data_hora, roteiro_entrevista")
      .eq("id", agendamentoId)
      .single();

    if (agErr || !ag) return { ok: false, error: "Agendamento não encontrado" };
    const agRec = ag as { id: string; candidate_id: string; tipo: string; google_event_id: string | null; status: string; data_hora: string; roteiro_entrevista: RoteiroEntrevista | null };

    if (agRec.tipo !== "entrevista")
      return { ok: false, error: "Apenas agendamentos de entrevista possuem transcrição do Gemini" };
    if (!agRec.google_event_id)
      return { ok: false, error: "Este agendamento não tem evento Google Calendar vinculado" };

    // 2. Buscar título do evento no Calendar (é o prefixo do nome da subpasta no Drive)
    const eventoTitulo = await getEventSummary(agRec.google_event_id);
    if (!eventoTitulo)
      return { ok: false, error: "Não foi possível obter o título do evento no Google Calendar" };

    // 3. Localizar subpasta → Doc → exportar → split em 📖
    const { encontrarEExportarTranscricao } = await import("@/lib/google/drive");
    const { docId, transcricao } = await encontrarEExportarTranscricao(eventoTitulo, agRec.data_hora);

    // 4. Salvar transcricao_drive_id imediatamente
    const { error: driveErr } = await (sb as any)
      .from("candidate_agendamentos")
      .update({ transcricao_drive_id: docId, updated_at: new Date().toISOString() })
      .eq("id", agendamentoId);
    if (driveErr) console.error("[sincronizarTranscricao] transcricao_drive_id update falhou:", driveErr.message);

    // 5. Gerar parecer via Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Transcrição salva; parecer fica para quando a key estiver configurada
      revalidatePath(`/pessoas/recrutamento/${agRec.candidate_id}`);
      return { ok: true };
    }

    const { data: cand } = await (sb as any)
      .from("candidates")
      .select("full_name, area_interesse, job_openings(cargo, title)")
      .eq("id", agRec.candidate_id)
      .maybeSingle();

    const candidatoNome = (cand as any)?.full_name ?? "Candidato";
    const cargo =
      (cand as any)?.area_interesse ??
      (cand as any)?.job_openings?.cargo ??
      (cand as any)?.job_openings?.title ??
      "não especificado";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Anthropic = ((await import("@anthropic-ai/sdk")) as any).default;
    const client = new Anthropic({ apiKey, timeout: 55_000 }) as {
      messages: { create: (p: unknown) => Promise<{ content: { type: string; text: string }[] }> };
    };

    const response = await client.messages.create({
      model: process.env.CURRICULO_PARSING_MODEL ?? "claude-opus-4-8",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildParecerPrompt(candidatoNome, cargo, transcricao, agRec.roteiro_entrevista) }],
    });

    const rawText = (response.content.find((b) => b.type === "text")?.text ?? "")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    let parecer: ParecerIA;
    try {
      parecer = JSON.parse(rawText) as ParecerIA;
    } catch {
      console.error("[sincronizarTranscricao] JSON parse falhou:", rawText.slice(0, 300));
      revalidatePath(`/pessoas/recrutamento/${agRec.candidate_id}`);
      return { ok: false, error: "Transcrição salva, mas o parecer não pôde ser gerado. Tente novamente." };
    }

    parecer.gerado_em = new Date().toISOString();
    parecer.modelo = process.env.CURRICULO_PARSING_MODEL ?? "claude-opus-4-8";

    // 6. Salvar resumo_ia
    const { error: resumoErr } = await (sb as any)
      .from("candidate_agendamentos")
      .update({ resumo_ia: parecer, updated_at: new Date().toISOString() })
      .eq("id", agendamentoId);
    if (resumoErr) throw new Error(`Falha ao salvar parecer: ${resumoErr.message}`);

    revalidatePath(`/pessoas/recrutamento/${agRec.candidate_id}`);
    return { ok: true };
  } catch (e) {
    console.error("[sincronizarTranscricao]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

// ── Roteiro de Entrevista ─────────────────────────────────────────────────────

function buildRoteiroPromptJD(
  cargo: { nome: string; setor: string; grupo: string },
  jd: JDRow,
  faixaSalarial: string | null,
): string {
  const secoes: string[] = [];
  if (jd.objetivo_cargo) secoes.push(`Objetivo: ${jd.objetivo_cargo}`);
  if (jd.resp_gestao_operacional) secoes.push(`Resp. Operacional: ${jd.resp_gestao_operacional}`);
  if (jd.resp_gestao_pessoas) secoes.push(`Gestão de Pessoas: ${jd.resp_gestao_pessoas}`);
  if (jd.resp_estoque_custos) secoes.push(`Estoque/Custos: ${jd.resp_estoque_custos}`);
  if (jd.resp_qualidade_experiencia) secoes.push(`Qualidade/Experiência: ${jd.resp_qualidade_experiencia}`);
  if (jd.indicadores_performance) secoes.push(`Indicadores: ${jd.indicadores_performance}`);
  if (jd.req_formacao) secoes.push(`Formação: ${jd.req_formacao}`);
  if (jd.req_experiencia) secoes.push(`Experiência: ${jd.req_experiencia}`);
  if (jd.req_conhecimentos_tecnicos) secoes.push(`Conhecimentos Técnicos: ${jd.req_conhecimentos_tecnicos}`);
  if (jd.req_competencias_comportamentais) secoes.push(`Competências: ${jd.req_competencias_comportamentais}`);
  if (jd.responsabilidades_sobre_pessoas) secoes.push(`Pessoas sob gestão: ${jd.responsabilidades_sobre_pessoas}`);
  if (jd.condicoes_trabalho) secoes.push(`Condições de trabalho: ${jd.condicoes_trabalho}`);
  if (jd.reporte_direto) secoes.push(`Reporta a: ${jd.reporte_direto}`);

  return `Você é especialista em recrutamento para hospitalidade premium. Crie um roteiro de entrevista para o cargo "${cargo.nome}" (setor: ${cargo.setor} / grupo: ${cargo.grupo}).

DESCRIÇÃO DE CARGO (JD):
${secoes.join('\n')}

FAIXA SALARIAL DO CARGO: ${faixaSalarial ?? 'não informada'}

Gere o roteiro com os seguintes 5 blocos OBRIGATÓRIOS, nessa ordem:
1. "Abertura / trajetória" (3–4 perguntas) → critérios: trajetoria_estabilidade, motivacao_interesse
2. "Experiência e domínio técnico" (3–5 perguntas específicas ao cargo baseadas nos req_* e resp_* da JD) → critérios: experiencia_relatada, dominio_tecnico
3. "Rotina e condições reais" (2–3 perguntas sobre o dia a dia e ambiente de trabalho) → critérios: aderencia_ao_cargo, viabilidade_pratica
4. "Motivação e interesse" (2–3 perguntas) → critério: motivacao_interesse
5. "Viabilidade prática" (3 perguntas fixas: disponibilidade de turnos/horários, deslocamento até o restaurante, pretensão salarial — mencione a faixa informada) → critério: viabilidade_pratica

Regras:
- Cada pergunta tem "criterio" (um de: clareza_comunicacao, escuta_responsividade, experiencia_relatada, dominio_tecnico, trajetoria_estabilidade, aderencia_ao_cargo, motivacao_interesse, viabilidade_pratica)
- "dica" é opcional — sinal de alerta ou ponto a explorar no seguimento
- clareza_comunicacao e escuta_responsividade são avaliados pelo comportamento ao longo da conversa — não crie blocos dedicados a eles
- As perguntas do bloco 2 devem ser específicas ao cargo e à JD, não genéricas
- Linguagem coloquial mas profissional; segunda pessoa (você)

Retorne SOMENTE o JSON sem markdown:
{"origem":"jd","cargo":"${cargo.nome}","setor":"${cargo.setor}","grupo":"${cargo.grupo}","faixa_salarial":${faixaSalarial ? `"${faixaSalarial}"` : 'null'},"gerado_em":"","blocos":[{"titulo":"Abertura / trajetória","perguntas":[{"pergunta":"...","criterio":"trajetoria_estabilidade","dica":"..."}]}]}`;
}

function buildRoteiroPromptFallback(
  cargoNome: string,
  setor: string,
  grupo: string,
  faixaSalarial: string | null,
): string {
  const isLideranca = ['Tático', 'Estratégico', 'Executivo-Liderança'].includes(grupo);
  const contextoCargo = isLideranca
    ? `É um cargo de liderança (${grupo}). Inclua perguntas sobre gestão de equipe, tomada de decisão sob pressão, métricas operacionais e desenvolvimento de pessoas.`
    : `É um cargo operacional. Inclua perguntas sobre rotina técnica no setor de ${setor}, padrão de serviço em ambiente de alta demanda, trabalho em equipe e resiliência sob pressão.`;

  const setorContexto: Record<string, string> = {
    'Bar': 'coquetéis clássicos e autorais, mise en place, harmonizações, descarte e rotatividade de insumos, serviço de bebidas',
    'Cozinha': 'técnicas culinárias, mise en place, controle de temperatura, higiene alimentar, ritmo de serviço à la carte',
    'Salão': 'protocolo de serviço fine dining, upselling, leitura de mesa, etiqueta, gestão de reservas e reclamações',
    'Estoque': 'inventário, método PEPS, controle de validade, recebimento de mercadoria, sistema de gestão de estoque',
    'Limpeza': 'produtos de higienização, protocolos ANVISA, controle de pragas, lavanderia, organização de ambientes',
    'Gerência': 'gestão de equipes, escalas de trabalho, indicadores de performance, comunicação com fornecedores e diretoria',
  };
  const dicaSetor = setorContexto[setor] ?? 'operações de restaurante premium, padrão de serviço e gestão de equipe';

  return `Você é especialista em recrutamento para hospitalidade premium (restaurantes fine dining e operações gastronômicas). Crie um roteiro de entrevista para o cargo "${cargoNome}" no setor de ${setor} (grupo: ${grupo}).

Não há Descrição de Cargo formal disponível. Use seu conhecimento de operações de restaurante premium para criar perguntas relevantes.
${contextoCargo}
Temas técnicos pertinentes ao setor de ${setor}: ${dicaSetor}.

FAIXA SALARIAL DO CARGO: ${faixaSalarial ?? 'não informada'}

Gere o roteiro com os seguintes 5 blocos OBRIGATÓRIOS, nessa ordem:
1. "Abertura / trajetória" (3–4 perguntas) → critérios: trajetoria_estabilidade, motivacao_interesse
2. "Experiência e domínio técnico" (3–5 perguntas específicas ao cargo e ao setor ${setor}) → critérios: experiencia_relatada, dominio_tecnico
3. "Rotina e condições reais" (2–3 perguntas sobre ritmo de trabalho, ambiente e exigências do setor) → critérios: aderencia_ao_cargo, viabilidade_pratica
4. "Motivação e interesse" (2–3 perguntas) → critério: motivacao_interesse
5. "Viabilidade prática" (3 perguntas fixas: disponibilidade de turnos/horários, deslocamento até o restaurante, pretensão salarial — mencione a faixa se informada) → critério: viabilidade_pratica

Regras:
- Cada pergunta tem "criterio" (um de: clareza_comunicacao, escuta_responsividade, experiencia_relatada, dominio_tecnico, trajetoria_estabilidade, aderencia_ao_cargo, motivacao_interesse, viabilidade_pratica)
- "dica" é opcional — sinal de alerta ou ponto a explorar no seguimento
- clareza_comunicacao e escuta_responsividade são avaliados pelo comportamento — não crie blocos dedicados
- Evite perguntas genéricas de RH ("fale sobre você") — prefira situacionais e específicas ao setor
- Linguagem coloquial mas profissional; segunda pessoa (você)

Retorne SOMENTE o JSON sem markdown:
{"origem":"fallback","cargo":"${cargoNome}","setor":"${setor}","grupo":"${grupo}","faixa_salarial":${faixaSalarial ? `"${faixaSalarial}"` : 'null'},"gerado_em":"","blocos":[{"titulo":"Abertura / trajetória","perguntas":[{"pergunta":"...","criterio":"trajetoria_estabilidade","dica":"..."}]}]}`;
}

async function gerarRoteiroCore(
  candidateId: string,
  sb: ReturnType<typeof createServiceClient>,
): Promise<RoteiroEntrevista | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[gerarRoteiroCore] ANTHROPIC_API_KEY não configurada no ambiente");
    return null;
  }
  if (!sb) {
    console.error("[gerarRoteiroCore] service client indisponível");
    return null;
  }

  const { data: cand } = await (sb as any)
    .from("candidates")
    .select("cargo_id, area_interesse")
    .eq("id", candidateId)
    .maybeSingle();
  const cargoId = (cand as any)?.cargo_id as string | null;

  type CargoRow = { id: string; nome: string; setor: string; grupo: string };
  let cargoRow: CargoRow | null = null;
  let jd: JDRow | null = null;
  let faixaSalarial: string | null = null;

  if (cargoId) {
    const { data: c } = await (sb as any)
      .from("cargos")
      .select("id, nome, setor, grupo")
      .eq("id", cargoId)
      .maybeSingle();
    cargoRow = c ?? null;

    const { data: jdData } = await (sb as any)
      .from("job_descriptions")
      .select("id, cargo, area, brand_id, cargo_id, created_at, updated_at, responsabilidades, requisitos, beneficios, reporte_direto, objetivo_cargo, resp_gestao_operacional, resp_gestao_pessoas, resp_estoque_custos, resp_qualidade_experiencia, indicadores_performance, req_formacao, req_experiencia, req_conhecimentos_tecnicos, req_competencias_comportamentais, responsabilidades_sobre_pessoas, condicoes_trabalho, indicadores_sucesso")
      .eq("cargo_id", cargoId)
      .limit(1)
      .maybeSingle();
    jd = jdData ?? null;

    const { data: salRows } = await (sb as any).rpc("get_cargo_salarios");
    const macro = ((salRows ?? []) as { cargo_id: string; unit_id: string | null; salario_min: number | null; salario_max: number | null }[])
      .find((r) => r.cargo_id === cargoId && r.unit_id === null);
    if (macro) {
      const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
      const partes = [macro.salario_min ? fmt(macro.salario_min) : null, macro.salario_max ? fmt(macro.salario_max) : null].filter(Boolean);
      if (partes.length > 0) faixaSalarial = partes.join(' a ');
    }
  }

  const cargoNome = cargoRow?.nome ?? (cand as any)?.area_interesse ?? 'Cargo não especificado';
  const setor = cargoRow?.setor ?? 'Operações';
  const grupo = cargoRow?.grupo ?? 'Operacional';

  const prompt = jd && cargoRow
    ? buildRoteiroPromptJD(cargoRow, jd, faixaSalarial)
    : buildRoteiroPromptFallback(cargoNome, setor, grupo, faixaSalarial);

  console.log("[gerarRoteiroCore] cargo:", cargoNome, "| setor:", setor, "| grupo:", grupo, "| tem JD:", !!jd, "| faixa:", faixaSalarial);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Anthropic = ((await import("@anthropic-ai/sdk")) as any).default;
  const client = new Anthropic({ apiKey, timeout: 55_000 }) as {
    messages: { create: (p: unknown) => Promise<{ content: { type: string; text: string }[] }> };
  };

  const response = await client.messages.create({
    model: process.env.CURRICULO_PARSING_MODEL ?? "claude-opus-4-8",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = (response.content.find((b) => b.type === "text")?.text ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  let roteiro: RoteiroEntrevista;
  try {
    roteiro = JSON.parse(rawText) as RoteiroEntrevista;
  } catch {
    console.error("[gerarRoteiroCore] JSON parse falhou:", rawText.slice(0, 300));
    return null;
  }
  roteiro.gerado_em = new Date().toISOString();
  return roteiro;
}

export async function gerarRoteiroEntrevista(
  agendamentoId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    const { data: ag } = await (sb as any)
      .from("candidate_agendamentos")
      .select("id, candidate_id, tipo")
      .eq("id", agendamentoId)
      .single();

    if (!ag) return { ok: false, error: "Agendamento não encontrado" };
    const agRec = ag as { id: string; candidate_id: string; tipo: string };
    if (agRec.tipo !== "entrevista")
      return { ok: false, error: "Roteiro só é gerado para agendamentos de entrevista" };

    const roteiro = await gerarRoteiroCore(agRec.candidate_id, sb);
    if (!roteiro) return { ok: false, error: "Não foi possível gerar o roteiro. Verifique a configuração da API." };

    const { error: rotErr } = await (sb as any)
      .from("candidate_agendamentos")
      .update({ roteiro_entrevista: roteiro, updated_at: new Date().toISOString() })
      .eq("id", agendamentoId);
    if (rotErr) return { ok: false, error: `Roteiro gerado, mas erro ao salvar: ${rotErr.message}` };

    revalidatePath(`/pessoas/recrutamento/${agRec.candidate_id}`);
    return { ok: true };
  } catch (e) {
    console.error("[gerarRoteiroEntrevista]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

export async function salvarRoteiroEditado(
  agendamentoId: string,
  roteiro: RoteiroEntrevista,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };

    const { data: ag } = await (sb as any)
      .from("candidate_agendamentos")
      .select("candidate_id")
      .eq("id", agendamentoId)
      .single();

    if (!ag) return { ok: false, error: "Agendamento não encontrado" };

    const { error: rotErr } = await (sb as any)
      .from("candidate_agendamentos")
      .update({ roteiro_entrevista: roteiro, updated_at: new Date().toISOString() })
      .eq("id", agendamentoId);
    if (rotErr) return { ok: false, error: `Erro ao salvar roteiro: ${rotErr.message}` };

    revalidatePath(`/pessoas/recrutamento/${(ag as { candidate_id: string }).candidate_id}`);
    return { ok: true };
  } catch (e) {
    console.error("[salvarRoteiroEditado]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}

// ── Sprint A+B — Promoção candidato → employee via RPC promover_candidato ────

export type PromoverResult =
  | { success: true; employeeId: string }
  | { success: false; error: string }

export async function promoverCandidato(params: {
  candidateId: string
  unitId: string
  cpf: string
  funcao: string
  salarioBase: number
  dataAdmissao: string // 'YYYY-MM-DD'
}): Promise<PromoverResult> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { success: false, error: "Erro de configuração interna." };

    const { data, error } = await (sb as any).rpc("promover_candidato", {
      p_candidate_id: params.candidateId,
      p_unit_id: params.unitId,
      p_cpf: params.cpf,
      p_funcao: params.funcao,
      p_salario_base: params.salarioBase,
      p_data_admissao: params.dataAdmissao,
    });

    if (error) return { success: false, error: error.message };

    revalidatePath(`/pessoas/recrutamento/${params.candidateId}`);
    revalidatePath("/pessoas/recrutamento");

    return { success: true, employeeId: data as string };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erro desconhecido ao promover candidato.",
    };
  }
}
