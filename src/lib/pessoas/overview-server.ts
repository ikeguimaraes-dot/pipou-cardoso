import "server-only";
import { pendenciasContext, PendenciasAccessError } from "./pendencias-server";
import { saoPauloDate } from "./pendencias-model";
import { TERMINATION_REASONS } from "./termination-model";

export type PessoasOverview = {
  unitId: string | null; unitName: string | null;
  active: number | null; admissions: number | null; departures: number | null;
  vacations: number | null; expiredAsos: number | null;
  absences: number | null; missingPis: number | null;
  openPositions: number | null; activeCandidates: number | null; overduePositions: number | null;
  pendingTraining: number | null; pendingReviews: number | null;
  turnoverRate: number | null; peopleCostRate: number | null;
  overtimeRate: number | null; absenteeismRate: number | null; pointReference: string | null;
  averageTimeToFill: number | null; newHireAdherenceRate: number | null; newHireTurnoverRate: number | null;
  engagementRate: number | null; enps: number | null;
  terminationReasons: { value: string; label: string; initiative: string; count: number }[];
  pointPlannedHours: number; pointOvertimeHours: number; pointAbsenceHours: number;
  newHireCount: number; newHireEarlyDepartures: number;
  unavailable: string[]; error: string | null;
};

function hours(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string" || !value.trim()) return 0;
  const normalized = value.trim().replace(",", ".");
  const match = normalized.match(/^(-?)(\d+):(\d{1,2})$/);
  if (match) {
    const amount = Number(match[2]) + Number(match[3]) / 60;
    return match[1] ? -amount : amount;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Number((numerator / denominator * 100).toFixed(1)) : null;
}

export async function loadPessoasOverview(requestedUnitId: string | null): Promise<PessoasOverview> {
  const snapshot: PessoasOverview = { unitId: requestedUnitId, unitName: null, active: null, admissions: null,
    departures: null, vacations: null, expiredAsos: null, absences: null, missingPis: null,
    openPositions: null, activeCandidates: null, overduePositions: null,
    pendingTraining: null, pendingReviews: null, unavailable: [], error: null,
    turnoverRate: null, peopleCostRate: null, overtimeRate: null,
    absenteeismRate: null, pointReference: null, averageTimeToFill: null,
    newHireAdherenceRate: null, newHireTurnoverRate: null, engagementRate: null, enps: null,
    terminationReasons: TERMINATION_REASONS.map(reason => ({ ...reason, count: 0 })),
    pointPlannedHours: 0, pointOvertimeHours: 0, pointAbsenceHours: 0,
    newHireCount: 0, newHireEarlyDepartures: 0 };
  try {
    const { client, units } = await pendenciasContext();
    const unit = requestedUnitId ? units.find(item => item.id === requestedUnitId) : units[0];
    if (!unit) { snapshot.error = "Sem acesso aos indicadores de RH desta unidade."; return snapshot; }
    snapshot.unitId = unit.id; snapshot.unitName = unit.name;
    const unitId = unit.id;
    const today = saoPauloDate();
    const monthStart = `${today.slice(0, 7)}-01`;
    const shift = (days: number) => { const date = new Date(`${today}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };
    async function count(query: PromiseLike<{ count: number | null; error: unknown }>, label: string) {
      try { const result = await query; if (result.error || result.count === null) throw new Error(); return result.count; }
      catch { snapshot.unavailable.push(label); return null; }
    }
    async function optionalCount(label: string, build: () => PromiseLike<{ count: number | null; error: unknown }>) {
      try { return await count(build(), label); }
      catch { if (!snapshot.unavailable.includes(label)) snapshot.unavailable.push(label); return null; }
    }
    async function countAsos() {
      try {
        type Aso = { employee_id: string; data_validade: string | null; data_emissao: string | null; created_at: string | null };
        const latest = new Map<string, Aso>();
        for (let offset = 0; ; offset += 500) {
          const { data, error } = await client.from("employee_documents")
            .select("id, employee_id, data_validade, data_emissao, created_at, employees!inner(unit_id, ativo)")
            .eq("tipo", "aso").eq("employees.unit_id", unitId).eq("employees.ativo", true)
            .order("id").range(offset, offset + 499);
          if (error) throw new Error();
          for (const doc of data ?? []) {
            const previous = latest.get(doc.employee_id);
            if (!previous || (doc.data_emissao ?? doc.created_at ?? "") > (previous.data_emissao ?? previous.created_at ?? "")) latest.set(doc.employee_id, doc);
          }
          if ((data?.length ?? 0) < 500) break;
        }
        return [...latest.values()].filter(doc => doc.data_validade && doc.data_validade < today).length;
      } catch { snapshot.unavailable.push("ASOs vencidos"); return null; }
    }
    async function countActiveCandidates() {
      try {
        const { data: openings, error: openingsError } = await client.from("job_openings")
          .select("id").eq("unit_id", unitId);
        if (openingsError) throw new Error();
        const ids = (openings ?? []).map(item => item.id);
        if (ids.length === 0) return 0;
        return count(client.from("candidates").select("id", { count: "exact", head: true })
          .in("job_opening_id", ids).not("status", "in", '("reprovado","desistiu")'), "Candidatos em processo");
      } catch { snapshot.unavailable.push("Candidatos em processo"); return null; }
    }
    async function countOverduePositions() {
      try {
        const { data, error } = await client.from("job_openings")
          .select("data_solicitacao, sla_dias, status").eq("unit_id", unitId)
          .in("status", ["aberta", "em_admissao", "teste"]);
        if (error) throw new Error();
        const now = new Date(`${today}T12:00:00Z`).getTime();
        return (data ?? []).filter(item => {
          if (!item.data_solicitacao || !item.sla_dias) return false;
          return now > new Date(`${item.data_solicitacao}T12:00:00Z`).getTime() + Number(item.sla_dias) * 86_400_000;
        }).length;
      } catch { snapshot.unavailable.push("Vagas fora do SLA"); return null; }
    }
    async function loadPointRates() {
      try {
        const { data: periods, error: periodError } = await client.from("ponto_mensal")
          .select("periodo").eq("unit_id", unitId).order("id", { ascending: false }).range(0, 999);
        if (periodError) throw new Error();
        const valid = [...new Set((periods ?? []).map(row => row.periodo as string)
          .filter(period => /^(0[1-9]|1[0-2])\/\d{4}$/.test(period)))];
        valid.sort((a, b) => (Number(b.slice(3)) * 12 + Number(b.slice(0, 2))) - (Number(a.slice(3)) * 12 + Number(a.slice(0, 2))));
        const latest = valid[0];
        if (!latest) return;
        const { data, error } = await client.from("ponto_mensal")
          .select("horas_previstas, horas_positivas, horas_negativas").eq("unit_id", unitId).eq("periodo", latest);
        if (error) throw new Error();
        const totals = (data ?? []).reduce((sum, row) => ({
          planned: sum.planned + Math.abs(hours(row.horas_previstas)),
          overtime: sum.overtime + Math.abs(hours(row.horas_positivas)),
          absence: sum.absence + Math.abs(hours(row.horas_negativas)),
        }), { planned: 0, overtime: 0, absence: 0 });
        snapshot.pointReference = latest;
        snapshot.pointPlannedHours = totals.planned;
        snapshot.pointOvertimeHours = totals.overtime;
        snapshot.pointAbsenceHours = totals.absence;
        snapshot.overtimeRate = rate(totals.overtime, totals.planned);
        snapshot.absenteeismRate = rate(totals.absence, totals.planned);
      } catch {
        snapshot.unavailable.push("Horas extras e absenteísmo");
      }
    }
    async function loadNewHireTurnover() {
      try {
        const start = shift(-90);
        const { data, error } = await client.from("employees")
          .select("data_admissao, data_demissao").eq("unit_id", unitId)
          .gte("data_admissao", start).lte("data_admissao", today);
        if (error) throw new Error();
        const hires = data ?? [];
        const earlyDepartures = hires.filter(row => {
          if (!row.data_admissao || !row.data_demissao) return false;
          const admitted = new Date(`${row.data_admissao}T12:00:00Z`).getTime();
          const departed = new Date(`${row.data_demissao}T12:00:00Z`).getTime();
          return departed >= admitted && departed <= admitted + 90 * 86_400_000;
        }).length;
        snapshot.newHireCount = hires.length;
        snapshot.newHireEarlyDepartures = earlyDepartures;
        snapshot.newHireTurnoverRate = rate(earlyDepartures, hires.length);
      } catch { snapshot.unavailable.push("Turnover de novos contratados"); }
    }
    async function loadClimateKpis() {
      try {
        const { data, error } = await client.from("climate_surveys" as never)
          .select("id, tipo, status, unit_id, created_at").order("created_at", { ascending: false });
        if (error) throw new Error();
        const surveys = (data ?? []) as unknown as { id: string; tipo: string; status: string; unit_id: string | null }[];
        const eligible = surveys.filter(s => s.status !== "rascunho" && (!s.unit_id || s.unit_id === unitId));
        const resultFor = async (type: "pulso" | "nps") => {
          const survey = eligible.find(s => s.tipo === type);
          if (!survey) return [];
          const { data: results, error: rpcError } = await (client as unknown as {
            rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
          }).rpc("get_survey_results", { p_survey_id: survey.id });
          if (rpcError) throw new Error();
          return (results ?? []) as { total_respostas: number; media_escala: number | null; distribuicao: Record<string, number> }[];
        };
        const [pulse, nps] = await Promise.all([resultFor("pulso"), resultFor("nps")]);
        const scale = pulse.filter(row => row.media_escala !== null && row.total_respostas > 0);
        const answers = scale.reduce((sum, row) => sum + row.total_respostas, 0);
        if (answers) snapshot.engagementRate = Number((scale.reduce((sum, row) => sum + Number(row.media_escala) * row.total_respostas, 0) / (answers * 5) * 100).toFixed(1));
        const distribution = nps.reduce<Record<string, number>>((sum, row) => {
          for (const [score, amount] of Object.entries(row.distribuicao ?? {})) sum[score] = (sum[score] ?? 0) + Number(amount);
          return sum;
        }, {});
        const total = Object.values(distribution).reduce((sum, amount) => sum + amount, 0);
        if (total) {
          const promoters = (distribution["9"] ?? 0) + (distribution["10"] ?? 0);
          const detractors = Object.entries(distribution).filter(([score]) => Number(score) <= 6).reduce((sum, [, amount]) => sum + amount, 0);
          snapshot.enps = Number(((promoters - detractors) / total * 100).toFixed(1));
        }
      } catch { snapshot.unavailable.push("Engajamento e eNPS"); }
    }
    async function loadTerminationReasons() {
      try {
        const { data, error } = await client.from("terminations")
          .select("tipo_aviso").eq("unit_id", unitId).gte("data_aviso", shift(-30)).lte("data_aviso", today);
        if (error) throw new Error();
        const counts = new Map<string, number>();
        for (const row of data ?? []) counts.set(row.tipo_aviso ?? "", (counts.get(row.tipo_aviso ?? "") ?? 0) + 1);
        snapshot.terminationReasons = TERMINATION_REASONS.map(reason => ({ ...reason, count: counts.get(reason.value) ?? 0 }));
      } catch { snapshot.unavailable.push("Motivos de desligamento"); }
    }
    [snapshot.active, snapshot.admissions, snapshot.departures, snapshot.vacations, snapshot.expiredAsos,
      snapshot.absences, snapshot.missingPis, snapshot.openPositions, snapshot.activeCandidates,
      snapshot.overduePositions, snapshot.pendingTraining, snapshot.pendingReviews] = await Promise.all([
      count(client.from("employees").select("id", { count: "exact", head: true }).eq("unit_id", unitId).eq("ativo", true), "Colaboradores ativos"),
      count(client.from("employees").select("id", { count: "exact", head: true }).eq("unit_id", unitId).gte("data_admissao", shift(-30)).lte("data_admissao", today), "Admissões"),
      count(client.from("employees").select("id", { count: "exact", head: true }).eq("unit_id", unitId).gte("data_demissao", shift(-30)).lte("data_demissao", today), "Desligamentos"),
      count(client.from("vacation_schedules").select("id", { count: "exact", head: true }).eq("unit_id", unitId).eq("status", "agendado").gte("data_inicio", today).lte("data_inicio", shift(30)), "Férias"),
      countAsos(),
      optionalCount("Faltas do mês", () => client.from("absences").select("id, employees!inner(unit_id)", { count: "exact", head: true })
        .eq("employees.unit_id", unitId).gte("data", monthStart).lte("data", today)),
      optionalCount("PIS pendentes", () => client.from("employees").select("id", { count: "exact", head: true }).eq("unit_id", unitId)
        .eq("ativo", true).is("pis", null)),
      optionalCount("Vagas abertas", () => client.from("job_openings").select("id", { count: "exact", head: true }).eq("unit_id", unitId)
        .in("status", ["aberta", "em_admissao", "teste"])),
      countActiveCandidates(),
      countOverduePositions(),
      optionalCount("Treinamentos pendentes", () => client.from("training_records").select("id, employees!inner(unit_id, ativo)", { count: "exact", head: true })
        .eq("employees.unit_id", unitId).eq("employees.ativo", true).in("status", ["pendente", "vencido"])),
      optionalCount("Avaliações pendentes", () => client.from("performance_reviews").select("id, employees!inner(unit_id, ativo)", { count: "exact", head: true })
        .eq("employees.unit_id", unitId).eq("employees.ativo", true).eq("status", "rascunho")),
    ]);
    snapshot.turnoverRate = snapshot.active && snapshot.admissions !== null && snapshot.departures !== null
      ? rate((snapshot.admissions + snapshot.departures) / 2, snapshot.active) : null;
    await Promise.all([loadPointRates(), loadNewHireTurnover(), loadClimateKpis(), loadTerminationReasons()]);
    return snapshot;
  } catch (error) {
    snapshot.error = error instanceof PendenciasAccessError ? "Indicadores disponíveis para RH e gestão com acesso a esta unidade." : "Não foi possível carregar os indicadores. Tente novamente.";
    return snapshot;
  }
}

export async function loadPessoasGroupOverview(): Promise<PessoasOverview> {
  const { units } = await pendenciasContext();
  const snapshots = await Promise.all(units.map(unit => loadPessoasOverview(unit.id)));
  if (!snapshots.length) return loadPessoasOverview(null);
  const sum = (field: keyof PessoasOverview) => snapshots.reduce((total, item) => total + (typeof item[field] === "number" ? item[field] as number : 0), 0);
  const average = (field: keyof PessoasOverview) => {
    const values = snapshots.map(item => item[field]).filter((value): value is number => typeof value === "number");
    return values.length ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : null;
  };
  const planned = sum("pointPlannedHours");
  const newHires = sum("newHireCount");
  const active = sum("active"), admissions = sum("admissions"), departures = sum("departures");
  return {
    unitId: "__all__", unitName: "Todas as casas", active, admissions, departures,
    vacations: sum("vacations"), expiredAsos: sum("expiredAsos"), absences: sum("absences"), missingPis: sum("missingPis"),
    openPositions: sum("openPositions"), activeCandidates: sum("activeCandidates"), overduePositions: sum("overduePositions"),
    pendingTraining: sum("pendingTraining"), pendingReviews: sum("pendingReviews"),
    turnoverRate: active ? rate((admissions + departures) / 2, active) : null, peopleCostRate: null,
    overtimeRate: rate(sum("pointOvertimeHours"), planned), absenteeismRate: rate(sum("pointAbsenceHours"), planned), pointReference: "Consolidado",
    averageTimeToFill: null, newHireAdherenceRate: null,
    newHireTurnoverRate: rate(sum("newHireEarlyDepartures"), newHires), engagementRate: average("engagementRate"), enps: average("enps"),
    terminationReasons: TERMINATION_REASONS.map(reason => ({ ...reason, count: snapshots.reduce((total, item) => total + (item.terminationReasons.find(row => row.value === reason.value)?.count ?? 0), 0) })),
    pointPlannedHours: planned, pointOvertimeHours: sum("pointOvertimeHours"), pointAbsenceHours: sum("pointAbsenceHours"),
    newHireCount: newHires, newHireEarlyDepartures: sum("newHireEarlyDepartures"),
    unavailable: [...new Set(snapshots.flatMap(item => item.unavailable))], error: null,
  };
}
