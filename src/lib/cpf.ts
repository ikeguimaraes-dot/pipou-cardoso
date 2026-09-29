/** Remove tudo que não é dígito e preenche com zeros à esquerda até 11 chars */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '').padStart(11, '0')
}

/** Formata como XXX.XXX.XXX-XX */
export function formatCpfDisplay(cpf: string): string {
  const n = normalizeCpf(cpf)
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`
}

/**
 * Valida formato + dígito verificador (algoritmo CPF padrão, módulo 11).
 * Rejeita: comprimento != 11, todos dígitos iguais, dígito verificador errado.
 */
export function validateCpf(raw: string): { valid: boolean; message?: string } {
  const n = normalizeCpf(raw)
  if (n.length !== 11) return { valid: false, message: 'CPF deve ter 11 dígitos' }
  if (/^(\d)\1{10}$/.test(n)) return { valid: false, message: 'CPF inválido' }

  const digit = (slice: string, weights: number[]): number => {
    const sum = slice.split('').reduce((acc, d, i) => acc + parseInt(d) * (weights[i] ?? 0), 0)
    const rem = sum % 11
    return rem < 2 ? 0 : 11 - rem
  }

  const d1 = digit(n.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2])
  if (d1 !== parseInt(n[9] ?? '')) return { valid: false, message: 'CPF inválido (dígito verificador)' }

  const d2 = digit(n.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  if (d2 !== parseInt(n[10] ?? '')) return { valid: false, message: 'CPF inválido (dígito verificador)' }

  return { valid: true }
}
