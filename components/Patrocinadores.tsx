import Image from 'next/image'
import Link from 'next/link'

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

function Logo({ nome, logo, className, sizes }: { nome: string; logo: string; className: string; sizes: string }) {
  return (
    <div className={`bg-white rounded shadow-sm ${className}`}>
      <div className="relative w-full h-full">
        <Image src={logo} alt={nome} title={nome} fill className="object-contain" sizes={sizes} />
      </div>
    </div>
  )
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-1 h-[22px] bg-puc-bordeaux rounded-sm" />
      <h2 className="text-[13px] font-extrabold uppercase tracking-[1.5px] text-gray-800">{children}</h2>
    </div>
  )
}

/** Full listing for the /patrocinadores page. */
export default function Patrocinadores() {
  return (
    <div className="space-y-8">
      <section className="space-y-3.5">
        <Titulo>Patrocinadores Master</Titulo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {MASTER.map((p) => (
            <Logo key={p.nome} {...p} className="h-56 md:h-64 p-6 border-t-4 border-puc-bordeaux" sizes="(min-width: 640px) 50vw, 100vw" />
          ))}
        </div>
      </section>
      <section className="space-y-3.5">
        <Titulo>Patrocinadores</Titulo>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {APOIO.map((p) => (
            <Logo key={p.nome} {...p} className="h-28 p-4" sizes="(min-width: 1024px) 25vw, 50vw" />
          ))}
        </div>
      </section>
    </div>
  )
}

/** Compact strip shown at the bottom of the other screens. */
export function PatrocinadoresFaixa() {
  return (
    <section className="px-4 py-6 md:px-10 space-y-3.5">
      <div className="flex items-center justify-between">
        <Titulo>Patrocinadores</Titulo>
        <Link href="/patrocinadores" className="text-[11px] text-puc-bordeaux font-bold uppercase tracking-wide">
          Conheça →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MASTER.map((p) => (
          <Logo key={p.nome} {...p} className="h-28 md:h-32 p-3 border-t-4 border-puc-bordeaux" sizes="50vw" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {APOIO.map((p) => (
          <Logo key={p.nome} {...p} className="h-14 p-2.5" sizes="(min-width: 768px) 25vw, 50vw" />
        ))}
      </div>
    </section>
  )
}
