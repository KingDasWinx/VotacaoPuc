'use client'

import Link from 'next/link'
import { Tags, CalendarDays, Settings, ScanLine, ArrowRight } from 'lucide-react'

const ATALHOS = [
  { href: '/admin/lotes', label: 'Gerenciar lotes', desc: 'Preços e períodos de venda', Icon: Tags, cor: 'bg-brand/10 text-brand' },
  { href: '/admin/programacao', label: 'Programação', desc: 'Grade científica do evento', Icon: CalendarDays, cor: 'bg-accent-tint/40 text-accent-hover' },
  { href: '/admin/configuracoes', label: 'Configurações', desc: 'Evento, PIX e capacidade', Icon: Settings, cor: 'bg-brand/10 text-brand' },
  { href: '/admin/checkin', label: 'Check-in', desc: 'Credenciamento no dia', Icon: ScanLine, cor: 'bg-surface text-ink/70' },
]

export function AdminQuickActions() {
  return (
    <div className="mt-6">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/45">Atalhos rápidos</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ATALHOS.map((a, i) => (
          <Link
            key={a.href}
            href={a.href}
            className="animate-fade-up group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${a.cor} transition group-hover:scale-105`}>
              <a.Icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-brand">{a.label}</p>
              <p className="truncate text-xs text-ink/55">{a.desc}</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-ink/25 transition group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </div>
  )
}
