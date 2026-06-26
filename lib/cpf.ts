/** Remove tudo que não é dígito. */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/** Valida CPF: 11 dígitos, não-sequência repetida, dígitos verificadores corretos. */
export function isValidCpf(cpf: string): boolean {
  const digits = normalizeCpf(cpf)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const calcCheck = (slice: string, factorStart: number): number => {
    let sum = 0
    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice[i], 10) * (factorStart - i)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  const d1 = calcCheck(digits.slice(0, 9), 10)
  if (d1 !== parseInt(digits[9], 10)) return false
  const d2 = calcCheck(digits.slice(0, 10), 11)
  if (d2 !== parseInt(digits[10], 10)) return false
  return true
}

/** Aplica a máscara 000.000.000-00. */
export function formatCpf(cpf: string): string {
  const d = normalizeCpf(cpf)
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
