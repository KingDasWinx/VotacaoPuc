import { MeusIngressosClient } from '@/components/ingressos/MeusIngressosClient'
import { SiteHeader } from '@/components/event/SiteHeader'

export const metadata = { title: 'Meus ingressos' }

export default function MeusIngressosPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Consulta</p>
          <h1 className="mt-1 text-3xl font-extrabold text-brand">Meus ingressos</h1>
          <p className="mt-1 text-ink/60">Digite seu CPF para ver suas inscrições.</p>
        </div>
        <MeusIngressosClient />
      </main>
    </>
  )
}
