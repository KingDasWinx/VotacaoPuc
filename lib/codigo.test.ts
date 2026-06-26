import { describe, it, expect } from 'vitest'
import { generateCodigo, CODIGO_ALPHABET } from '@/lib/codigo'

describe('generateCodigo', () => {
  it('tem o formato SIM-XXXX', () => {
    expect(generateCodigo()).toMatch(/^SIM-[A-Z0-9]{4}$/)
  })
  it('usa apenas o alfabeto sem caracteres ambíguos', () => {
    const re = new RegExp(`^SIM-[${CODIGO_ALPHABET}]{4}$`)
    for (let i = 0; i < 200; i++) {
      expect(generateCodigo()).toMatch(re)
    }
  })
  it('não usa 0, O, 1, I', () => {
    expect(CODIGO_ALPHABET).not.toMatch(/[01OI]/)
  })
  it('gera valores variados (não é constante)', () => {
    const set = new Set(Array.from({ length: 50 }, () => generateCodigo()))
    expect(set.size).toBeGreaterThan(1)
  })
})
