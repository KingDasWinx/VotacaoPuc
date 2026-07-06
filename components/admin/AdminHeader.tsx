'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Tags, Settings, LogOut, Menu, X, ScanLine, CalendarDays } from 'lucide-react'
import { ExportMenu } from './ExportMenu'

type Active = 'dashboard' | 'lotes' | 'config' | 'checkin' | 'programacao'

const NAV: { key: Active; href: string; label: string; Icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'checkin', href: '/admin/checkin', label: 'Check-in', Icon: ScanLine },
  { key: 'programacao', href: '/admin/programacao', label: 'Programação', Icon: CalendarDays },
  { key: 'lotes', href: '/admin/lotes', label: 'Lotes', Icon: Tags },
  { key: 'config', href: '/admin/configuracoes', label: 'Configurações', Icon: Settings },
]

export function AdminHeader({ active }: { active?: Active }) {
  const [aberto, setAberto] = useState(false)

  const navClass = (key: Active) =>
    `inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
      active === key ? 'bg-brand text-on-dark' : 'text-brand hover:bg-surface'
    }`

  const navClassMobile = (key: Active) =>
    `flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
      active === key ? 'bg-brand text-on-dark' : 'text-brand hover:bg-surface'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/admin" onClick={() => setAberto(false)} className="flex items-center">
          <span className="text-sm font-extrabold leading-tight text-brand">
            Painel
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-accent-hover">
              Administrativo
            </span>
          </span>
        </Link>

        {/* Desktop (≥1024px): linha única, sem wrap */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} className={navClass(n.key)}>
              <n.Icon size={15} /> {n.label}
            </Link>
          ))}
          <ExportMenu />
          <form action="/api/admin/logout" method="post">
            <button className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-sm font-semibold text-on-dark transition hover:bg-brand-hover">
              <LogOut size={15} /> Sair
            </button>
          </form>
        </nav>

        {/* Mobile/tablet: hambúrguer */}
        <button
          type="button"
          onClick={() => setAberto((o) => !o)}
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={aberto}
          className="grid h-10 w-10 place-items-center rounded-xl border border-line text-brand transition hover:bg-surface lg:hidden"
        >
          {aberto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile/tablet: painel */}
      {aberto && (
        <div className="animate-fade-in border-t border-line bg-canvas px-5 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.key} href={n.href} onClick={() => setAberto(false)} className={navClassMobile(n.key)}>
                <n.Icon size={16} /> {n.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 border-t border-line/70 pt-3">
            <ExportMenu />
          </div>

          <form action="/api/admin/logout" method="post" className="mt-3 border-t border-line/70 pt-3">
            <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-on-dark transition hover:bg-brand-hover">
              <LogOut size={15} /> Sair
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
