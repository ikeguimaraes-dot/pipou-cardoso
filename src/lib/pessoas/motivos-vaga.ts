/** Matches job_openings_motivo_estruturado_check. Legacy values are display-only. */
export const MOTIVOS_VAGA = [
  "abertura_casa",
  "aumento_quadro",
  "adequacao_quadro",
  "substituicao_desligamento",
  "substituicao_promocao",
  "substituicao_licenca",
] as const;

export type MotivoEstruturado = typeof MOTIVOS_VAGA[number];
export type MotivoLegado = "substituicao_licenca_maternidade" | "substituicao_transferencia" | "reposicao_temporaria" | "novo_cargo" | "retorno_licenca";

export const MOTIVO_VAGA_LABEL: Record<MotivoEstruturado | MotivoLegado, string> = {
  abertura_casa: "Abertura de casa",
  aumento_quadro: "Aumento de quadro",
  adequacao_quadro: "Adequação de quadro",
  substituicao_desligamento: "Substituição — desligamento",
  substituicao_promocao: "Substituição — promoção",
  substituicao_licenca: "Substituição — licença",
  substituicao_licenca_maternidade: "Substituição — licença maternidade",
  substituicao_transferencia: "Substituição — transferência",
  reposicao_temporaria: "Reposição temporária",
  novo_cargo: "Novo cargo",
  retorno_licenca: "Retorno de licença",
};

export function normalizeMotivoVaga(value: unknown): string | null {
  return typeof value === "string" ? value.trim() || null : null;
}

export function isMotivoVaga(value: unknown): value is MotivoEstruturado {
  return MOTIVOS_VAGA.some(motivo => motivo === value);
}
