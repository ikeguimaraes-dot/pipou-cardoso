import "server-only";
import { revalidatePath } from "next/cache";
import { isPipouAdmin } from "./permissions";
import type { CurrentUser } from "@kph/auth/server";
import { PendenciasAccessError, pendenciasContext } from "./pendencias-server";
import { saoPauloDate } from "./pendencias-model";
import type { ActionResult } from "@/lib/result";
import { terminationReason, type TerminationReason } from "./termination-model";

/** UI visibility only. Mutations always verify identity, unit scope and RLS again. */
export async function loadTerminationAccess(user: CurrentUser | null, unitId: string): Promise<{ allowed: boolean; error: string | null }> {
  // The same grant identifies the manager in the sidebar. A separate queue
  // lookup must not silently hide the administrator's employee actions.
  if (isPipouAdmin(user)) return { allowed: true, error: null };
  if (!user) return { allowed: false, error: "Entre novamente para conferir sua permissão de desligamento." };
  try {
    const context = await pendenciasContext();
    return { allowed: context.units.some(unit => unit.id === unitId), error: null };
  } catch (error) {
    console.warn("[loadTerminationAccess] permission lookup failed", { unitId, userId: user.id, code: error instanceof PendenciasAccessError ? error.status : "unavailable" });
    return { allowed: false, error: error instanceof PendenciasAccessError && error.status === 401
      ? "Sua sessão precisa ser renovada. Entre novamente para acessar os desligamentos."
      : "Não foi possível conferir sua permissão de desligamento. Atualize a consulta para tentar novamente." };
  }
}

/** Uses the authenticated RH scope AND database RLS; never a service client. */
export async function terminateEmployee(id: string, date: string, reason: TerminationReason): Promise<ActionResult<null>> {
  try {
    if (typeof id !== "string" || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) {
      return { ok: false, error: "Colaborador inválido." };
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(`${date}T12:00:00Z`)) ||
        new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date) {
      return { ok: false, error: "Informe uma data de desligamento válida." };
    }
    if (date > saoPauloDate()) return { ok: false, error: "A data de desligamento não pode ser futura." };
    const reasonDefinition = terminationReason(reason);
    if (!reasonDefinition) return { ok: false, error: "Selecione um motivo de desligamento válido." };

    const { client, units } = await pendenciasContext();
    const { data: employee, error: readError } = await client.from("employees")
      .select("id, unit_id, nome, sobrenome, ativo, data_admissao, data_demissao")
      .eq("id", id).maybeSingle();
    if (readError) return { ok: false, error: "Não foi possível consultar o colaborador. Tente novamente." };
    if (!employee || !units.some(unit => unit.id === employee.unit_id)) {
      return { ok: false, error: "Você não tem permissão para desligar este colaborador." };
    }
    if (!employee.ativo || employee.data_demissao) return { ok: false, error: "Este colaborador já possui desligamento registrado. Atualize a página." };
    if (employee.data_admissao && date < employee.data_admissao) {
      return { ok: false, error: "A data de desligamento não pode ser anterior à admissão." };
    }
    const { error } = await client.rpc("cardoso_terminate_employee" as never, {
      p_employee_id: employee.id, p_date: date, p_reason: reason,
    } as never);
    if (error) return { ok: false, error: "Não foi possível salvar o desligamento. Atualize a página e confira os dados." };
    revalidatePath("/pessoas", "layout");
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: error instanceof PendenciasAccessError && error.status === 401
      ? "Sua sessão precisa ser renovada. Entre novamente para registrar o desligamento."
      : error instanceof Error ? error.message : "Não foi possível salvar o desligamento." };
  }
}
