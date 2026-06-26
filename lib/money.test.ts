import { describe, it, expect } from 'vitest'
import { formatBRL, formatPixAmount } from '@/lib/money'

describe('formatBRL', () => {
  it('formata centavos em reais com vírgula', () => {
    expect(formatBRL(15000)).toBe('R$ 150,00')
    expect(formatBRL(12990)).toBe('R$ 129,90')
    expect(formatBRL(0)).toBe('R$ 0,00')
    expect(formatBRL(5)).toBe('R$ 0,05')
  })
  it('agrupa milhar', () => {
    expect(formatBRL(123456)).toBe('R$ 1.234,56')
  })
})

describe('formatPixAmount', () => {
  it('formata em reais com ponto e 2 casas, sem separador de milhar', () => {
    expect(formatPixAmount(15000)).toBe('150.00')
    expect(formatPixAmount(12990)).toBe('129.90')
    expect(formatPixAmount(123456)).toBe('1234.56')
  })
})
