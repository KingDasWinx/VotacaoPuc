// SOMENTE SERVIDOR — importa o cliente service-role. Nunca usar em client components.
import { supabase } from '@/lib/supabase'
import { selectCurrentLote } from '@/lib/lotes'
import type { Lote } from '@/lib/types'

export interface EventConfig {
  id: number
  nome: string
  subtitulo: string | null
  data_inicio: string
  data_fim: string
  local: string | null
  tags: string | null
  banner_url: string | null
  pix_chave: string
  pix_nome_recebedor: string
  pix_cidade: string
  whatsapp_numero: string | null
  capacidade: number
  inscricoes_abertas: boolean
}

export async function getEventConfig(): Promise<EventConfig | null> {
  const { data } = await supabase.from('event_config').select('*').eq('id', 1).single()
  return (data as EventConfig) ?? null
}

export async function getLotes(): Promise<Lote[]> {
  const { data } = await supabase
    .from('lotes')
    .select('id, nome, preco_centavos, data_inicio, data_fim, ativo')
  return (data as Lote[]) ?? []
}

export async function getCurrentLote(): Promise<Lote | null> {
  return selectCurrentLote(await getLotes(), new Date())
}
