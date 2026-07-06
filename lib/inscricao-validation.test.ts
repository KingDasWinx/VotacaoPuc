import { describe, it, expect } from 'vitest'
import { validateInscricao } from '@/lib/inscricao-validation'

const ok = {
  aceitou_regulamento: true,
  participantes: [
    { nome: 'Ana Souza', cpf: '529.982.247-25', data_nascimento: '1990-05-10', telefone: '(45) 99999-9999' },
  ],
}

describe('validateInscricao', () => {
  it('aceita um participante válido e normaliza cpf/telefone', () => {
    const r = validateInscricao(ok)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.participantes[0].cpf).toBe('52998224725')
      expect(r.participantes[0].telefone).toBe('45999999999')
    }
  })
  it('rejeita sem aceite do regulamento', () => {
    const { aceitou_regulamento: _, ...semAceite } = ok
    expect(validateInscricao(semAceite).ok).toBe(false)
    expect(validateInscricao({ ...ok, aceitou_regulamento: false }).ok).toBe(false)
  })
  it('rejeita corpo sem participantes', () => {
    expect(validateInscricao({}).ok).toBe(false)
    expect(validateInscricao({ participantes: [] }).ok).toBe(false)
  })
  it('rejeita mais de 10 participantes', () => {
    const many = { participantes: Array.from({ length: 11 }, () => ok.participantes[0]) }
    expect(validateInscricao(many).ok).toBe(false)
  })
  it('rejeita nome curto', () => {
    const r = validateInscricao({ participantes: [{ ...ok.participantes[0], nome: 'A' }] })
    expect(r.ok).toBe(false)
  })
  it('rejeita CPF inválido', () => {
    const r = validateInscricao({ participantes: [{ ...ok.participantes[0], cpf: '12345678900' }] })
    expect(r.ok).toBe(false)
  })
  it('rejeita data de nascimento no futuro ou malformada', () => {
    expect(validateInscricao({ participantes: [{ ...ok.participantes[0], data_nascimento: '2999-01-01' }] }).ok).toBe(false)
    expect(validateInscricao({ participantes: [{ ...ok.participantes[0], data_nascimento: 'xx' }] }).ok).toBe(false)
  })
  it('rejeita telefone curto', () => {
    const r = validateInscricao({ participantes: [{ ...ok.participantes[0], telefone: '123' }] })
    expect(r.ok).toBe(false)
  })
})
