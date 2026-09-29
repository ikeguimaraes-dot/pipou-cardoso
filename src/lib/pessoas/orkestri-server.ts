import "server-only";
import { loadPendencias, pendenciasContext, PendenciasAccessError } from "./pendencias-server";
import { defaultPeriod, saoPauloDate } from "./pendencias-model";
import { interpretPeople, workingDays, type OrkestriUnit } from "./orkestri-model";

type Employee = { id: string; unit_id: string; ativo: boolean; data_admissao: string | null; data_demissao: string | null };
type Vacancy = { id: string; unit_id: string; status: string; congelada: boolean; cancelada: boolean; data_solicitacao: string | null; created_at: string; sla_dias: number | null; cargo_grupos: { sla_dias_uteis: number } | { sla_dias_uteis: number }[] | null };
type Absence = { id: string; employees: { unit_id: string } | { unit_id: string }[] };
type Overtime = { id: string; unit_id: string; hours: number | string };

export async function loadOrkestri(requestedUnit: string | null, requestedDays: string | undefined) {
  const { client, units } = await pendenciasContext();
  if (requestedUnit && !units.some(unit => unit.id === requestedUnit)) throw new PendenciasAccessError("Você não tem acesso ao Orkestri desta unidade.");
  const selected = requestedUnit ? units.filter(unit => unit.id === requestedUnit) : units;
  const ids = selected.map(unit => unit.id);
  const days = requestedDays === "90" ? 90 : 30;
  const end = saoPauloDate();
  const from = new Date(`${end}T12:00:00Z`); from.setUTCDate(from.getUTCDate() - days + 1);
  const start = from.toISOString().slice(0, 10);
  const period = `${start.split("-").reverse().join("/")} a ${end.split("-").reverse().join("/")}`;
  const errors: string[] = [];
  async function rows<T>(label: string, build: (offset: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[] | null> {
    if (!ids.length) return [];
    try {
      const all: T[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await build(offset);
        if (error) throw new Error(label);
        const batch = (data ?? []) as T[]; all.push(...batch);
        if (batch.length < 500) return all;
      }
    } catch { errors.push(`${label}: consulta indisponível.`); return null; }
  }
  const [employees, vacancies, absences, overtime, pending] = await Promise.all([
    rows<Employee>("Colaboradores", offset => client.from("employees").select("id, unit_id, ativo, data_admissao, data_demissao").in("unit_id", ids).order("id").range(offset, offset + 499)),
    rows<Vacancy>("Vagas", offset => client.from("job_openings").select("id, unit_id, status, congelada, cancelada, data_solicitacao, created_at, sla_dias, cargo_grupos(sla_dias_uteis)").in("unit_id", ids).in("status", ["aberta", "em_admissao", "teste"]).order("id").range(offset, offset + 499)),
    rows<Absence>("Faltas", offset => client.from("absences").select("id, employees!inner(unit_id)").in("employees.unit_id", ids).gte("data", start).lte("data", end).order("id").range(offset, offset + 499)),
    rows<Overtime>("Horas extras", offset => client.from("overtime_records").select("id, unit_id, hours").in("unit_id", ids).gte("date", start).lte("date", end).order("id").range(offset, offset + 499)),
    loadPendencias(defaultPeriod(end)).catch(() => { errors.push("Central de Pendências: consulta indisponível."); return null; }),
  ]);
  if (pending) errors.push(...pending.errors);
  const inPeriod = (date: string | null) => !!date && date >= start && date <= end;
  const summaries: OrkestriUnit[] = selected.map(unit => {
    const own = employees?.filter(row => row.unit_id === unit.id);
    const jobs = vacancies?.filter(row => row.unit_id === unit.id && !row.congelada && !row.cancelada);
    const items = pending?.items.filter(row => row.unitId === unit.id);
    return {
      ...unit,
      active: own ? own.filter(row => row.ativo && (!row.data_admissao || row.data_admissao <= end)).length : null,
      admissions: own ? own.filter(row => inPeriod(row.data_admissao)).length : null,
      departures: own ? own.filter(row => inPeriod(row.data_demissao)).length : null,
      vacancies: jobs?.length ?? null,
      overdue: jobs ? jobs.filter(row => {
        const group = Array.isArray(row.cargo_grupos) ? row.cargo_grupos[0] : row.cargo_grupos;
        return workingDays(row.data_solicitacao ?? row.created_at, end) > (group?.sla_dias_uteis ?? row.sla_dias ?? 30);
      }).length : null,
      absences: absences ? absences.filter(row => (Array.isArray(row.employees) ? row.employees[0] : row.employees)?.unit_id === unit.id).length : null,
      overtime: overtime ? overtime.filter(row => row.unit_id === unit.id).reduce((sum, row) => sum + Number(row.hours || 0), 0) : null,
      pending: pending && !pending.errors.length ? items!.length : null,
      urgent: pending && !pending.errors.length ? items!.filter(row => row.priority === "alta").length : null,
    };
  });
  return { units, selectedUnit: requestedUnit, days, period, checkedAt: new Date().toISOString(), summaries,
    highlights: interpretPeople(summaries, period), errors, routinePeriod: pending?.period ?? defaultPeriod(end) };
}

export type OrkestriSnapshot = Awaited<ReturnType<typeof loadOrkestri>>;
