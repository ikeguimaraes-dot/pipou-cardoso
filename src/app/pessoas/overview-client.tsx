"use client";

import { useEffect, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, GraduationCap, ShieldCheck, TriangleAlert, type LucideProps } from "lucide-react";
import { useUnit } from "@kph/auth/context";
import type { PessoasOverview } from "@/lib/pessoas/overview-server";

type Metric = { label: string; value: string; formula: string; note: string; available: boolean };
type Group = { title: string; href: string; icon: ComponentType<LucideProps>; metrics: Metric[] };
const percent = (value: number | null) => value === null ? "—" : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const number = (value: number | null) => value === null ? "—" : value.toLocaleString("pt-BR");

function MetricCard({ metric }: { metric: Metric }) {
  return <div className="min-h-[154px] border-t border-[var(--border)] px-5 py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
    <span className="block min-h-8 text-[11px] font-semibold leading-4 text-[var(--text-2)]">{metric.label}</span>
    <strong className={`mt-2 block text-[28px] leading-none tracking-[-0.5px] ${metric.available ? "text-[var(--text)]" : "text-[var(--text-3)]"}`}>{metric.value}</strong>
    <span className="mt-3 block text-[10px] leading-4 text-[var(--text-3)]">{metric.note}</span>
    <span className="mt-1 block text-[9px] leading-3 text-[var(--text-3)] opacity-75">{metric.formula}</span>
  </div>;
}

