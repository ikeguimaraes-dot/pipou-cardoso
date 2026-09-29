// ── Navegação do módulo Pessoas — grupos colapsáveis + visibilidade por tier ──
//
// EXPORTÁVEL: este arquivo é a fonte única da estrutura de navegação de Pessoas.
// Ao propagar o design system para os outros zone repos (item 12 do roadmap),
// copiar este arquivo + a lógica de render de grupos do Sidebar.tsx.
//
// minTier é FILTRO DE UI, não segurança — toda rota continua protegida
// server-side por requireUser/requireRole/RLS. Não remover proteções de rota.
//
// Tiers (getUserTierLevel em @kph/auth/server):
//   T1 colaborador · T2 (sem roles ainda; itens minTier 2 aparecem do T3 em diante)
//   T3 gestão de unidade · T5 heads · T6 diretoria. T4–T6 veem tudo.

import {
  LayoutDashboard, ShieldCheck,
  Clock, CalendarX2, Timer, Hourglass, Stethoscope, CalendarDays, Plane,
  Receipt, DollarSign, Bus,
  User, FolderOpen, UserPlus, Network, BarChart3,
  GraduationCap, ClipboardCheck, Repeat2, LayoutGrid, ListChecks,
  CalendarClock, MessageCircle, ShieldAlert,
  Briefcase, Users,
  Bot, Upload, Table2, ClipboardEdit, Calculator,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PessoasNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Tier mínimo (1–6) para o item aparecer no menu. */
  minTier: number;
  /** Item recebe badge de count. */
  badge?: "approvals" | "punchAdj";
};

export type PessoasNavGroup = {
  id: string;
  /** null = itens de topo, sem header colapsável. */
  label: string | null;
  defaultOpen: boolean;
  minTier: number;
  items: PessoasNavItem[];
};

export const PESSOAS_NAV_GROUPS: PessoasNavGroup[] = [
  // ── Topo — sem header, sempre visível ──
  {
    id: "pessoas-top",
    label: null,
    defaultOpen: true,
    minTier: 1,
    items: [
      { href: "/pessoas", label: "Visão Geral", icon: LayoutDashboard, minTier: 1 },
      { href: "/pessoas/aprovacoes", label: "Aprovações", icon: ShieldCheck, minTier: 2, badge: "approvals" },
    ],
  },
  // ── RECRUTAMENTO ──
  {
    id: "pessoas-recrutamento",
    label: "Recrutamento",
    defaultOpen: true,
    minTier: 2,
    items: [
      { href: "/pessoas/vagas", label: "Vagas", icon: Briefcase, minTier: 2 },
      { href: "/pessoas/recrutamento", label: "Pipeline", icon: Users, minTier: 2 },
      // Candidatos: sem rota própria (só /pessoas/recrutamento/[id]) → omitido
    ],
  },
  // ── DP — Departamento Pessoal ──
  {
    id: "pessoas-dp",
    label: "DP",
    defaultOpen: true,
    minTier: 1,
    items: [
      { href: "/pessoas/colaboradores", label: "Colaboradores", icon: User, minTier: 1 },
      { href: "/pessoas/ponto", label: "Ponto", icon: Clock, minTier: 1 },
      { href: "/pessoas/ponto/espelho", label: "Espelho de Ponto", icon: Table2, minTier: 3 },
      { href: "/pessoas/ponto/aprovacoes", label: "Ajustes de Ponto", icon: ClipboardEdit, minTier: 3, badge: "punchAdj" },
      { href: "/pessoas/faltas", label: "Faltas", icon: CalendarX2, minTier: 1 },
      { href: "/pessoas/horas-extras", label: "Horas Extras", icon: Timer, minTier: 1 },
      { href: "/pessoas/banco-de-horas", label: "Banco de Horas", icon: Hourglass, minTier: 1 },
      { href: "/pessoas/escala", label: "Escala", icon: CalendarDays, minTier: 2 },
      { href: "/pessoas/ferias", label: "Férias", icon: Plane, minTier: 1 },
      { href: "/pessoas/atestados", label: "Atestados", icon: Stethoscope, minTier: 1 },
      { href: "/pessoas/holerites", label: "Holerites", icon: Receipt, minTier: 1 },
      { href: "/pessoas/gorjetas", label: "Gorjetas", icon: DollarSign, minTier: 2 },
      { href: "/pessoas/vale-transporte", label: "Vale Transporte", icon: Bus, minTier: 2 },
      { href: "/pessoas/documentos", label: "Documentos", icon: FolderOpen, minTier: 2 },
      { href: "/pessoas/headcount", label: "Headcount", icon: BarChart3, minTier: 3 },
      { href: "/pessoas/cargos-salarios", label: "Cargos & Salários", icon: DollarSign, minTier: 4 },
      { href: "/pessoas/importacao", label: "Importar Dados", icon: Upload, minTier: 4 },
    ],
  },
  // ── DHO — Desenvolvimento Humano e Organizacional ──
  {
    id: "pessoas-dho",
    label: "DHO",
    defaultOpen: false,
    minTier: 1,
    items: [
      { href: "/pessoas/onboarding", label: "Onboarding", icon: UserPlus, minTier: 2 },
      { href: "/pessoas/treinamentos", label: "Treinamentos", icon: GraduationCap, minTier: 1 },
      { href: "/pessoas/avaliacoes", label: "Avaliações", icon: ClipboardCheck, minTier: 2 },
      { href: "/pessoas/avaliacoes/ciclos", label: "Ciclos 360°", icon: Repeat2, minTier: 3 },
      { href: "/pessoas/avaliacoes/9box", label: "Matriz 9Box", icon: LayoutGrid, minTier: 3 },
      { href: "/pessoas/pdi", label: "PDI", icon: ListChecks, minTier: 2 },
      { href: "/pessoas/reunioes", label: "Reuniões 1:1", icon: CalendarClock, minTier: 2 },
      { href: "/pessoas/feedback", label: "Feedback", icon: MessageCircle, minTier: 2 },
      { href: "/pessoas/disciplina", label: "Disciplina & Score", icon: ShieldAlert, minTier: 2 },
      { href: "/pessoas/organograma", label: "Organograma", icon: Network, minTier: 3 },
    ],
  },
  // ── TIME ──
  {
    id: "pessoas-time",
    label: "Time",
    defaultOpen: false,
    minTier: 3,
    items: [
      { href: "/pessoas/clima", label: "Pesquisas de Clima", icon: BarChart3, minTier: 3 },
    ],
  },
  // ── AGENTES ──
  {
    id: "pessoas-agentes",
    label: "Agentes",
    defaultOpen: false,
    minTier: 3,
    items: [
      { href: "/pessoas/agentes/maya", label: "Maya", icon: Bot, minTier: 3 },
      { href: "/pessoas/agentes/theo", label: "Theo", icon: Bot, minTier: 3 },
    ],
  },
  // ── CONTABILIDADE ──
  {
    id: "pessoas-contabilidade",
    label: "Contabilidade",
    defaultOpen: false,
    minTier: 4,
    items: [
      { href: "/pessoas/contabilidade", label: "Fechamento de Folha", icon: Calculator, minTier: 4 },
    ],
  },
];

/** Filtra grupos/itens pelo tier do usuário. Grupos sem itens visíveis somem. */
export function filterPessoasNavByTier(tier: number): PessoasNavGroup[] {
  return PESSOAS_NAV_GROUPS
    .filter((g) => tier >= g.minTier)
    .map((g) => ({ ...g, items: g.items.filter((it) => tier >= it.minTier) }))
    .filter((g) => g.items.length > 0);
}
