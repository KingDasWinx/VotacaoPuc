import { LoginClient } from '@/components/admin/LoginClient'
import { ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Admin — Login' }

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-brand to-brand-hover px-5">
      <div className="animate-scale-in w-full max-w-sm rounded-3xl border border-line bg-white p-8 shadow-card-hover">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
          <ShieldCheck size={28} />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-brand">Painel administrativo</h1>
        <p className="mt-1 text-center text-ink/60">Acesso restrito.</p>
        <LoginClient />
      </div>
    </main>
  )
}
