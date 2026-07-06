import { SiteHeader } from '@/components/event/SiteHeader'
import { ProgramacaoTimeline } from '@/components/programacao/ProgramacaoTimeline'
import { getProgramacao } from '@/lib/event-data'
import { CalendarDays } from 'lucide-react'
import type { ProgramacaoItem } from '@/lib/types'

export const metadata = { title: 'Programação' }
export const dynamic = 'force-dynamic'

export default async function ProgramacaoPage() {
  const itens = (await getProgramacao()) as ProgramacaoItem[]

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Evento</p>
          <h1 className="mt-1 flex items-center gap-2.5 text-3xl font-extrabold text-brand">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
              <CalendarDays size={20} />
            </span>
            Programação
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Confira a programação científica do simpósio. Sujeita a alterações pela organização.
          </p>
        </div>
        <div className="animate-fade-up mt-8" style={{ animationDelay: '80ms' }}>
          <ProgramacaoTimeline itens={itens} />
        </div>
      </main>
    </>
  )
}
