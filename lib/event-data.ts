// SOMENTE SERVIDOR — importa o cliente service-role. Nunca usar em client components.
import { unstable_noStore as noStore } from 'next/cache'
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
  noStore()
  const { data } = await supabase.from('event_config').select('*').eq('id', 1).single()
  return (data as EventConfig) ?? null
}

export async function getLotes(): Promise<Lote[]> {
  noStore()
  const { data } = await supabase
    .from('lotes')
    .select('id, nome, preco_centavos, data_inicio, data_fim, ativo')
  return (data as Lote[]) ?? []
}

export async function getCurrentLote(): Promise<Lote | null> {
  return selectCurrentLote(await getLotes(), new Date())
}

export async function getProgramacao() {
  noStore()
  const { data } = await supabase
    .from('programacao')
    .select('id, dia, hora_inicio, hora_fim, titulo, palestrante, descricao, local_sala, tipo, ordem')
    .order('dia', { ascending: true })
    .order('ordem', { ascending: true })
    .order('hora_inicio', { ascending: true })
  return data ?? []
}
