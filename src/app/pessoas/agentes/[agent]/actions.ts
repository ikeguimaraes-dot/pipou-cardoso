"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@kph/db/supabase/server";
import type { ActionResult } from "@/lib/result";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AGENT_PROMPTS: Record<string, string> = {
  maya: `Você é um analista de Recrutamento & Seleção do grupo KPH (restaurantes em SP).
Analise os dados abaixo e gere um insight semanal executivo sobre o desempenho da Maya (agente de R&S).
Foque em: volume de candidatos, taxa de qualificação, handoffs para humano, gargalos.
Máximo 4 frases. Tom direto, sem markdown.`,
  theo: `Você é um analista de RH do grupo KPH (restaurantes em SP).
Analise os dados abaixo e gere um insight semanal sobre o desempenho do Theo (helpdesk interno de RH).
Foque em: volume de dúvidas, intenções mais frequentes, fricções (perguntas sem resposta), taxa de resolução autônoma.
Máximo 4 frases. Tom direto, sem markdown.`,
};

export async function gerarInsightAgente(
  agentKey: "maya" | "theo",
  dados: Record<string, unknown>,
): Promise<ActionResult<{ insight_text: string; id: string }>> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return { ok: false, error: "Supabase indisponível" };

    const systemPrompt = AGENT_PROMPTS[agentKey];

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\nDados:\n${JSON.stringify(dados, null, 2)}`,
        },
      ],
    });

    const insight_text = (msg.content[0] as { text: string }).text.trim();

    // Semana atual (segunda-feira em horário SP)
    const hojeStr = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const hojeDate = new Date(`${hojeStr}T00:00:00`);
    const dow = hojeDate.getDay();
    const segunda = new Date(hojeDate);
    segunda.setDate(hojeDate.getDate() - (dow === 0 ? 6 : dow - 1));
    const semana = segunda.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("kph_insights")
      .insert({
        modulo: agentKey,
        semana,
        insight_text,
        dados_referencia: dados as import("@kph/db/types/database").Json,
        gerado_por: "painel-agentes",
        aprovado: false,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    return { ok: true, data: { insight_text, id: (data as { id: string }).id } };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
