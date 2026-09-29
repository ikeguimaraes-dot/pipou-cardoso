// ── Configuração do pipeline de recrutamento (estágios + SLA) ──
// Fonte única dos estágios do kanban. CandidatoStatus deriva daqui.

export const PIPELINE_STAGES = [
  // ── Funil ativo (11 etapas) ─────────────────────────────────────
  { id: "novo",                    label: "Candidatos",              sla_dias: 1,    cor: "#8A8278", final: false,
    descricao: "Candidato entrou no processo. Ainda não analisado. SLA: 1 dia para triagem de currículo." },
  { id: "triagem",                 label: "Triagem",                 sla_dias: 2,    cor: "#60A5FA", final: false,
    descricao: "Análise de currículo pelo RH. Verifica aderência ao cargo antes de agendar entrevista. SLA: 2 dias." },
  { id: "agendamento",             label: "Agendamento",             sla_dias: 2,    cor: "var(--brasa)", final: false,
    descricao: "Entrevista agendada, aguardando realização. Enviar link do Meet se videoconferência. SLA: 2 dias." },
  { id: "entrevista",              label: "Entrevista RH",           sla_dias: 2,    cor: "#F59E0B", final: false,
    descricao: "Entrevista realizada. RH registra parecer e avança para avaliação administrativa. SLA: 2 dias." },
  { id: "avaliacao_administrativa",label: "Entrevista Gestor",       sla_dias: 2,    cor: "#B8975A", final: false,
    descricao: "RH preenche os 4 fatores do Score Card (habilidades, experiência, técnico, comportamental). SLA: 2 dias." },
  { id: "entrevista_diretoria",    label: "Entrevista Diretoria",    sla_dias: 2,    cor: "#0EA5E9", final: false,
    descricao: "Entrevista final com a diretoria. Aplicada automaticamente por cargo; pode ser sobrescrita manualmente." },
  { id: "agendamento_teste",       label: "Teste Prático",           sla_dias: 2,    cor: "#8B5CF6", final: false,
    descricao: "Teste prático agendado com o gestor da área. SLA: 2 dias para realizar." },
  { id: "feedback_operacional",    label: "Feedback Operacional",    sla_dias: 2,    cor: "#EC4899", final: false,
    descricao: "Gestor preenche os 5 fatores do Score Card operacional pós-teste. SLA: 2 dias." },
  { id: "decisao",                 label: "Decisão",                 sla_dias: 1,    cor: "#0891B2", final: false,
    descricao: "Decisão final: contratar, reprovar ou banco de talentos. SLA: 1 dia." },
  { id: "aprovado",                label: "Aprovado",                sla_dias: 2,    cor: "#22C55E", final: false,
    descricao: "Candidato aprovado aguardando onboarding/admissão." },
  { id: "contratado",              label: "Contratado",              sla_dias: 7,    cor: "#16A34A", final: false,
    descricao: "Aprovado e admissão iniciada. Acionar DP para documentação, coletar dados, definir início. SLA: 7 dias." },
  // ── Terminais — colapsados por default no kanban ─────────────────
  { id: "banco_talentos", label: "Banco de Talentos", sla_dias: null, cor: "#9333EA", final: true,
    descricao: "Perfil interessante sem vaga disponível. Reativar quando surgir vaga compatível." },
  { id: "reprovado",      label: "Reprovado",         sla_dias: null, cor: "#DC2626", final: true,
    descricao: "Não avançou no processo. Registrar motivo; verificar se vai para o Banco de Talentos." },
  { id: "desistiu",       label: "Desistiu",          sla_dias: null, cor: "#64748B", final: true,
    descricao: "Saiu por iniciativa própria — não compareceu, aceitou outra proposta ou não respondeu." },
] as const;

export type CandidatoStatus = (typeof PIPELINE_STAGES)[number]["id"];

export const ESTAGIOS_ATIVOS = PIPELINE_STAGES.filter((s) => !s.final);
export const ESTAGIOS_FINAIS = PIPELINE_STAGES.filter((s) => s.final);

/** Próximo estágio ativo na esteira (11 etapas). */
export const PROXIMO_ESTAGIO: Partial<Record<CandidatoStatus, CandidatoStatus>> = {
  novo:                    "triagem",
  triagem:                 "agendamento",
  agendamento:             "entrevista",
  entrevista:              "avaliacao_administrativa",
  avaliacao_administrativa:"entrevista_diretoria",
  entrevista_diretoria:    "agendamento_teste",
  agendamento_teste:       "feedback_operacional",
  feedback_operacional:    "decisao",
  decisao:                 "aprovado",
  aprovado:                "contratado",
};

export type SlaStatus = "ok" | "atencao" | "atrasado";

/** Dias úteis (seg-sex) entre duas datas. Feriados nacionais: implementação futura. */
function diasUteisEntre(inicio: Date, fim: Date): number {
  let count = 0;
  const cur = new Date(inicio);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(fim);
  end.setHours(0, 0, 0, 0);
  while (cur < end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Calcula SLA de um candidato.
 *
 * Com slaGrupoDiasUteis: dias úteis desde updatedAt vs SLA do grupo de cargo (todo o processo).
 * Sem: dias corridos vs SLA fixo do estágio atual (fallback).
 */
export function calcularSlaStatus(
  status: CandidatoStatus,
  updatedAt: string | null,
  slaGrupoDiasUteis?: number | null,
): SlaStatus {
  if (!updatedAt) return "ok";
  const ref = new Date(updatedAt);

  if (slaGrupoDiasUteis) {
    const dias = diasUteisEntre(ref, new Date());
    if (dias >= slaGrupoDiasUteis) return "atrasado";
    if (dias >= slaGrupoDiasUteis * 0.7) return "atencao";
    return "ok";
  }

  const stage = PIPELINE_STAGES.find((s) => s.id === status);
  if (!stage?.sla_dias) return "ok";
  const dias = Math.floor((Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24));
  if (dias >= stage.sla_dias) return "atrasado";
  if (dias >= stage.sla_dias * 0.7) return "atencao";
  return "ok";
}

/** Dias úteis desde `desde` até agora. Usado para SLA da vaga no header do kanban. */
export function diasUteisDesde(desde: string | null): number {
  if (!desde) return 0;
  return diasUteisEntre(new Date(desde), new Date());
}

export const SLA_COR: Record<SlaStatus, string> = {
  ok: "#16A34A",
  atencao: "#CA8A04",
  atrasado: "#DC2626",
};

export const SLA_LABEL: Record<SlaStatus, string> = {
  ok: "No prazo",
  atencao: "Atenção",
  atrasado: "Atrasado",
};
