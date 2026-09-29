import Link from "next/link";
import { Suspense } from "react";
import {
  CalendarClock, Clock3, Receipt, ShieldAlert, UserCog, ArrowUpRight,
  ClipboardList, Timer, UserMinus, FileText, Palmtree, PieChart,
  Coins, Bus, UploadCloud, Star, GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@kph/auth/server";
import { cookies } from "next/headers";
import { PendenciasEntry } from "./pendencias-entry";
import { loadPessoasGroupOverview, loadPessoasOverview } from "@/lib/pessoas/overview-server";
import { PessoasOverviewClient } from "./overview-client";
import { PENDENCIAS_ROLES } from "@/lib/pessoas/pendencias-model";

type SubModule = {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  status: "em-construcao" | "ativo";
};

type Category = {
  title: string;
  items: SubModule[];
};

const CATEGORIES: ReadonlyArray<Category> = [
  {
    title: "Gestão de Jornada & Escala",
    items: [
      {
        href: "/pessoas/ponto",
        label: "Ponto",
        desc: "PWA com câmera + geolocalização. Aprovação pelo gerente.",
        icon: Clock3,
        status: "ativo",
      },
      {
        href: "/pessoas/relatorio-ponto",
        label: "Relatório de Ponto",
        desc: "Espelho de ponto, inconsistências e fechamento.",
        icon: ClipboardList,
        status: "ativo",
      },
      {
        href: "/pessoas/escala",
        label: "Escala",
        desc: "Drag-and-drop denso, labor cost realtime ao mover turno.",
        icon: CalendarClock,
        status: "ativo",
      },
      {
        href: "/pessoas/horas-extras",
        label: "Horas Extras",
        desc: "Acompanhamento e aprovação de horas adicionais.",
        icon: Timer,
        status: "ativo",
      },
      {
        href: "/pessoas/faltas",
        label: "Faltas",
        desc: "Registro e justificativa de ausências e atrasos.",
        icon: UserMinus,
        status: "ativo",
      },
    ],
  },
  {
    title: "Gestão de Pessoal",
    items: [
      {
        href: "/pessoas/colaboradores",
        label: "Colaboradores",
        desc: "Cadastro completo eSocial: CPF, RG, PIS, CTPS, endereço.",
        icon: UserCog,
        status: "ativo",
      },
      {
        href: "/pessoas/documentos",
        label: "Documentos",
        desc: "Gestão de contratos, exames admissionais e atestados.",
        icon: FileText,
        status: "ativo",
      },
      {
        href: "/pessoas/ferias",
        label: "Férias",
        desc: "Controle de períodos aquisitivos e concessão.",
        icon: Palmtree,
        status: "ativo",
      },
      {
        href: "/pessoas/headcount",
        label: "Headcount",
        desc: "Visão geral do quadro de vagas e turnover.",
        icon: PieChart,
        status: "ativo",
      },
    ],
  },
  {
    title: "Financeiro & Remuneração",
    items: [
      {
        href: "/pessoas/holerites",
        label: "Holerites",
        desc: "Cálculo CLT + Sinthoresp + DSR sobre gorjeta. PDF on-demand.",
        icon: Receipt,
        status: "ativo",
      },
      {
        href: "/pessoas/gorjetas",
        label: "Gorjetas",
        desc: "Rateio de taxas de serviço e caixinha.",
        icon: Coins,
        status: "ativo",
      },
      {
        href: "/pessoas/vale-transporte",
        label: "Vale Transporte",
        desc: "Gestão de rotas e integração com operadoras.",
        icon: Bus,
        status: "ativo",
      },
      {
        href: "/pessoas/importacao",
        label: "Importação",
        desc: "Importação de dados de folha e sistemas legados.",
        icon: UploadCloud,
        status: "ativo",
      },
    ],
  },
  {
    title: "Desenvolvimento & Performance",
    items: [
      {
        href: "/pessoas/avaliacoes",
        label: "Avaliações",
        desc: "Avaliação de desempenho e feedback contínuo.",
        icon: Star,
        status: "ativo",
      },
      {
        href: "/pessoas/treinamentos",
        label: "Treinamentos",
        desc: "Capacitação, certificações e onboarding.",
        icon: GraduationCap,
        status: "ativo",
      },
      {
        href: "/pessoas/disciplina",
        label: "Score & Disciplina",
        desc: "Advertências verbal/escrita/suspensão + faltas tipadas.",
        icon: ShieldAlert,
        status: "ativo",
      },
    ],
  },
];

// ─── KPI Widget ───────────────────────────────────────────────────────────────

async function PessoasKpiWidget({ allUnits }: { allUnits: boolean }) {
  const selectedUnit = (await cookies()).get("kph_unit_id")?.value ?? null;
  return <PessoasOverviewClient snapshot={allUnits ? await loadPessoasGroupOverview() : await loadPessoasOverview(selectedUnit)} />;
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function PessoasPage({ searchParams }: { searchParams: Promise<{ unidades?: string }> }) {
  const user = await requireUser();
  const allUnits = (await searchParams).unidades === "todas";

  return (
    <div className="mx-auto max-w-[1200px]">
      <header className="mb-8">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[1.6px] text-[var(--brand)]">
          Visão Geral
        </div>
        <h1 className="mb-3 text-[32px] font-bold tracking-[-0.5px] text-[var(--text)]">
          Pessoas
        </h1>
        <p className="max-w-[720px] text-[14px] leading-[1.6] text-[var(--text-2)]">
          Acompanhe os indicadores de DP, R&S e DHO e acesse as rotinas {allUnits ? "de todas as casas" : "da unidade ativa"}.
          Use o seletor da barra lateral para alternar a visão.
        </p>
      </header>

      {user.roles.some(grant => PENDENCIAS_ROLES.some(role => role === grant.role)) && <PendenciasEntry />}

      <Suspense fallback={null}>
        <PessoasKpiWidget allUnits={allUnits} />
      </Suspense>

      <div className="flex flex-col gap-12">
        {CATEGORIES.map((category) => (
          <section key={category.title}>
            <h2 className="mb-5 flex items-center gap-2 text-[18px] font-semibold text-[var(--text)]">
              <div className="h-4 w-1 rounded-[2px] bg-[var(--brand)]" />
              {category.title}
            </h2>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {category.items.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="group relative flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] no-underline transition-all duration-200 hover:-translate-y-[2px] hover:border-[var(--brand-soft)] hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                          <Icon size={18} />
                        </span>
                        <span className="text-[15px] font-semibold">{m.label}</span>
                      </div>
                      <ArrowUpRight
                        size={16}
                        aria-hidden="true"
                        className="text-[var(--text-3)] transition-transform duration-200 group-hover:translate-x-[2px] group-hover:-translate-y-[2px] group-hover:text-[var(--brand)]"
                      />
                    </div>
                    <p className="m-0 flex-1 text-[13px] leading-[1.5] text-[var(--text-2)]">
                      {m.desc}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.8px]">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: m.status === "ativo" ? "#22C55E" : "var(--text-3)" }}
                      />
                      <span style={{ color: m.status === "ativo" ? "#22C55E" : "var(--text-3)" }}>
                        {m.status === "ativo" ? "Ativo" : "Em construção"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-16 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 text-[13px] leading-[1.6] text-[var(--text-2)]">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[var(--text-3)]">
          Sessão
        </div>
        Você está como{" "}
        <span className="font-semibold text-[var(--text)]">{user.email}</span>
        {", com acesso de "}
        <span className="font-semibold text-[var(--brand)]">{user.roles[0]?.role ?? "—"}</span>.
      </footer>
    </div>
  );
}
