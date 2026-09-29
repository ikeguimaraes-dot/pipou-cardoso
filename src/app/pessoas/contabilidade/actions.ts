"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@kph/db/supabase/server";
import { requireUser, getUserTierLevel } from "@kph/auth/server";

export type FechamentoPeriodo = {
  periodo_id: string;
  competencia: string;
  status: string;
  custo_total_folha: number | null;
  colabs: number;
};

export type FechamentoLinha = {
  employee_id: string;
  nome: string;
  cod_folha: string | null;
  cod_kph: string;
  descricao_rubrica: string;
  grupo: string;
  tipo_rubrica: string;
  valor: number | null;
  valor_horas: string | null;
  origem_lancamento: string;
  unidade_rubrica: string;
};

export type ColetaResult = {
  ok: boolean;
  periodo_id?: string;
  colabs?: number;
  linhas?: number;
  error?: string;
};

export type UpsertManualResult = {
  ok: boolean;
  error?: string;
};

export async function listarPeriodos(unitId: string): Promise<FechamentoPeriodo[]> {
  try {
    const user = await requireUser();
    const tier = getUserTierLevel(user);
    if (tier < 4) return [];
    const sb = createServiceClient();
    if (!sb) return [];
    const { data, error } = await (sb as any).rpc("rpc_payroll_listar_periodos", {
      p_unit_id: unitId,
    });
    if (error || !data) return [];
    return (data as any[]).map((r) => ({
      periodo_id: r.periodo_id,
      competencia: r.competencia,
      status: r.status,
      custo_total_folha: r.custo_total_folha != null ? Number(r.custo_total_folha) : null,
      colabs: Number(r.colabs),
    }));
  } catch {
    return [];
  }
}

export async function coletarPeriodo(unitId: string, competencia: string): Promise<ColetaResult> {
  try {
    const user = await requireUser();
    const tier = getUserTierLevel(user);
    if (tier < 4) return { ok: false, error: "Acesso negado" };
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };
    const { data, error } = await (sb as any).rpc("rpc_payroll_coletar_periodo", {
      p_unit_id: unitId,
      p_competencia: competencia,
    });
    if (error) return { ok: false, error: error.message };
    const r = data as any;
    revalidatePath("/pessoas/contabilidade");
    return {
      ok: r.ok ?? false,
      periodo_id: r.periodo_id,
      colabs: r.colabs,
      linhas: r.linhas,
      error: r.error,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erro desconhecido" };
  }
}

export async function listarFechamento(periodoId: string): Promise<FechamentoLinha[]> {
  try {
    const user = await requireUser();
    const tier = getUserTierLevel(user);
    if (tier < 4) return [];
    const sb = createServiceClient();
    if (!sb) return [];
    const { data, error } = await (sb as any).rpc("rpc_payroll_listar_fechamento", {
      p_periodo_id: periodoId,
    });
    if (error || !data) return [];
    return data as FechamentoLinha[];
  } catch {
    return [];
  }
}

export type EspelhoRow = {
  employee_id: string;
  cod_folha: string | null;
  regime: string | null;
  cc: string | null;
  nome: string | null;
  cargo: string | null;
  admissao: string | null;
  salario: string | null;
  gorjeta_1q: string | null;
  liquido: string | null;
  gorjeta_2q: string | null;
  gorjeta_compulsoria: string | null;
  adicional_noturno: string | null;
  bonus: string | null;
  quitacao_bh: string | null;
  feriado: string | null;
  emprestimo: string | null;
  falta: string | null;
  dsr: string | null;
  plano_dependente: string | null;
  coopart_plano: string | null;
  desconto_vt: string | null;
  total_liquido: string | null;
};

export async function listarEspelho(periodoId: string): Promise<EspelhoRow[]> {
  try {
    const user = await requireUser();
    const tier = getUserTierLevel(user);
    if (tier < 4) return [];
    const sb = createServiceClient();
    if (!sb) return [];
    const { data, error } = await (sb as any).rpc("rpc_payroll_espelho_fopag", {
      p_periodo_id: periodoId,
    });
    if (error || !data) return [];
    return data as EspelhoRow[];
  } catch {
    return [];
  }
}

export async function upsertLancamentoManual(
  periodoId: string,
  employeeId: string,
  codKph: string,
  valor: number | null,
  valorHoras: string | null,
  observacao: string | null,
): Promise<UpsertManualResult> {
  try {
    const user = await requireUser();
    const tier = getUserTierLevel(user);
    if (tier < 4) return { ok: false, error: "Acesso negado" };
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };
    const { data, error } = await (sb as any).rpc("rpc_payroll_upsert_lancamento_manual", {
      p_periodo_id: periodoId,
      p_employee_id: employeeId,
      p_cod_kph: codKph,
      p_valor: valor,
      p_valor_horas: valorHoras,
      p_observacao: observacao,
    });
    if (error) return { ok: false, error: error.message };
    const r = data as any;
    revalidatePath("/pessoas/contabilidade");
    return { ok: r.ok ?? false, error: r.error };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erro desconhecido" };
  }
}
