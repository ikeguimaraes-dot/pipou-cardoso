// Tipo discriminated union para resultados de Server Actions.
// Mora aqui (e não no actions.ts com "use server") porque arquivos de
// Server Action no Next.js só devem exportar funções async — qualquer
// type/const exportado pode dar warning ou erro em alguns paths.

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Sprint Escala · Melhoria 5 — resultado das mutations de turno.
// Carrega `conflict` (bloqueio: já existe turno no dia → toast vermelho) e
// `warning` (não bloqueia: dia é folga/feriado → toast amarelo).
import type { Shift } from "@kph/db/types/pessoas";

export type ShiftMutationResult =
  | { ok: true; data: Shift; warning?: string }
  | { ok: false; error: string; conflict?: boolean };
