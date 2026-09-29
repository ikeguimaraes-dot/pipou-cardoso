// Tipos e constantes de currículo — arquivo neutro (sem "use server")
// Importado por actions.ts (validação) e CandidatoClient.tsx (UI)

export type Experiencia = { empresa: string; cargo: string; inicio: string; fim?: string | null; descricao?: string | null };
export type Formacao = { instituicao: string; curso: string; nivel: string; ano_conclusao?: number | null };
export type Idioma = { idioma: string; nivel: string };

export const ESCOLARIDADE_SLUGS = [
  "analfabeto", "fundamental_5_incompleto", "fundamental_5_completo",
  "fundamental_6_9", "fundamental_completo", "medio_incompleto",
  "medio_completo", "superior_incompleto", "superior_completo", "pos_graduacao",
] as const;

export const ESCOLARIDADE_LABEL: Record<string, string> = {
  analfabeto:               "Analfabeto",
  fundamental_5_incompleto: "Fundamental 1º ciclo (incompleto)",
  fundamental_5_completo:   "Fundamental 1º ciclo (completo)",
  fundamental_6_9:          "Fundamental 2º ciclo",
  fundamental_completo:     "Fundamental completo",
  medio_incompleto:         "Ensino Médio (incompleto)",
  medio_completo:           "Ensino Médio completo",
  superior_incompleto:      "Superior (incompleto)",
  superior_completo:        "Superior completo",
  pos_graduacao:            "Pós-graduação / MBA",
};

export const TURNOS = [
  { value: "manhã",          label: "Manhã" },
  { value: "tarde",          label: "Tarde" },
  { value: "noite",          label: "Noite" },
  { value: "madrugada",      label: "Madrugada" },
  { value: "fins de semana", label: "Fins de semana" },
] as const;

export const TURNO_LABEL: Record<string, string> = Object.fromEntries(TURNOS.map(t => [t.value, t.label]));

export type CurriculoPayload = {
  // Dados pessoais — extraídos do CV para pré-preencher o modal; não enviados a updateCandidatoCurriculo
  full_name?: string | null;
  phone?: string | null;
  area_interesse?: string | null;
  // Campos de currículo — persistidos via updateCandidatoCurriculo
  escolaridade_nivel?: string | null;
  pretensao_salarial?: number | null;
  disponibilidade_inicio?: string | null;
  turnos_disponiveis?: string[];
  cidade?: string | null;
  bairro?: string | null;
  experiencias?: Experiencia[];
  formacoes?: Formacao[];
  idiomas?: Idioma[];
  habilidades?: string[];
};
