'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '/programacao', label: 'Programação' },
  { href: '/regulamento', label: 'Regulamento' },
  { href: '/inscricao', label: 'Inscrição' },
]

export function SiteHeader() {
  const [aberto, setAberto] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" onClick={() => setAberto(false)} className="group flex items-center">
          <span className="text-sm font-extrabold leading-tight text-brand">
            Simpósio
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-accent-hover">
              Audiologia
            </span>
          </span>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-1 text-sm font-semibold sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-brand transition hover:bg-surface"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/meus-ingressos"
            className="rounded-full bg-brand px-3.5 py-2 text-on-dark transition hover:bg-brand-hover"
          >
            Meus ingressos
          </Link>
        </nav>

        {/* Mobile: botão hambúrguer */}
        <button
          type="button"
          onClick={() => setAberto((o) => !o)}
          aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={aberto}
          className="grid h-10 w-10 place-items-center rounded-xl border border-line text-brand transition hover:bg-surface sm:hidden"
        >
          {aberto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile: painel */}
      {aberto && (
        <nav className="animate-fade-in border-t border-line/70 bg-canvas px-5 py-3 sm:hidden">
          <div className="flex flex-col gap-1 text-sm font-semibold">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setAberto(false)}
                className="rounded-xl px-3.5 py-2.5 text-brand transition hover:bg-surface"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/meus-ingressos"
              onClick={() => setAberto(false)}
              className="rounded-xl bg-brand px-3.5 py-2.5 text-center text-on-dark transition hover:bg-brand-hover"
            >
              Meus ingressos
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
