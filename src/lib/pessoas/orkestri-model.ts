export type OrkestriUnit = {
  id: string; name: string;
  active: number | null; admissions: number | null; departures: number | null;
  vacancies: number | null; overdue: number | null;
  absences: number | null; overtime: number | null;
  pending: number | null; urgent: number | null;
};
export type Highlight = {
  id: string; unitId: string; unitName: string; title: string;
  evidence: string; recommendation: string; source: string; href: string;
  priority: number; period: string;
};

/** Recommendations are explicit rules, not causal claims or an AI-generated diagnosis. */
export function interpretPeople(units: OrkestriUnit[], period: string): Highlight[] {
  return units.flatMap(unit => {
    const findings: Highlight[] = [];
    const add = (key: string, title: string, evidence: string, recommendation: string, source: string, href: string, priority: number) => {
      findings.push({ id: `${unit.id}:${key}`, unitId: unit.id, unitName: unit.name, title, evidence, recommendation, source, href, priority, period });
    };
    if (unit.departures !== null && unit.admissions !== null && unit.departures > unit.admissions) {
      add("quadro", "Saídas superam admissões", `${unit.departures} desligamentos e ${unit.admissions} admissões. Saldo de ${unit.admissions - unit.departures} pessoas no período.`, "Conferir a cobertura das escalas e decidir quais posições precisam de reposição.", "Cadastro de colaboradores · datas de admissão e demissão", "/pessoas/colaboradores", 1);
    } else if (unit.departures !== null && unit.departures > 0) {
      add("saidas", "Revisar os motivos das saídas", `${unit.departures} desligamentos registrados no período.`, "Revisar os motivos com o RH e verificar se há concentração por cargo ou liderança.", "Cadastro de colaboradores · data de demissão", "/pessoas/colaboradores", 2);
    }
    if (unit.overdue !== null && unit.overdue > 0) add("vagas", "Destravar vagas acima do prazo", `${unit.overdue} de ${unit.vacancies} vagas ativas acima do SLA cadastrado, contado em dias de segunda a sexta.`, "Revisar o pipeline com recrutamento e definir o próximo passo das vagas prioritárias.", "Vagas · solicitação, grupo de cargo e SLA (sem desconto de feriados)", "/pessoas/vagas", 1);
    if (unit.urgent !== null && unit.urgent > 0) add("pendencias", "Organizar a regularização do RH", `${unit.urgent} pendências de prioridade alta entre ${unit.pending} ocorrências da unidade. Uma pessoa pode ter várias pendências.`, "Agrupar por problema e distribuir a conferência e o preenchimento entre a equipe.", "Central de Pendências · regras de cadastro e documentos", "/pessoas/pendencias", 2);
    if (unit.absences !== null && unit.absences > 0) add("faltas", "Conferir ausências e cobertura", `${unit.absences} registros de ausência no período. Não equivale a pessoas distintas ou a uma taxa de absenteísmo.`, "Conferir justificativas e ajustar a cobertura da escala quando necessário.", "Faltas · registros por data", "/pessoas/faltas", 2);
    if (unit.overtime !== null && unit.overtime > 0) add("horas", "Revisar as horas adicionais registradas", `${unit.overtime.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} horas no módulo Horas Extras durante o período. Inclui registros ainda não aprovados.`, "Conferir aprovações e a necessidade de ajuste das escalas com o gestor.", "Horas Extras · registros por data (não inclui automaticamente todo o histórico importado)", "/pessoas/horas-extras", 2);
    return findings;
  }).sort((a, b) => a.priority - b.priority || a.unitName.localeCompare(b.unitName));
}

export function turnover(unit: Pick<OrkestriUnit, "active" | "admissions" | "departures">): number | null {
  if (unit.active === null || unit.admissions === null || unit.departures === null || unit.active <= 0) return null;
  return ((unit.admissions + unit.departures) / 2) / unit.active * 100;
}

export function workingDays(start: string, end: string): number {
  const current = new Date(`${start.slice(0, 10)}T12:00:00Z`);
  const last = new Date(`${end}T12:00:00Z`);
  if (!Number.isFinite(current.getTime()) || current > last) return 0;
  let days = 0;
  while (current < last) {
    if (current.getUTCDay() !== 0 && current.getUTCDay() !== 6) days++;
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}
