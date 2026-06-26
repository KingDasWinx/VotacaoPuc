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
