import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getLotes } from '@/lib/event-data'
import { LotesManager } from '@/components/admin/LotesManager'
import { AdminHeader } from '@/components/admin/AdminHeader'

export const dynamic = 'force-dynamic'

export default async function LotesPage() {
  if (!isCookieAdmin()) redirect('/admin/login')
  const lotes = await getLotes()
  return (
    <>
      <AdminHeader active="lotes" />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-extrabold text-brand">Lotes</h1>
          <p className="mt-1 text-sm text-ink/60">Gerencie os lotes e preços de venda.</p>
        </div>
        <LotesManager lotesIniciais={lotes} />
      </main>
    </>
  )
}
