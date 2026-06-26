import { LoginClient } from '@/components/admin/LoginClient'

export const metadata = { title: 'Admin — Login' }

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5">
      <h1 className="text-2xl font-extrabold text-simp-deep">Painel administrativo</h1>
      <p className="mt-1 text-simp-ink/70">Acesso restrito.</p>
      <LoginClient />
    </main>
  )
}
