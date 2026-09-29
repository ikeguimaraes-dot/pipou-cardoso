/** Complete local Pessoas navigation. Routes/permissions remain enforced by pages. */
type PessoasNavItem = {
  label: string;
  icon: string;
  href?: string;
  roles?: string[];
  children?: PessoasNavItem[];
};

export const PENDENCIAS_NAV_ITEM: PessoasNavItem = {
  label: "Pendências do RH", href: "/pessoas/pendencias", icon: "ClipboardList",
  roles: ["founder", "cfo", "ceo", "diretor", "head_rh", "pipou_admin", "pessoas", "gm"],
};

export const IMPORTACAO_NAV_ITEM: PessoasNavItem = {
  label: "Importação em massa", href: "/pessoas/importacao-massa", icon: "Upload",
  roles: PENDENCIAS_NAV_ITEM.roles,
};

export const PESSOAS_NAV_GROUP: {
  id: string;
  label: string;
  icon: string;
  defaultOpen: boolean;
  items: PessoasNavItem[];
} = {
  id: "pessoas",
  label: "Pessoas",
  icon: "Users",
  defaultOpen: true,
  items: [
    { label: "Visão Geral", href: "/pessoas", icon: "LayoutDashboard" },
    { label: "Orkestri", href: "/pessoas/orkestri", icon: "Brain", roles: PENDENCIAS_NAV_ITEM.roles },
    PENDENCIAS_NAV_ITEM,
    IMPORTACAO_NAV_ITEM,
    { label: "Aprovações", href: "/pessoas/aprovacoes", icon: "CheckSquare", roles: ["founder", "cfo", "gm", "pessoas"] },
    {
      label: "Recrutamento", icon: "Briefcase", children: [
        { label: "Vagas", href: "/pessoas/vagas", icon: "Briefcase" },
        { label: "Pipeline", href: "/pessoas/recrutamento", icon: "Users" },
        { label: "Banco de Talentos", href: "/pessoas/recrutamento/banco-talentos", icon: "UserPlus" },
        { label: "Quadro Ideal", href: "/pessoas/recrutamento/quadro-ideal", icon: "LayoutGrid" },
        { label: "Importar CVs", href: "/pessoas/recrutamento/importar-cvs", icon: "Upload" },
      ],
    },
    {
      label: "DP", icon: "User", children: [
        { label: "Colaboradores", href: "/pessoas/colaboradores", icon: "Users" },
        { label: "Ponto", href: "/pessoas/ponto", icon: "Clock" },
        { label: "Espelho de Ponto", href: "/pessoas/ponto/espelho", icon: "FileText" },
        { label: "Ajustes de Ponto", href: "/pessoas/ponto/aprovacoes", icon: "CheckSquare" },
        { label: "Faltas", href: "/pessoas/faltas", icon: "CalendarX2" },
        { label: "Horas Extras", href: "/pessoas/horas-extras", icon: "Timer" },
        { label: "Banco de Horas", href: "/pessoas/banco-de-horas", icon: "Clock" },
        { label: "Escala", href: "/pessoas/escala", icon: "CalendarDays" },
        { label: "Férias", href: "/pessoas/ferias", icon: "Plane" },
        { label: "Atestados", href: "/pessoas/atestados", icon: "ClipboardCheck" },
        { label: "Holerites", href: "/pessoas/holerites", icon: "Receipt" },
        { label: "Gorjetas", href: "/pessoas/gorjetas", icon: "DollarSign" },
        { label: "Vale Transporte", href: "/pessoas/vale-transporte", icon: "Bus" },
        { label: "Documentos", href: "/pessoas/documentos", icon: "FolderOpen" },
        { label: "Headcount", href: "/pessoas/headcount", icon: "BarChart3" },
        { label: "Cargos & Salários", href: "/pessoas/cargos-salarios", icon: "DollarSign" },
        { label: "Ponto Totvs", href: "/pessoas/importacao", icon: "Upload" },
        { label: "Relatório de Ponto", href: "/pessoas/relatorio-ponto", icon: "FileBarChart2" },
      ],
    },
    {
      label: "DHO", icon: "GraduationCap", children: [
        { label: "Onboarding", href: "/pessoas/onboarding", icon: "UserPlus" },
        { label: "Treinamentos", href: "/pessoas/treinamentos", icon: "GraduationCap" },
        { label: "Avaliações", href: "/pessoas/avaliacoes", icon: "ClipboardCheck" },
        { label: "Ciclos 360°", href: "/pessoas/avaliacoes/ciclos", icon: "Repeat2" },
        { label: "Matriz 9Box", href: "/pessoas/avaliacoes/9box", icon: "LayoutGrid" },
        { label: "PDI", href: "/pessoas/pdi", icon: "ListChecks" },
        { label: "Reuniões 1:1", href: "/pessoas/reunioes", icon: "CalendarClock" },
        { label: "Feedback", href: "/pessoas/feedback", icon: "MessageCircle" },
        { label: "Disciplina & Score", href: "/pessoas/disciplina", icon: "ShieldAlert" },
        { label: "Organograma", href: "/pessoas/organograma", icon: "Network" },
        { label: "Analytics", href: "/pessoas/analytics", icon: "BarChart2" },
      ],
    },
    { label: "Pesquisas de Clima", href: "/pessoas/clima", icon: "BarChart3" },
    {
      label: "Agentes", icon: "Bot", children: [
        { label: "Visão dos Agentes", href: "/pessoas/agentes", icon: "LayoutDashboard" },
        { label: "Maya · Recrutamento", href: "/pessoas/agentes/maya", icon: "Bot", roles: ["founder", "cfo", "gm", "pessoas"] },
        { label: "Theo · RH", href: "/pessoas/agentes/theo", icon: "Bot", roles: ["founder", "cfo", "gm", "pessoas"] },
      ],
    },
    { label: "Fechamento de Folha", href: "/pessoas/contabilidade", icon: "Calculator" },
  ],
};
