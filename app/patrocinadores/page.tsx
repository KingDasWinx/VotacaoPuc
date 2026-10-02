import { SiteHeader } from '@/components/event/SiteHeader'
import { Patrocinadores } from '@/components/event/Patrocinadores'
import { Handshake } from 'lucide-react'

export const metadata = { title: 'Patrocinadores' }

export default function PatrocinadoresPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Apoio</p>
          <h1 className="mt-1 flex items-center gap-2.5 text-3xl font-extrabold text-brand">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
              <Handshake size={20} />
            </span>
            Patrocinadores
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Empresas que tornam o simpósio possível. Obrigado pelo apoio!
          </p>
        </div>
        <div className="animate-fade-up mt-8" style={{ animationDelay: '80ms' }}>
          <Patrocinadores />
        </div>
      </main>
    </>
  )
}
