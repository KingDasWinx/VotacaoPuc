import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { getLotes } from '@/lib/event-data'
import { LotesManager } from '@/components/admin/LotesManager'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LotesPage() {
  if (!isCookieAdmin()) redirect('/admin/login')
  const lotes = await getLotes()
  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <Link href="/admin" className="text-sm font-semibold text-simp-teal">← Voltar ao dashboard</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-simp-deep">Lotes</h1>
      <LotesManager lotesIniciais={lotes} />
    </main>
  )
}
