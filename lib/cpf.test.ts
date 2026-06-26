import { describe, it, expect } from 'vitest'
import { normalizeCpf, isValidCpf, formatCpf } from '@/lib/cpf'

describe('normalizeCpf', () => {
  it('remove tudo que não é dígito', () => {
    expect(normalizeCpf('123.456.789-09')).toBe('12345678909')
    expect(normalizeCpf(' 111 222 333 44 ')).toBe('11122233344')
  })
})

describe('isValidCpf', () => {
  it('aceita CPFs válidos', () => {
    expect(isValidCpf('123.456.789-09')).toBe(true)
    expect(isValidCpf('52998224725')).toBe(true)
  })
  it('rejeita comprimento errado', () => {
    expect(isValidCpf('123')).toBe(false)
    expect(isValidCpf('123456789012')).toBe(false)
  })
  it('rejeita dígitos verificadores errados', () => {
    expect(isValidCpf('12345678900')).toBe(false)
  })
  it('rejeita sequências repetidas', () => {
    expect(isValidCpf('00000000000')).toBe(false)
    expect(isValidCpf('11111111111')).toBe(false)
  })
})

describe('formatCpf', () => {
  it('aplica a máscara', () => {
    expect(formatCpf('12345678909')).toBe('123.456.789-09')
  })
})
