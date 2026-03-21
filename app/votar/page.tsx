import { supabase } from '@/lib/supabase'
import { Config, Candidato } from '@/types'
import TopBar from '@/components/layout/TopBar'
import Header from '@/components/layout/Header'
import VotingClient from '@/components/votar/VotingClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function VotarPage() {
  const { data: config } = await supabase
    .from('config')
    .select('votacao_inicio, votacao_fim')
    .eq('id', 1)
    .single<Config>()

  const { data: candidatos } = await supabase
    .from('candidatos')
    .select('id, nome, frase, foto_url, created_at')
    .order('created_at', { ascending: true })

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Configuração de votação não encontrada.
      </div>
    )
  }

  return (
    <>
      <TopBar />
      <Header />
      <VotingClient config={config} candidatos={(candidatos as Candidato[]) ?? []} />
    </>
  )
}
