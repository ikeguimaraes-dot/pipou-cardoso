import "server-only";
import { createSupabaseServerClient } from "@kph/db/supabase/server";
import { isPipouAdminGrant } from "./permissions";
import {
  PENDENCIAS_ROLES, documentPendencias, employeePendencias, periodLabel, routinePendencias,
  saoPauloDate, validPeriod, type PendenciaEmployee, type PendenciaDocument,
  type PendenciasSnapshot, type Rotina,
} from "./pendencias-model";

export const EMPLOYEE_PENDING_COLUMNS = "id, unit_id, nome, sobrenome, ativo, data_demissao, tier, cpf, pis, telefone, email, funcao, data_admissao, tipo_contrato, contato_emergencia_nome, contato_emergencia_tel, cep, rua, numero, bairro, cidade, estado" as const;

export class PendenciasAccessError extends Error {
  constructor(message: string, public readonly status: 401 | 403 = 403) { super(message); }
}

/** Validate identity independently of the layout and never use an administrative client. */
export async function pendenciasContext(options: { includeInactiveUnits?: boolean } = {}) {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Conexão indisponível. Tente novamente.");
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) throw new PendenciasAccessError("Entre novamente para acessar as pendências.", 401);
  const { data: roles, error: rolesError } = await client.from("user_roles")
    .select("unit_id, brand_id, group_id, roles!inner(name)").eq("user_id", user.id);
  if (rolesError) throw new Error("Não foi possível conferir suas permissões.");
  const grants = (roles ?? []).filter(row => {
    const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;
    return role && PENDENCIAS_ROLES.some(name => name === role.name);
  });
  if (!grants.length) throw new PendenciasAccessError("Esta central é destinada ao RH e à gestão das unidades.");
  let unitsQuery = client.from("units").select("id, name, brand_id, brands(group_id)").order("name");
  if (!options.includeInactiveUnits) unitsQuery = unitsQuery.eq("active", true);
  const { data: units, error: unitsError } = await unitsQuery;
  if (unitsError) throw new Error("Não foi possível carregar as unidades permitidas.");
  // A user can have an RH role at A and a collaborator role at B. Do not combine their permissions.
  const allowedUnits = (units ?? []).filter(unit => grants.some(grant => {
    const role = Array.isArray(grant.roles) ? grant.roles[0] : grant.roles;
    const brand = Array.isArray(unit.brands) ? unit.brands[0] : unit.brands;
    return role?.name === "founder" || isPipouAdminGrant({ role: role?.name ?? "", unitId: grant.unit_id, brandId: grant.brand_id, groupId: grant.group_id }) || grant.unit_id === unit.id ||
      (!!grant.brand_id && grant.brand_id === unit.brand_id) ||
      (!!grant.group_id && grant.group_id === brand?.group_id);
  })).map(({ id, name }) => ({ id, name }));
  return { client, units: allowedUnits, userId: user.id };
}

async function allRows<T>(query: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await query(offset, offset + 499);
    if (result.error) throw new Error(result.error.message);
    rows.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < 500) return rows;
  }
}

