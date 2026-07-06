export const PEDIDO_STATUS = ['pendente', 'pago', 'cancelado'] as const
export type PedidoStatus = (typeof PEDIDO_STATUS)[number]

export const INGRESSO_STATUS = ['valido', 'cancelado'] as const
export type IngressoStatus = (typeof INGRESSO_STATUS)[number]

export const METODO_COMPROVANTE = ['upload', 'whatsapp', 'nenhum'] as const
export type MetodoComprovante = (typeof METODO_COMPROVANTE)[number]

export interface Lote {
  id: string
  nome: string
  preco_centavos: number
  data_inicio: string // ISO 8601
  data_fim: string // ISO 8601
  ativo: boolean
}

export interface ParticipanteInput {
  nome: string
  cpf: string // 11 dígitos
  data_nascimento: string // YYYY-MM-DD
  telefone: string
}

export const PROGRAMACAO_TIPOS = [
  'palestra',
  'mesa_redonda',
  'coffee_break',
  'abertura',
  'encerramento',
  'outro',
] as const
export type ProgramacaoTipo = (typeof PROGRAMACAO_TIPOS)[number]

export interface ProgramacaoItem {
  id: string
  dia: string // YYYY-MM-DD
  hora_inicio: string // HH:MM
  hora_fim: string | null
  titulo: string
  palestrante: string | null
  descricao: string | null
  local_sala: string | null
  tipo: ProgramacaoTipo
  ordem: number
}
