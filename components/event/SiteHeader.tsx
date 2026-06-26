import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-black text-on-dark shadow-card transition group-hover:bg-brand-hover">
            S
          </span>
          <span className="text-sm font-extrabold leading-tight text-brand">
            Simpósio
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-accent-hover">
              Audiologia
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link
            href="/inscricao"
            className="rounded-full px-3.5 py-2 text-brand transition hover:bg-surface"
          >
            Inscrição
          </Link>
          <Link
            href="/meus-ingressos"
            className="rounded-full bg-brand px-3.5 py-2 text-on-dark transition hover:bg-brand-hover"
          >
            Meus ingressos
          </Link>
        </nav>
      </div>
    </header>
  )
}
