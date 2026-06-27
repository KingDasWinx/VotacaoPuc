import { describe, it, expect } from 'vitest'
import { buildXlsx, buildPdf } from '@/lib/export-format'

const rows: (string | number)[][] = [
  ['Nome', 'CPF', 'Valor'],
  ['Ana Souza', '529.982.247-25', 'R$ 150,00'],
  ['João Lima', '111.444.777-35', 'R$ 300,00'],
]

describe('buildXlsx', () => {
  it('gera um arquivo .xlsx válido (zip começa com PK)', async () => {
    const buf = await buildXlsx('Teste', rows)
    expect(buf.length).toBeGreaterThan(0)
    expect(buf.subarray(0, 2).toString('latin1')).toBe('PK')
  })
})

describe('buildPdf', () => {
  it('gera um PDF válido (começa com %PDF)', () => {
    const buf = buildPdf('Relatório', rows)
    expect(buf.length).toBeGreaterThan(0)
    expect(buf.subarray(0, 4).toString('latin1')).toBe('%PDF')
  })
})
