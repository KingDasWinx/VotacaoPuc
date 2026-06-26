import { MeusIngressosClient } from '@/components/ingressos/MeusIngressosClient'

export const metadata = { title: 'Meus ingressos' }

export default function MeusIngressosPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-2xl font-extrabold text-simp-deep">Meus ingressos</h1>
      <p className="mt-1 text-simp-ink/70">Digite seu CPF para ver suas inscrições.</p>
      <MeusIngressosClient />
    </main>
  )
}
