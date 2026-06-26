import { describe, it, expect } from 'vitest'
import { selectCurrentLote } from '@/lib/lotes'
import type { Lote } from '@/lib/types'

const mk = (over: Partial<Lote>): Lote => ({
  id: Math.random().toString(36).slice(2),
  nome: 'Lote',
  preco_centavos: 10000,
  data_inicio: '2026-01-01T00:00:00Z',
  data_fim: '2026-12-31T23:59:59Z',
  ativo: true,
  ...over,
})

describe('selectCurrentLote', () => {
  const now = new Date('2026-08-01T12:00:00Z')

  it('retorna null quando não há lotes', () => {
    expect(selectCurrentLote([], now)).toBeNull()
  })

  it('retorna o lote cujo período cobre agora', () => {
    const lote = mk({ nome: 'Lote 2', data_inicio: '2026-07-01T00:00:00Z', data_fim: '2026-09-01T00:00:00Z' })
    expect(selectCurrentLote([lote], now)?.nome).toBe('Lote 2')
  })

  it('ignora lotes inativos', () => {
    const lote = mk({ nome: 'Inativo', ativo: false })
    expect(selectCurrentLote([lote], now)).toBeNull()
  })

  it('ignora lotes fora do período', () => {
    const passado = mk({ nome: 'Passado', data_inicio: '2026-01-01T00:00:00Z', data_fim: '2026-02-01T00:00:00Z' })
    const futuro = mk({ nome: 'Futuro', data_inicio: '2026-10-01T00:00:00Z', data_fim: '2026-11-01T00:00:00Z' })
    expect(selectCurrentLote([passado, futuro], now)).toBeNull()
  })

  it('com vários vigentes, escolhe o de menor data_inicio', () => {
    const a = mk({ nome: 'Cedo', data_inicio: '2026-07-01T00:00:00Z', data_fim: '2026-09-01T00:00:00Z' })
    const b = mk({ nome: 'Tarde', data_inicio: '2026-07-20T00:00:00Z', data_fim: '2026-09-01T00:00:00Z' })
    expect(selectCurrentLote([b, a], now)?.nome).toBe('Cedo')
  })
})
