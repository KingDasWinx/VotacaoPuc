import type { Lote } from '@/lib/types'

/**
 * Dentre os lotes ativos cujo período [data_inicio, data_fim] cobre `now`,
 * retorna o de menor data_inicio. Retorna null se nenhum estiver vigente.
 */
export function selectCurrentLote(lotes: Lote[], now: Date): Lote | null {
  const t = now.getTime()
  const vigentes = lotes.filter((l) => {
    if (!l.ativo) return false
    const ini = new Date(l.data_inicio).getTime()
    const fim = new Date(l.data_fim).getTime()
    return t >= ini && t <= fim
  })
  if (vigentes.length === 0) return null
  vigentes.sort(
    (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
  )
  return vigentes[0]
}
