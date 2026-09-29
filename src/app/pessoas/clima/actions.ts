"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@kph/db/supabase/server";
import { requireUser, getUserTierLevel } from "@kph/auth/server";
import { isPipouAdmin } from "@/lib/pessoas/permissions";
import { getCurrentUnit } from "@kph/auth/unit";

export type ClimateSurvey = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: "pulso" | "nps" | "tematica";
  status: "rascunho" | "ativa" | "encerrada";
  unit_id: string | null;
  publicado_em: string | null;
  created_at: string;
  question_count?: number;
};

export type SurveyQuestion = {
  id: string;
  ordem: number;
  texto: string;
  tipo: "escala" | "texto_livre";
};

export type SurveyResult = {
  question_id: string;
  texto_pergunta: string;
  total_respostas: number;
  media_escala: number | null;
  distribuicao: Record<string, number>;
};

type RawSurveyRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  status: string;
  unit_id: string | null;
  publicado_em: string | null;
  created_at: string;
  climate_questions: { id: string }[];
};

type RawResultRow = {
  question_id: string;
  texto_pergunta: string;
  total_respostas: number;
  media_escala: number | null;
  distribuicao: Record<string, number>;
};

export async function getClimateSurveys(): Promise<ClimateSurvey[]> {
  try {
    const user = await requireUser();
    const tier = getUserTierLevel(user);
    const supabase = createServiceClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("climate_surveys" as never)
      .select("id, titulo, descricao, tipo, status, unit_id, publicado_em, created_at, climate_questions(id)")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const rows = data as unknown as RawSurveyRow[];

    let filtered = rows;
    if (tier < 6 && !isPipouAdmin(user)) {
      const unit = await getCurrentUnit();
      if (!unit) return [];
      filtered = rows.filter(r => r.unit_id === null || r.unit_id === unit.id);
    }

    return filtered.map(r => ({
      id: r.id,
      titulo: r.titulo,
      descricao: r.descricao,
      tipo: r.tipo as ClimateSurvey["tipo"],
      status: r.status as ClimateSurvey["status"],
      unit_id: r.unit_id,
      publicado_em: r.publicado_em,
      created_at: r.created_at,
      question_count: Array.isArray(r.climate_questions) ? r.climate_questions.length : 0,
    }));
  } catch (e) {
    console.error("[getClimateSurveys]", e);
    return [];
  }
}

export async function getSurveyWithQuestions(
  surveyId: string,
): Promise<{ survey: ClimateSurvey; questions: SurveyQuestion[] } | null> {
  try {
    await requireUser();
    const supabase = createServiceClient();
    if (!supabase) return null;

    const { data: surveyData, error: surveyError } = await supabase
      .from("climate_surveys" as never)
      .select("id, titulo, descricao, tipo, status, unit_id, publicado_em, created_at")
      .eq("id", surveyId)
      .single();

    if (surveyError || !surveyData) return null;

    const raw = surveyData as unknown as Omit<RawSurveyRow, "climate_questions">;

    const { data: questionsData, error: questionsError } = await supabase
      .from("climate_questions" as never)
      .select("id, ordem, texto, tipo")
      .eq("survey_id", surveyId)
      .order("ordem", { ascending: true });

    if (questionsError) return null;

    const questions = (questionsData as unknown as SurveyQuestion[]) ?? [];

    return {
      survey: {
        id: raw.id,
        titulo: raw.titulo,
        descricao: raw.descricao,
        tipo: raw.tipo as ClimateSurvey["tipo"],
        status: raw.status as ClimateSurvey["status"],
        unit_id: raw.unit_id,
        publicado_em: raw.publicado_em,
        created_at: raw.created_at,
        question_count: questions.length,
      },
      questions,
    };
  } catch (e) {
    console.error("[getSurveyWithQuestions]", e);
    return null;
  }
}

export async function getSurveyResults(surveyId: string): Promise<SurveyResult[]> {
  try {
    await requireUser();
    const supabase = createServiceClient();
    if (!supabase) return [];

    const { data, error } = await (supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    }).rpc("get_survey_results", { p_survey_id: surveyId });

    if (error || !data) return [];

    const rows = data as unknown as RawResultRow[];
    return rows.map(r => ({
      question_id: r.question_id,
      texto_pergunta: r.texto_pergunta,
      total_respostas: r.total_respostas,
      media_escala: r.media_escala,
      distribuicao: r.distribuicao ?? {},
    }));
  } catch (e) {
    console.error("[getSurveyResults]", e);
    return [];
  }
}

export async function createSurveyAction(formData: FormData): Promise<void> {
  try {
    const user = await requireUser();
    const supabase = createServiceClient();
    if (!supabase) return;

    const titulo = formData.get("titulo") as string | null;
    const descricao = formData.get("descricao") as string | null;
    const tipo = formData.get("tipo") as "pulso" | "nps" | "tematica" | null;
    const unitIdRaw = formData.get("unit_id") as string | null;
    const salvarComo = formData.get("salvar_como") as "rascunho" | "ativa" | null;
    const perguntasRaw = formData.get("perguntas") as string | null;

    if (!titulo || !tipo) return;

    const unit_id = unitIdRaw && unitIdRaw.trim() !== "" ? unitIdRaw : null;
    const isPublishing = salvarComo === "ativa";
    const status: ClimateSurvey["status"] = isPublishing ? "ativa" : "rascunho";
    const publicado_em = isPublishing ? new Date().toISOString() : null;
    const publicado_por = isPublishing ? user.id : null;

    const { data: inserted, error: insertError } = await supabase
      .from("climate_surveys" as never)
      .insert({
        titulo,
        descricao: descricao || null,
        tipo,
        status,
        unit_id,
        publicado_por,
        publicado_em,
      } as never)
      .select("id")
      .single();

    if (insertError || !inserted) return;

    const survey = inserted as unknown as { id: string };

    if (perguntasRaw) {
      let perguntas: { texto: string; tipo: "escala" | "texto_livre" }[] = [];
      try {
        perguntas = JSON.parse(perguntasRaw) as { texto: string; tipo: "escala" | "texto_livre" }[];
      } catch (e) {
        console.error("[createSurveyAction] perguntas JSON inválido:", e);
      }

      if (perguntas.length > 0) {
        const rows = perguntas.map((p, idx) => ({
          survey_id: survey.id,
          ordem: idx + 1,
          texto: p.texto,
          tipo: p.tipo,
        }));

        await supabase
          .from("climate_questions" as never)
          .insert(rows as never);
      }
    }
  } catch (e) {
    console.error("[createSurveyAction]", e);
  }

  revalidatePath("/pessoas/clima");
}

export async function publishSurveyAction(surveyId: string): Promise<void> {
  try {
    const user = await requireUser();
    const supabase = createServiceClient();
    if (!supabase) return;

    await supabase
      .from("climate_surveys" as never)
      .update({
        status: "ativa",
        publicado_em: new Date().toISOString(),
        publicado_por: user.id,
      } as never)
      .eq("id", surveyId);
  } catch (e) {
    console.error("[publishSurveyAction]", e);
  }

  revalidatePath("/pessoas/clima");
}

export async function closeSurveyAction(surveyId: string): Promise<void> {
  try {
    await requireUser();
    const supabase = createServiceClient();
    if (!supabase) return;

    await supabase
      .from("climate_surveys" as never)
      .update({
        status: "encerrada",
        encerrado_em: new Date().toISOString(),
      } as never)
      .eq("id", surveyId);
  } catch (e) {
    console.error("[closeSurveyAction]", e);
  }

  revalidatePath("/pessoas/clima");
}