export async function loadPendencias(period: string): Promise<PendenciasSnapshot> {
  if (!validPeriod(period)) throw new Error("Competência inválida.");
  const { client, units } = await pendenciasContext();
  const snapshot: PendenciasSnapshot = { units, items: [], routines: [], employeeCount: 0, employeeCounts: {}, period, checkedAt: new Date().toISOString(), errors: [] };
  if (!units.length) return snapshot;
  const unitIds = units.map(unit => unit.id);
  const employees = await allRows<PendenciaEmployee>((start, end) => client.from("employees")
    .select(EMPLOYEE_PENDING_COLUMNS).in("unit_id", unitIds).eq("ativo", true).order("id").range(start, end));
  snapshot.employeeCount = employees.length;
  snapshot.employeeCounts = Object.fromEntries(units.map(unit => [unit.id, employees.filter(e => e.unit_id === unit.id).length]));
  snapshot.items = employees.flatMap(e => employeePendencias(e, units.find(u => u.id === e.unit_id)!));
  if (!employees.length) return snapshot;
  const employeeIds = employees.map(e => e.id);
  const firstDay = `${period}-01`;
  const lastDay = new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0)).toISOString().slice(0, 10);
  // Paginated reads keep a server row limit from silently becoming a missing-data alert.
  const [docs, ponto, payslips, tips, tipsHistory] = await Promise.allSettled([
    allRows<PendenciaDocument>((start, end) => client.from("employee_documents")
      .select("id, employee_id, tipo, nome, file_path, data_validade, data_emissao, created_at")
      .in("employee_id", employeeIds).order("id").range(start, end)),
    allRows((start, end) => client.from("ponto_mensal").select("id, unit_id, employee_id")
      .in("unit_id", unitIds).in("periodo", [periodLabel(period), period]).order("id").range(start, end)),
    allRows((start, end) => client.from("payslips").select("id, employee_id")
      .in("employee_id", employeeIds).gte("competencia", firstDay).lte("competencia", lastDay).order("id").range(start, end)),
    allRows((start, end) => client.from("gorjeta_periodos").select("id, unit_id")
      .in("unit_id", unitIds).gte("data", firstDay).lte("data", lastDay).order("id").range(start, end)),
    allRows((start, end) => client.from("gorjeta_periodos").select("id, unit_id")
      .in("unit_id", unitIds).order("id").range(start, end)),
  ]);
  if (docs.status === "fulfilled") snapshot.items.push(...documentPendencias(employees, units, docs.value, saoPauloDate()));
  else snapshot.errors.push("Documentos não puderam ser conferidos. As pendências dessa frente estão indisponíveis.");
  for (const [name, result] of [["Ponto", ponto], ["Holerites", payslips], ["Gorjetas", tips], ["Histórico de gorjetas", tipsHistory]] as const) {
    if (result.status === "rejected") snapshot.errors.push(`${name}: consulta indisponível. Não interpretamos falha de consulta como ausência de registros.`);
  }
  for (const unit of units) {
    const eligible = employees.filter(e => e.unit_id === unit.id && e.tipo_contrato !== "PJ" && !!e.data_admissao && e.data_admissao <= lastDay);
    if (!employees.some(e => e.unit_id === unit.id)) continue;
    const eligibleIds = new Set(eligible.map(e => e.id));
    const make = (code: string, title: string, status: Rotina["status"], detail: string, href: string, owner = "RH / DP"): Rotina =>
      ({ id: `${code}:${unit.id}:${period}`, unitId: unit.id, unitName: unit.name, title, status, detail, href, owner });
    if (eligible.length) {
      const pointRows = ponto.status === "fulfilled" ? ponto.value.filter(r => r.unit_id === unit.id) : [];
      const pointCount = new Set(pointRows.filter(r => r.employee_id && eligibleIds.has(r.employee_id)).map(r => r.employee_id)).size;
      const unlinked = pointRows.filter(r => !r.employee_id).length;
      snapshot.routines.push(make("ponto", `Ponto · ${periodLabel(period)}`, ponto.status === "rejected" ? "indisponivel" : pointCount === eligible.length ? "registrado" : pointRows.length ? "parcial" : "sem_registro",
        `${pointCount} de ${eligible.length} colaboradores com resumo mensal vinculado.${unlinked ? ` Há ${unlinked} linhas sem vínculo: confira a importação antes de relançar.` : ""}`, "/pessoas/relatorio-ponto"));
      const slipCount = payslips.status === "fulfilled" ? new Set(payslips.value.filter(r => eligibleIds.has(r.employee_id)).map(r => r.employee_id)).size : 0;
      snapshot.routines.push(make("holerites", `Holerites · ${periodLabel(period)}`, payslips.status === "rejected" ? "indisponivel" : slipCount === eligible.length ? "registrado" : slipCount ? "parcial" : "sem_registro",
        `${slipCount} de ${eligible.length} colaboradores com holerite registrado. Registro não confirma pagamento ou conferência.`, `/pessoas/holerites?mes=${Number(period.slice(5, 7))}&ano=${period.slice(0, 4)}`, "DP + Contabilidade"));
    }
    const hadTips = tipsHistory.status === "fulfilled" && tipsHistory.value.some(r => r.unit_id === unit.id);
    const tipCount = tips.status === "fulfilled" ? tips.value.filter(r => r.unit_id === unit.id).length : 0;
    // No automatic obligation is inferred for a unit that never used this module.
    if (hadTips || tipsHistory.status === "rejected" || tips.status === "rejected") snapshot.routines.push(make("gorjetas", `Gorjetas · ${periodLabel(period)}`,
      tips.status === "rejected" || tipsHistory.status === "rejected" ? "indisponivel" : tipCount ? "registrado" : "sem_registro",
      tipCount ? `${tipCount} apurações registradas. Confira o período completo e o rateio com a operação.` : "Unidade com histórico de gorjetas e sem apuração registrada nesta competência.", "/pessoas/gorjetas", "RH + Operação"));
  }
  snapshot.items.push(...routinePendencias(snapshot.routines));
  snapshot.items.sort((a, b) => (a.priority === "alta" ? 0 : 1) - (b.priority === "alta" ? 0 : 1) || a.employeeName.localeCompare(b.employeeName, "pt-BR") || a.title.localeCompare(b.title, "pt-BR"));
  return snapshot;
}
