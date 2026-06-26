import Link from 'next/link'
import { LayoutDashboard, Tags, Settings, FileDown, LogOut } from 'lucide-react'

type Active = 'dashboard' | 'lotes' | 'config'

export function AdminHeader({ active }: { active?: Active }) {
  const navClass = (key: Active) =>
    `inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
      active === key ? 'bg-brand text-on-dark' : 'text-brand hover:bg-surface'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-black text-on-dark shadow-card">
            A
          </span>
          <span className="text-sm font-extrabold leading-tight text-brand">
            Painel
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-accent-hover">
              Administrativo
            </span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1.5">
          <Link href="/admin" className={navClass('dashboard')}>
            <LayoutDashboard size={15} /> Dashboard
          </Link>
          <Link href="/admin/lotes" className={navClass('lotes')}>
            <Tags size={15} /> Lotes
          </Link>
          <Link href="/admin/configuracoes" className={navClass('config')}>
            <Settings size={15} /> Configurações
          </Link>
          <a
            href="/api/admin/export?tipo=participantes"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-brand transition hover:bg-surface"
          >
            <FileDown size={15} /> Credenciamento
          </a>
          <a
            href="/api/admin/export?tipo=pagamentos"
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-brand transition hover:bg-surface"
          >
            <FileDown size={15} /> Pagamentos
          </a>
          <form action="/api/admin/logout" method="post">
            <button className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-on-dark transition hover:bg-brand-hover">
              <LogOut size={15} /> Sair
            </button>
          </form>
        </nav>
      </div>
    </header>
  )
}
