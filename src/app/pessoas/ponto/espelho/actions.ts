"use server";

import { createServiceClient } from "@kph/db/supabase/server";
import { requireUser, getUserTierLevel } from "@kph/auth/server";
import { isPipouAdmin } from "@/lib/pessoas/permissions";
import { getCurrentUnit } from "@kph/auth/unit";

const T6_SENTINEL = "00000000-0000-0000-0000-000000000010";

type RpcRow = {
  employee_id: string;
  nome_completo: string;
  funcao: string;
  unit_id: string;
  tipo: string | null;
  registrado_em: string | null;
  gps_failed: boolean | null;
};

export type EspelhoStatus = "ausente" | "trabalhando" | "em_pausa" | "encerrado";

export type EspelhoRow = {
  employee_id: string;
  nome_completo: string;
  funcao: string;
  unit_id: string;
  entrada: string | null;
  almoco: string | null;
  retorno: string | null;
  saida: string | null;
  total_minutes: number;
  status: EspelhoStatus;
  gps_warning: boolean;
};

export async function getEspelhoPonto(
  dataIso: string,
): Promise<{ rows: EspelhoRow[]; unitLabel: string }> {
  try {
    const user = await requireUser();
    const tier = getUserTierLevel(user);

    let unitId: string;
    let unitLabel: string;

    if (tier >= 6 || isPipouAdmin(user)) {
      unitId = T6_SENTINEL;
      unitLabel = "Todas as unidades";
    } else {
      const unit = await getCurrentUnit();
      if (!unit) return { rows: [], unitLabel: "" };
      unitId = unit.id;
      unitLabel = unit.name ?? "";
    }

    const supabase = createServiceClient();
    if (!supabase) return { rows: [], unitLabel };

    const { data, error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string; code?: string } | null }> }).rpc("get_punches_by_unit", {
      p_unit_id: unitId,
      p_date: dataIso,
    });

    if (error) {
      console.error("[getEspelhoPonto] rpc error — code:", error.code, "msg:", error.message, "unitId:", unitId, "date:", dataIso);
      return { rows: [], unitLabel };
    }

    const rawRows = (data ?? []) as RpcRow[];
    console.info("[getEspelhoPonto] rpc ok — unitId:", unitId, "date:", dataIso, "rows:", rawRows.length);
    return { rows: pivotRows(rawRows), unitLabel };
  } catch (e) {
    console.error("[getEspelhoPonto] exceção:", e);
    return { rows: [], unitLabel: "" };
  }
}

function pivotRows(rpcRows: RpcRow[]): EspelhoRow[] {
  const byEmployee = new Map<string, EspelhoRow>();

  for (const r of rpcRows) {
    if (!byEmployee.has(r.employee_id)) {
      byEmployee.set(r.employee_id, {
        employee_id: r.employee_id,
        nome_completo: r.nome_completo,
        funcao: r.funcao,
        unit_id: r.unit_id,
        entrada: null,
        almoco: null,
        retorno: null,
        saida: null,
        total_minutes: 0,
        status: "ausente",
        gps_warning: false,
      });
    }

    const row = byEmployee.get(r.employee_id)!;

    if (r.gps_failed) row.gps_warning = true;

    switch (r.tipo) {
      case "entrada":
        if (!row.entrada) row.entrada = r.registrado_em;
        break;
      case "intervalo_inicio":
        if (!row.almoco) row.almoco = r.registrado_em;
        break;
      case "intervalo_fim":
        if (!row.retorno) row.retorno = r.registrado_em;
        break;
      case "saida":
        row.saida = r.registrado_em;
        break;
    }
  }

  for (const row of byEmployee.values()) {
    row.status = deriveStatus(row);
    row.total_minutes = calcTotalMinutes(row);
  }

  return Array.from(byEmployee.values()).sort((a, b) =>
    a.nome_completo.localeCompare(b.nome_completo, "pt-BR"),
  );
}

function deriveStatus(row: EspelhoRow): EspelhoStatus {
  if (row.saida) return "encerrado";
  if (row.retorno) return "trabalhando";
  if (row.almoco) return "em_pausa";
  if (row.entrada) return "trabalhando";
  return "ausente";
}

function calcTotalMinutes(row: EspelhoRow): number {
  if (!row.entrada) return 0;
  const entradaMs = new Date(row.entrada).getTime();
  const now = Date.now();
  const endMs = row.saida ? new Date(row.saida).getTime() : now;
  let total = endMs - entradaMs;

  if (row.almoco) {
    const pauseEnd = row.retorno ? new Date(row.retorno).getTime() : (row.saida ? new Date(row.saida).getTime() : now);
    total -= Math.max(0, pauseEnd - new Date(row.almoco).getTime());
  }

  return Math.max(0, Math.round(total / 60000));
}
