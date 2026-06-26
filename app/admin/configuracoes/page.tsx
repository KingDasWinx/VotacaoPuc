import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getEventConfig } from '@/lib/event-data'
import { ConfigForm } from '@/components/admin/ConfigForm'
import { AdminHeader } from '@/components/admin/AdminHeader'

export const dynamic = 'force-dynamic'

export default async function ConfigPage() {
  if (!isCookieAdmin()) redirect('/admin/login')
  const config = await getEventConfig()
  if (!config)
    return (
      <>
        <AdminHeader active="config" />
        <main className="mx-auto max-w-2xl px-5 py-8 text-ink/60">Configuração não encontrada.</main>
      </>
    )
  return (
    <>
      <AdminHeader active="config" />
      <main className="mx-auto max-w-2xl px-5 py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-extrabold text-brand">Configurações do evento</h1>
          <p className="mt-1 text-sm text-ink/60">Dados do evento, PIX e capacidade.</p>
        </div>
        <ConfigForm config={config} />
      </main>
    </>
  )
}
