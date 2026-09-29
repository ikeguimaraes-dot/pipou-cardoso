/**
 * Normaliza telefone para o padrão BR adotado: DDD + número, sem DDI (11 dígitos).
 * - Remove tudo que não é dígito.
 * - Remove o DDI 55 quando o número vem com 13 dígitos (celular) ou 12 (fixo/sem 9º).
 *
 * Ex.: "+55 (11) 97845-1841" → "11978451841"
 *      "5511978451841"        → "11978451841"
 *      "11978451841"          → "11978451841"
 */
export function normalizarTelefone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) return digits.slice(2);
  if (digits.length === 12 && digits.startsWith("55")) return digits.slice(2);
  return digits;
}

// DDDs em operação no Brasil (ANATEL).
const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/**
 * Verifica se um telefone canônico BR (saída de normalizarTelefone) é
 * WhatsApp-plausível: 11 dígitos, DDD válido ANATEL, começa com 9 após o DDD.
 * Números fixos (8 dígitos após DDD) e DDDs inválidos retornam false.
 */
export function isNumeroWhatsAppValido(canonical: string): boolean {
  if (canonical.length !== 11) return false;
  const ddd = parseInt(canonical.slice(0, 2), 10);
  if (!DDDS_VALIDOS.has(ddd)) return false;
  if (canonical[2] !== "9") return false;
  return true;
}

/**
 * Converte telefone canônico BR (saída de normalizarTelefone) para E.164.
 * Usado APENAS na borda de saída para Twilio — o banco continua em 11 dígitos.
 *
 * Ex.: "11994270706" → "+5511994270706"
 */
export function toE164Br(canonical: string): string {
  return `+55${canonical.replace(/\D/g, "")}`;
}
