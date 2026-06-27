import { redirect } from 'next/navigation'
import { isCookieAdmin } from '@/lib/admin-guard'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { CheckinClient } from '@/components/admin/CheckinClient'

export const dynamic = 'force-dynamic'

export default function CheckinPage() {
  if (!isCookieAdmin()) redirect('/admin/login')

  return (
    <>
      <AdminHeader active="checkin" />
      <main className="mx-auto max-w-md px-5 py-8">
        <div className="animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Entrada</p>
          <h1 className="mt-1 text-2xl font-extrabold text-brand">Validar ingressos</h1>
          <p className="mt-1 text-sm text-ink/60">
            Escaneie o QR Code de cada participante para confirmar a entrada.
          </p>
        </div>
        <CheckinClient />
      </main>
    </>
  )
}
