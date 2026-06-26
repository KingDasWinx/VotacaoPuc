import { describe, it, expect } from 'vitest'
import { crc16, buildPixPayload } from '@/lib/pix'

describe('crc16 (CCITT-FALSE)', () => {
  it('bate com o vetor canônico', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
  it('sempre retorna 4 hex maiúsculos', () => {
    expect(crc16('abc')).toMatch(/^[0-9A-F]{4}$/)
  })
})

describe('buildPixPayload', () => {
  const base = {
    chave: 'recebedor@email.com',
    nome: 'SIMPOSIO AUDIOLOGIA',
    cidade: 'CASCAVEL',
    valorCentavos: 15000,
    txid: 'SIM-7K2Q',
  }

  it('começa com o payload format indicator e contém a GUI do Pix', () => {
    const p = buildPixPayload(base)
    expect(p.startsWith('000201')).toBe(true)
    expect(p).toContain('BR.GOV.BCB.PIX')
    expect(p).toContain('recebedor@email.com')
  })

  it('embute o valor formatado em 5303986 + 54', () => {
    const p = buildPixPayload(base)
    expect(p).toContain('5303986')
    expect(p).toContain('5406150.00')
  })

  it('contém país, nome e cidade', () => {
    const p = buildPixPayload(base)
    expect(p).toContain('5802BR')
    expect(p).toContain('5919SIMPOSIO AUDIOLOGIA') // 19 chars
    expect(p).toContain('6008CASCAVEL') // 08 chars
  })

  it('sanitiza o txid para alfanumérico no campo 62/05', () => {
    const p = buildPixPayload(base)
    expect(p).toContain('62110507SIM7K2Q') // 62 len11 -> 05 len07 "SIM7K2Q"
  })

  it('termina com um CRC válido (round-trip)', () => {
    const p = buildPixPayload(base)
    const semCrc = p.slice(0, -4)
    const crcDado = p.slice(-4)
    expect(semCrc.endsWith('6304')).toBe(true)
    expect(crc16(semCrc)).toBe(crcDado)
  })

  it('trunca nome (≤25) e cidade (≤15)', () => {
    const p = buildPixPayload({
      ...base,
      nome: 'NOME MUITO LONGO QUE PASSA DE VINTE E CINCO',
      cidade: 'CIDADE COM NOME ENORME DEMAIS',
    })
    expect(crc16(p.slice(0, -4))).toBe(p.slice(-4))
  })
})
