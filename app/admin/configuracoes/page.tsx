import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getEventConfig } from '@/lib/event-data'
import { ConfigForm } from '@/components/admin/ConfigForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ConfigPage() {
  if (!isCookieAdmin()) redirect('/admin/login')
  const config = await getEventConfig()
  if (!config) return <main className="p-8">Configuração não encontrada.</main>
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/admin" className="text-sm font-semibold text-simp-teal">← Voltar ao dashboard</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-simp-deep">Configurações do evento</h1>
      <ConfigForm config={config} />
    </main>
  )
}