export function PessoasOverviewClient({ snapshot }: { snapshot: PessoasOverview }) {
  const { unit } = useUnit();
  const router = useRouter();
  const isGroupView = snapshot.unitId === "__all__";
  const mismatch = !isGroupView && !!unit && unit.id !== snapshot.unitId;
  useEffect(() => { if (mismatch) router.refresh(); }, [mismatch, unit?.id, router]);
  if ((!unit && !isGroupView) || mismatch) return <p className="mb-8 text-sm text-[var(--text-3)]" role="status">Atualizando os indicadores da unidade selecionada…</p>;
  if (snapshot.error) return <p className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--text-2)]" role="status">{snapshot.error}</p>;

  const groups: Group[] = [
    { title: "DP", icon: ShieldCheck, href: "/pessoas/relatorio-ponto", metrics: [
      { label: "Turnover", value: percent(snapshot.turnoverRate), available: snapshot.turnoverRate !== null, note: `${number(snapshot.departures)} desligamentos · últimos 30 dias`, formula: "((Admissões + desligamentos) ÷ 2) ÷ quadro ativo × 100" },
      { label: "Custo de pessoal sobre faturamento", value: percent(snapshot.peopleCostRate), available: false, note: "Aguardando custo total e faturamento", formula: "Custo total de pessoal ÷ faturamento bruto × 100" },
      { label: "Horas extras", value: percent(snapshot.overtimeRate), available: snapshot.overtimeRate !== null, note: snapshot.pointReference ? `Ponto consolidado · ${snapshot.pointReference}` : "Aguardando ponto consolidado", formula: "Horas extras ÷ horas previstas × 100" },
      { label: "Absenteísmo", value: percent(snapshot.absenteeismRate), available: snapshot.absenteeismRate !== null, note: snapshot.pointReference ? `Ponto consolidado · ${snapshot.pointReference}` : "Aguardando ponto consolidado", formula: "Horas de ausência ÷ horas previstas × 100" },
    ] },
    { title: "R&S", icon: BriefcaseBusiness, href: "/pessoas/vagas", metrics: [
      { label: "Tempo médio de fechamento da vaga (SLA)", value: snapshot.averageTimeToFill === null ? "—" : `${number(snapshot.averageTimeToFill)} dias`, available: snapshot.averageTimeToFill !== null, note: "Aguardando vínculo entre vaga e admissão", formula: "Σ(data de admissão − abertura) ÷ vagas fechadas" },
      { label: "Aderência do candidato (Newhire)", value: percent(snapshot.newHireAdherenceRate), available: snapshot.newHireAdherenceRate !== null, note: "Aguardando resultado da experiência", formula: "Aprovados na experiência ÷ contratados × 100" },
      { label: "Turnover de novos contratados", value: percent(snapshot.newHireTurnoverRate), available: snapshot.newHireTurnoverRate !== null, note: "Admissões dos últimos 90 dias", formula: "Desligamentos até 90 dias ÷ admissões × 100" },
    ] },
    { title: "DHO", icon: GraduationCap, href: "/pessoas/clima", metrics: [
      { label: "Índice de engajamento", value: percent(snapshot.engagementRate), available: snapshot.engagementRate !== null, note: snapshot.engagementRate === null ? "Aguardando pesquisa com respostas" : "Última pesquisa de pulso", formula: "Pontuação obtida ÷ pontuação máxima × 100" },
      { label: "eNPS", value: snapshot.enps === null ? "—" : number(snapshot.enps), available: snapshot.enps !== null, note: snapshot.enps === null ? "Aguardando pesquisa eNPS" : "Última pesquisa eNPS", formula: "% promotores − % detratores" },
    ] },
  ];

  return <section className="mb-10" aria-label="Dashboard de Pessoas">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="m-0 text-[10px] font-bold uppercase tracking-[1.4px] text-[var(--brand)]">Indicadores oficiais de Pessoas</p><h2 className="mt-1 text-xl font-semibold text-[var(--text)]">Dashboard · {snapshot.unitName}</h2></div><p className="m-0 text-xs text-[var(--text-3)]">— indica que a base necessária ainda não está disponível</p></div>
    <div className="space-y-4">{groups.map(group => { const Icon = group.icon; return <article key={group.title} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center justify-between px-5 py-4"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]"><Icon size={16} /></span><div><strong className="block text-sm text-[var(--text)]">{group.title}</strong><span className="text-[10px] text-[var(--text-3)]">KPIs definidos pela gestão</span></div></div><Link href={group.href} aria-label={`Abrir ${group.title}`} className="text-[var(--text-3)] transition-colors hover:text-[var(--brand)]"><ArrowUpRight size={17} /></Link></div>
      <div className={`grid border-t border-[var(--border)] ${group.metrics.length === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : group.metrics.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{group.metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}</div>
      {group.title === "DP" && <div className="border-t border-[var(--border)] px-5 py-4"><span className="text-[10px] font-semibold uppercase tracking-[1px] text-[var(--text-3)]">Motivos dos desligamentos · 30 dias</span><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{snapshot.terminationReasons.map(reason => <div key={reason.value} className="rounded-lg bg-[var(--surface-2)] px-3 py-3"><div className="flex items-start justify-between gap-3"><span className="text-[10px] leading-4 text-[var(--text-2)]">{reason.label}</span><b className="text-base text-[var(--text)]">{reason.count}</b></div><span className="mt-1 block text-[9px] text-[var(--text-3)]">Iniciativa: {reason.initiative}</span></div>)}</div></div>}
    </article>; })}</div>
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4"><div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-2)]"><TriangleAlert size={15} className="text-[var(--brand)]" />Alertas operacionais</div><div className="mt-3 grid gap-2 text-xs text-[var(--text-3)] sm:grid-cols-4"><span><b className="text-[var(--text)]">{number(snapshot.missingPis)}</b> PIS pendentes</span><span><b className="text-[var(--text)]">{number(snapshot.overduePositions)}</b> vagas fora do SLA</span><span><b className="text-[var(--text)]">{number(snapshot.expiredAsos)}</b> ASOs vencidos</span><span><b className="text-[var(--text)]">{number(snapshot.absences)}</b> faltas registradas no mês</span></div></div>
    {snapshot.unavailable.length > 0 && <p role="status" className="mt-3 text-[10px] leading-relaxed text-[var(--text-3)]">Fontes temporariamente indisponíveis: {[...new Set(snapshot.unavailable)].join(", ")}.</p>}
  </section>;
}
