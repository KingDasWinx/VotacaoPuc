import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const MASTER = [
  { nome: 'Clínica Auditiva Cascavel', logo: '/patrocinadores/clinica-auditiva-cascavel.png' },
  { nome: 'Estúdio do Ouvir', logo: '/patrocinadores/estudio-do-ouvir.png' },
]

const APOIO = [
  { nome: 'Audiostore Centro Auditivo', logo: '/patrocinadores/audiostore.png' },
  { nome: 'IDAAC', logo: '/patrocinadores/idaac.png' },
  { nome: 'Kandel', logo: '/patrocinadores/kandel.png' },
  { nome: 'Tolevida Clínica Multiprofissional', logo: '/patrocinadores/tolevida.png' },
]

function Logo({ nome, logo, master, className, sizes }: {
  nome: string
  logo: string
  master?: boolean
  className: string
  sizes: string
}) {
  return (
    <div className={`rounded-2xl bg-white shadow-card ${master ? 'border-2 border-accent' : 'border border-line'} ${className}`}>
      <div className="relative h-full w-full">
        <Image src={logo} alt={nome} title={nome} fill className="object-contain" sizes={sizes} />
      </div>
    </div>
  )
}

/** Listagem completa da página /patrocinadores. */
export function Patrocinadores() {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Patrocinadores master</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {MASTER.map((p) => (
            <Logo key={p.nome} {...p} master className="h-56 p-6 sm:h-64" sizes="(min-width: 640px) 384px, 100vw" />
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Patrocinadores</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {APOIO.map((p) => (
            <Logo key={p.nome} {...p} className="h-32 p-5" sizes="(min-width: 768px) 384px, 50vw" />
          ))}
        </div>
      </section>
    </div>
  )
}

/** Faixa compacta exibida no fim das outras páginas. */
export function PatrocinadoresFaixa() {
  return (
    <section className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-hover">Apoio</p>
            <h2 className="mt-1 text-2xl font-extrabold text-brand">Patrocinadores</h2>
          </div>
          <Link
            href="/patrocinadores"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand transition hover:text-brand-hover"
          >
            Saiba mais <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
          {MASTER.map((p) => (
            <Logo key={p.nome} {...p} master className="h-32 p-4 sm:h-40 sm:p-5" sizes="(min-width: 768px) 384px, 50vw" />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-4 sm:gap-4">
          {APOIO.map((p) => (
            <Logo key={p.nome} {...p} className="h-20 p-3" sizes="(min-width: 640px) 192px, 50vw" />
          ))}
        </div>
      </div>
    </section>
  )
}
