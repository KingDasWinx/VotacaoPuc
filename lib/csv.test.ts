import { describe, it, expect } from 'vitest'
import { toCsv } from '@/lib/csv'

describe('toCsv', () => {
  it('monta linhas separadas por CRLF com BOM', () => {
    const csv = toCsv([['a', 'b'], ['1', '2']])
    expect(csv).toBe('\uFEFFa,b\r\n1,2')
  })
  it('escapa campos com vírgula, aspas e quebra de linha', () => {
    const csv = toCsv([['x,y', 'a"b', 'lin\nha']])
    expect(csv).toBe('\uFEFF"x,y","a""b","lin\nha"')
  })
  it('converte números em texto', () => {
    const csv = toCsv([['nome', 42]])
    expect(csv).toBe('\uFEFFnome,42')
  })
})
