import { redirect } from 'next/navigation'
import { getEventConfig, getCurrentLote } from '@/lib/event-data'
import { CheckoutClient } from '@/components/checkout/CheckoutClient'

export const dynamic = 'force-dynamic'

export default async function InscricaoPage() {
  const config = await getEventConfig()
  const lote = await getCurrentLote()

  if (!config || !config.inscricoes_abertas || !lote) {
    redirect('/')
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-2xl font-extrabold text-simp-deep">Inscrição</h1>
      <p className="mt-1 text-simp-ink/70">
        {config.nome}
      </p>
      <CheckoutClient loteNome={lote.nome} precoCentavos={lote.preco_centavos} />
    </main>
  )
}
