import { SiteHeader } from '@/components/event/SiteHeader'
import { RegulamentoView } from '@/components/regulamento/RegulamentoView'

export const metadata = { title: 'Regulamento' }

export default function RegulamentoPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <RegulamentoView />
      </main>
    </>
  )
}
