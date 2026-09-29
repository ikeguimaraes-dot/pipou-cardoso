export const TERMINATION_REASONS = [
  { value: "pedido_demissao", label: "Pedido de demissão", initiative: "Colaborador" },
  { value: "sem_justa_causa", label: "Demissão sem justa causa – iniciativa da empresa", initiative: "Empresa" },
  { value: "justa_causa", label: "Demissão por justa causa", initiative: "Empresa" },
  { value: "termino_experiencia", label: "Término de contrato de experiência", initiative: "Empresa" },
] as const;

export type TerminationReason = typeof TERMINATION_REASONS[number]["value"];

export function terminationReason(value: string) {
  return TERMINATION_REASONS.find(reason => reason.value === value) ?? null;
}
