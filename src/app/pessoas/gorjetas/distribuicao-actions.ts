"use server";

import { createServiceClient } from "@kph/db/supabase/server";
import { revalidatePath } from "next/cache";

export interface ColaboradorDistribuicao {
  employee_id: string;
  nome: string;
  cargo: string;
  dias_trabalhados: number;
  pontuacao: number;
  percentual: number;
  valor_bruto: number;
  valor_liquido: number;
}

export interface DistribuicaoRow {
  id: string;
  employee_id: string;
  nome: string;
  cargo: string;
  dias_trabalhados: number;
  pontuacao: number;
  percentual: number;
  valor_bruto: number;
  valor_liquido: number;
  recibo_gerado_at: string | null;
}

/**
 * Calcula o rateio e persiste em gorjeta_distribuicao.
 * Upsert por (unit_id, mes, ano, employee_id) — idempotente.
 */
export async function distribuirPeriodo(
  unitId: string,
  mes: number,
  ano: number,
  colaboradores: ColaboradorDistribuicao[],
): Promise<{ ok: boolean; ids: Record<string, string>; error?: string }> {
  const sb = createServiceClient();
  if (!sb) return { ok: false, ids: {}, error: "Sem conexão" };

  const rows = colaboradores.map((c) => ({
    unit_id: unitId,
    mes,
    ano,
    employee_id: c.employee_id,
    nome: c.nome,
    cargo: c.cargo,
    dias_trabalhados: c.dias_trabalhados,
    pontuacao: c.pontuacao,
    percentual: c.percentual,
    valor_bruto: c.valor_bruto,
    valor_liquido: c.valor_liquido,
  }));

  const { data, error } = await sb
    .from("gorjeta_distribuicao")
    .upsert(rows, { onConflict: "unit_id,mes,ano,employee_id" })
    .select("id, employee_id");

  if (error) return { ok: false, ids: {}, error: error.message };

  const ids: Record<string, string> = {};
  for (const row of data ?? []) {
    ids[row.employee_id] = row.id;
  }

  revalidatePath("/pessoas/gorjetas");
  return { ok: true, ids };
}

/**
 * Busca a distribuição já persistida para um período.
 * Retorna um map de employee_id → distribuicao row.
 */
export async function getDistribuicao(
  unitId: string,
  mes: number,
  ano: number,
): Promise<Record<string, DistribuicaoRow>> {
  const sb = createServiceClient();
  if (!sb) return {};

  const { data, error } = await sb
    .from("gorjeta_distribuicao")
    .select("id, employee_id, nome, cargo, dias_trabalhados, pontuacao, percentual, valor_bruto, valor_liquido, recibo_gerado_at")
    .eq("unit_id", unitId)
    .eq("mes", mes)
    .eq("ano", ano);

  if (error || !data) return {};

  const map: Record<string, DistribuicaoRow> = {};
  for (const row of data) {
    map[row.employee_id] = row as DistribuicaoRow;
  }
  return map;
}

/**
 * Busca uma entrada específica de gorjeta_distribuicao para o PDF.
 */
export async function getDistribuicaoById(id: string): Promise<(DistribuicaoRow & {
  unit_id: string;
  mes: number;
  ano: number;
}) | null> {
  const sb = createServiceClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from("gorjeta_distribuicao")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Marca recibo_gerado_at para um registro.
 */
export async function marcarReciboGerado(id: string): Promise<void> {
  const sb = createServiceClient();
  if (!sb) return;
  await sb
    .from("gorjeta_distribuicao")
    .update({ recibo_gerado_at: new Date().toISOString() })
    .eq("id", id);
}
