import { getEventConfig, getCurrentLote } from '@/lib/event-data'
import { Hero } from '@/components/event/Hero'
import { TicketBox } from '@/components/event/TicketBox'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const config = await getEventConfig()
  const lote = await getCurrentLote()

  if (!config) {
    return <main className="mx-auto max-w-3xl px-5 py-20 text-center">Evento não configurado.</main>
  }

  return (
    <main>
      <Hero
        nome={config.nome}
        subtitulo={config.subtitulo}
        dataInicio={config.data_inicio}
        dataFim={config.data_fim}
        local={config.local}
        tags={config.tags}
        bannerUrl={config.banner_url}
      />
      <div className="mx-auto max-w-3xl px-5 py-10">
        <TicketBox
          disponivel={Boolean(lote)}
          loteNome={lote?.nome ?? null}
          precoCentavos={lote?.preco_centavos ?? null}
          inscricoesAbertas={config.inscricoes_abertas}
        />
        <section className="mt-10">
          <h2 className="text-xl font-bold text-simp-deep">Sobre o evento</h2>
          <p className="mt-3 text-simp-ink/80">
            Um encontro científico que conecta a audição, o equilíbrio e a vida. Dois dias de
            palestras e atualização em audiologia e otoneurologia em {config.local}.
          </p>
        </section>
      </div>
      <footer className="border-t border-simp-mist py-8 text-center text-sm text-simp-ink/60">
        {config.nome}
      </footer>
    </main>
  )
}
