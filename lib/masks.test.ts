import { describe, it, expect } from 'vitest'
import { maskCpf, maskTelefone } from '@/lib/masks'

describe('maskCpf', () => {
  it('formata CPF completo', () => {
    expect(maskCpf('52998224725')).toBe('529.982.247-25')
  })
  it('formata parcialmente enquanto digita', () => {
    expect(maskCpf('529')).toBe('529')
    expect(maskCpf('5299')).toBe('529.9')
    expect(maskCpf('529982')).toBe('529.982')
    expect(maskCpf('529982247')).toBe('529.982.247')
  })
  it('ignora não-dígitos e limita a 11', () => {
    expect(maskCpf('529.982.247-25extra')).toBe('529.982.247-25')
  })
})

describe('maskTelefone', () => {
  it('formata celular de 11 dígitos com DDI', () => {
    expect(maskTelefone('45991348030')).toBe('+55 45 9 9134-8030')
  })
  it('aceita número que já vem com 55', () => {
    expect(maskTelefone('5545991348030')).toBe('+55 45 9 9134-8030')
  })
  it('formata fixo de 10 dígitos', () => {
    expect(maskTelefone('4533334040')).toBe('+55 45 3333-4040')
  })
  it('formata parcialmente', () => {
    expect(maskTelefone('45')).toBe('+55 45')
    expect(maskTelefone('4599')).toBe('+55 45 99')
  })
  it('string vazia retorna vazio', () => {
    expect(maskTelefone('')).toBe('')
  })
})
