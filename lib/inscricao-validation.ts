import { isValidCpf, normalizeCpf } from '@/lib/cpf'
import { isCategoriaInscricao, type ParticipanteInput } from '@/lib/types'

const MAX_PARTICIPANTES = 10

type Result =
  | { ok: true; participantes: ParticipanteInput[] }
  | { ok: false; error: string }

function isValidDateNascimento(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(value + 'T00:00:00Z')
  if (Number.isNaN(d.getTime())) return false
  const year = d.getUTCFullYear()
  if (year < 1900) return false
  if (d.getTime() > Date.now()) return false
  return true
}

export function validateInscricao(body: unknown): Result {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Corpo inválido' }
  }
  const obj = body as Record<string, unknown>
  if (obj.aceitou_regulamento !== true) {
    return { ok: false, error: 'É necessário aceitar o regulamento do evento' }
  }
  const raw = obj.participantes
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: 'Informe ao menos um participante' }
  }
  if (raw.length > MAX_PARTICIPANTES) {
    return { ok: false, error: `Máximo de ${MAX_PARTICIPANTES} ingressos por pedido` }
  }

  const participantes: ParticipanteInput[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      return { ok: false, error: 'Participante inválido' }
    }
    const p = item as Record<string, unknown>
    const nome = typeof p.nome === 'string' ? p.nome.trim() : ''
    const cpf = typeof p.cpf === 'string' ? normalizeCpf(p.cpf) : ''
    const dataNasc = typeof p.data_nascimento === 'string' ? p.data_nascimento : ''
    const telefone = typeof p.telefone === 'string' ? p.telefone.replace(/\D/g, '') : ''
    const categoria = p.categoria

    if (nome.length < 2) return { ok: false, error: `Nome inválido para "${nome}"` }
    if (!isValidCpf(cpf)) return { ok: false, error: `CPF inválido: ${p.cpf}` }
    if (!isValidDateNascimento(dataNasc)) {
      return { ok: false, error: `Data de nascimento inválida para ${nome}` }
    }
    if (telefone.length < 10 || telefone.length > 13) {
      return { ok: false, error: `Telefone inválido para ${nome}` }
    }
    if (!isCategoriaInscricao(categoria)) {
      return { ok: false, error: `Categoria inválida para ${nome}` }
    }
    participantes.push({ nome, cpf, data_nascimento: dataNasc, telefone, categoria })
  }
  return { ok: true, participantes }
}
