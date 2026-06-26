import { redirect } from 'next/navigation'
import { getEventConfig, getCurrentLote } from '@/lib/event-data'
import { CheckoutClient } from '@/components/checkout/CheckoutClient'
import { SiteHeader } from '@/components/event/SiteHeader'

export const dynamic = 'force-dynamic'

export default async function InscricaoPage() {
  const config = await getEventConfig()
  const lote = await getCurrentLote()

  if (!config || !config.inscricoes_abertas || !lote) {
    redirect('/')
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Inscrição</p>
          <h1 className="mt-1 text-3xl font-extrabold text-brand">Garanta seu ingresso</h1>
          <p className="mt-1 text-ink/60">{config.nome}</p>
        </div>
        <CheckoutClient loteNome={lote.nome} precoCentavos={lote.preco_centavos} />
      </main>
    </>
  )
}
