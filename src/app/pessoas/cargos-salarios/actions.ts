"use server";

import { requireRole } from "@kph/auth/server";
import { createServiceClient } from "@kph/db/supabase/server";

export type SalarioRow = {
  id: string;
  cargo_id: string;
  cargo_nome: string;
  setor: string;
  grupo: string;
  tem_nivel: boolean;
  nivel: 1 | 2 | 3 | null;
  unit_id: string | null;
  salario_min: number | null;
  salario_ref: number | null;
  salario_max: number | null;
  observacao: string | null;
};

export async function getGradeSalarial(): Promise<SalarioRow[]> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return [];
    const { data, error } = await (sb as any).rpc("get_cargo_salarios");
    if (error) {
      console.error("[getGradeSalarial]", error);
      return [];
    }
    return (data ?? []) as SalarioRow[];
  } catch (e) {
    console.error("[getGradeSalarial]", e);
    return [];
  }
}

export type CargoHierarquiaRow = {
  id: string;
  nome: string;
  setor: string;
  reporta_a_cargo_id: string | null;
};

export async function getCargoHierarquia(): Promise<CargoHierarquiaRow[]> {
  try {
    await requireRole(["founder", "cfo", "gm", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return [];
    const { data, error } = await (sb as any)
      .from("cargos")
      .select("id, nome, setor, reporta_a_cargo_id")
      .eq("ativo", true);
    if (error) { console.error("[getCargoHierarquia]", error); return []; }
    return (data ?? []) as CargoHierarquiaRow[];
  } catch (e) {
    console.error("[getCargoHierarquia]", e);
    return [];
  }
}

export async function upsertSalario(params: {
  id: string;
  salario_min: number | null;
  salario_ref: number | null;
  salario_max: number | null;
  observacao?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireRole(["founder", "cfo", "pessoas"]);
    const sb = createServiceClient();
    if (!sb) return { ok: false, error: "Sem conexão" };
    const { error } = await (sb as any).rpc("upsert_cargo_salario", {
      p_id: params.id,
      p_salario_min: params.salario_min,
      p_salario_ref: params.salario_ref,
      p_salario_max: params.salario_max,
      p_observacao: params.observacao ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro inesperado" };
  }
}
