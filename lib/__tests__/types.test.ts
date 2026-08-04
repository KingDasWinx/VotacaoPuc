import { describe, it, expect } from 'vitest'
import type { Lote, ParticipanteInput } from '@/lib/types'
import { CATEGORIAS_PARTICIPANTE, PEDIDO_STATUS, INGRESSO_STATUS, isCategoriaInscricao } from '@/lib/types'

describe('types', () => {
  it('expõe os status de pedido', () => {
    expect(PEDIDO_STATUS).toEqual(['pendente', 'pago', 'cancelado'])
  })
  it('expõe os status de ingresso', () => {
    expect(INGRESSO_STATUS).toEqual(['valido', 'cancelado'])
  })
  it('expõe e valida as categorias de participante', () => {
    expect(CATEGORIAS_PARTICIPANTE).toEqual(['pendente', 'estudante', 'profissional'])
    expect(isCategoriaInscricao('estudante')).toBe(true)
    expect(isCategoriaInscricao('profissional')).toBe(true)
    expect(isCategoriaInscricao('pendente')).toBe(false)
  })
  it('aceita um Lote bem formado', () => {
    const lote: Lote = {
      id: 'x', nome: 'Lote 1', preco_centavos: 15000,
      data_inicio: '2026-01-01T00:00:00Z', data_fim: '2026-02-01T00:00:00Z', ativo: true,
    }
    expect(lote.preco_centavos).toBe(15000)
  })
  it('aceita um ParticipanteInput bem formado', () => {
    const p: ParticipanteInput = {
      nome: 'Ana', cpf: '12345678909', data_nascimento: '1990-01-01', telefone: '45999999999',
      categoria: 'estudante',
    }
    expect(p.cpf).toHaveLength(11)
  })
})
