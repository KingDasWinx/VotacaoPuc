import { getEventConfig, getCurrentLote } from '@/lib/event-data'
import { Hero } from '@/components/event/Hero'
import { TicketBox } from '@/components/event/TicketBox'
import { SiteHeader } from '@/components/event/SiteHeader'
import { Ear, Activity, FlaskConical, CalendarDays, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

const destaques = [
  { icon: Ear, titulo: 'Audição', texto: 'Avanços em diagnóstico e reabilitação auditiva.' },
  { icon: Activity, titulo: 'Equilíbrio', texto: 'Otoneurologia aplicada à prática clínica.' },
  { icon: FlaskConical, titulo: 'Ciência', texto: 'Pesquisa de ponta e atualização baseada em evidências.' },
]

export default async function HomePage() {
  const config = await getEventConfig()
  const lote = await getCurrentLote()

  if (!config) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20 text-center text-ink/70">
        Evento não configurado.
      </main>
    )
  }

  return (
    <>
      <SiteHeader />
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

        <div className="mx-auto max-w-3xl px-5 py-12">
          <div className="-mt-20 sm:-mt-24">
            <TicketBox
              disponivel={Boolean(lote)}
              loteNome={lote?.nome ?? null}
              precoCentavos={lote?.preco_centavos ?? null}
              inscricoesAbertas={config.inscricoes_abertas}
            />
          </div>

          <section className="mt-14">
            <h2 className="text-2xl font-extrabold text-brand">Sobre o evento</h2>
            <p className="mt-3 max-w-2xl text-ink/70">
              Um encontro científico que conecta a audição, o equilíbrio e a vida. Dois dias de
              palestras e atualização em audiologia e otoneurologia em {config.local}.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {destaques.map((d, i) => (
                <div
                  key={d.titulo}
                  className="animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
                    <d.icon size={22} strokeWidth={2} />
                  </span>
                  <h3 className="mt-3 font-bold text-brand">{d.titulo}</h3>
                  <p className="mt-1 text-sm text-ink/65">{d.texto}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand to-brand-hover p-7 text-on-dark shadow-card">
            <h2 className="text-xl font-extrabold">Informações</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <p className="inline-flex items-center gap-2 text-on-dark/90">
                <CalendarDays size={18} /> {new Date(config.data_inicio).toLocaleDateString('pt-BR')} a{' '}
                {new Date(config.data_fim).toLocaleDateString('pt-BR')}
              </p>
              {config.local && (
                <p className="inline-flex items-center gap-2 text-on-dark/90">
                  <MapPin size={18} /> {config.local}
                </p>
              )}
            </div>
          </section>
        </div>

        <footer className="border-t border-line py-8 text-center text-sm text-ink/55">
          {config.nome}
        </footer>
      </main>
    </>
  )
}
