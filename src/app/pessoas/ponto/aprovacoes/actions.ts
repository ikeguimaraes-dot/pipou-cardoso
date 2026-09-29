"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@kph/db/supabase/server";
import { requireUser, getUserTierLevel } from "@kph/auth/server";
import { isPipouAdmin } from "@/lib/pessoas/permissions";
import { getCurrentUnit } from "@kph/auth/unit";

export type AdjustmentRequest = {
  id: string;
  employee_id: string;
  data_referencia: string;
  horario_saida_almoco: string;
  horario_retorno_almoco: string;
  motivo: string;
  status: string;
  created_at: string;
  employee_nome: string;
  employee_funcao: string;
  unit_id: string;
};

type AdjStatus = "pendente" | "aprovado" | "rejeitado";

type RawRow = {
  id: string;
  employee_id: string;
  data_referencia: string;
  horario_saida_almoco: string;
  horario_retorno_almoco: string;
  motivo: string;
  status: string;
  created_at: string;
  employees: { nome: string; sobrenome: string; funcao: string; unit_id: string };
};

export async function getAdjustmentRequests(status: AdjStatus): Promise<AdjustmentRequest[]> {
  try {
    const user = await requireUser();
    const tier = getUserTierLevel(user);
    const supabase = createServiceClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("punch_adjustment_requests" as never)
      .select("id, employee_id, data_referencia, horario_saida_almoco, horario_retorno_almoco, motivo, status, created_at, employees!inner(nome, sobrenome, funcao, unit_id)")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const rows = data as unknown as RawRow[];

    let filtered = rows;
    if (tier < 6 && !isPipouAdmin(user)) {
      const unit = await getCurrentUnit();
      if (!unit) return [];
      filtered = rows.filter(r => r.employees.unit_id === unit.id);
    }

    return filtered.map(r => ({
      id: r.id,
      employee_id: r.employee_id,
      data_referencia: r.data_referencia,
      horario_saida_almoco: String(r.horario_saida_almoco).slice(0, 5),
      horario_retorno_almoco: String(r.horario_retorno_almoco).slice(0, 5),
      motivo: r.motivo,
      status: r.status,
      created_at: r.created_at,
      employee_nome: `${r.employees.nome} ${r.employees.sobrenome}`.trim(),
      employee_funcao: r.employees.funcao,
      unit_id: r.employees.unit_id,
    }));
  } catch {
    return [];
  }
}

export async function resolveAdjustmentAction(formData: FormData): Promise<void> {
  const id = formData.get("id") as string | null;
  const status = formData.get("status") as "aprovado" | "rejeitado" | null;
  if (!id || !status) return;

  try {
    const user = await requireUser();
    const supabase = createServiceClient();
    if (!supabase) return;

    await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }> })
      .rpc("resolve_punch_adjustment", {
        p_request_id: id,
        p_aprovado_por: user.id,
        p_status: status,
        p_inserir_punches: status === "aprovado",
      });
  } catch {
    // silencia — revalidate acontece de qualquer forma
  }

  revalidatePath("/pessoas/ponto/aprovacoes");
}

export async function countPendingPunchAdjustments(): Promise<number> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return 0;
    const { count, error } = await (supabase as unknown as {
      from: (t: string) => { select: (c: string, o: object) => { eq: (k: string, v: string) => Promise<{ count: number | null; error: unknown }> } };
    }).from("punch_adjustment_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendente");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export type OutOfRangePunch = {
  id: string;
  employee_nome: string;
  employee_funcao: string;
  tipo: string;
  timestamp_punch: string;
  distance_meters: number | null;
  unit_id: string;
};

export async function getOutOfRangePunches(): Promise<OutOfRangePunch[]> {
  try {
    const user = await requireUser();
    const tier = getUserTierLevel(user);
    const supabase = createServiceClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("time_clock_punches" as never)
      .select("id, tipo, timestamp_punch, distance_meters, employee_id, employees!inner(nome, sobrenome, funcao, unit_id)")
      .eq("aprovado", false)
      .eq("gps_failed", false)
      .in("tipo", ["entrada", "saida"])
      .order("timestamp_punch", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    type RawPunch = {
      id: string;
      tipo: string;
      timestamp_punch: string;
      distance_meters: number | null;
      employee_id: string;
      employees: { nome: string; sobrenome: string; funcao: string; unit_id: string };
    };

    const rows = data as unknown as RawPunch[];

    let filtered = rows;
    if (tier < 6 && !isPipouAdmin(user)) {
      const unit = await getCurrentUnit();
      if (!unit) return [];
      filtered = rows.filter(r => r.employees.unit_id === unit.id);
    }

    return filtered.map(r => ({
      id: r.id,
      employee_nome: `${r.employees.nome} ${r.employees.sobrenome}`.trim(),
      employee_funcao: r.employees.funcao,
      tipo: r.tipo,
      timestamp_punch: r.timestamp_punch,
      distance_meters: r.distance_meters,
      unit_id: r.employees.unit_id,
    }));
  } catch {
    return [];
  }
}

export async function approvePunch(punch_id: string, approved_by: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  await supabase
    .from("time_clock_punches" as never)
    .update({ aprovado: true, aprovado_por: approved_by } as never)
    .eq("id", punch_id);
}

export async function approvePunchAction(formData: FormData): Promise<void> {
  const id = formData.get("id") as string | null;
  if (!id) return;
  try {
    const user = await requireUser();
    await approvePunch(id, user.id);
  } catch (e) {
    console.error("[approvePunchAction]", e);
    return;
  }
  revalidatePath("/pessoas/ponto/aprovacoes");
}

export async function countOutOfRangePunches(): Promise<number> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return 0;
    const { count, error } = await supabase
      .from("time_clock_punches" as never)
      .select("id", { count: "exact", head: true } as never)
      .eq("aprovado", false)
      .eq("gps_failed", false)
      .in("tipo", ["entrada", "saida"] as never);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
