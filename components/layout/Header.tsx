import Image from 'next/image'
import Link from 'next/link'

interface HeaderProps {
  badge?: string
}

export default function Header({ badge = 'Eleição 2026' }: HeaderProps) {
  return (
    <header className="bg-white border-b-[3px] border-puc-bordeaux px-5 md:px-10 py-3.5 flex items-center justify-between">
      <Link href="/votar" className="flex items-center gap-2.5">
        <div className="w-11 h-11 relative flex-shrink-0 rounded-lg overflow-hidden">
          <Image src="/image.png" alt="PUCPR" fill className="object-contain" sizes="44px" />
        </div>
        <div>
          <div className="text-puc-bordeaux text-[22px] font-black tracking-wide leading-none">PUCPR</div>
          <div className="text-puc-bordeaux text-[8px] font-bold tracking-[2px] uppercase opacity-70">GRUPO MARISTA</div>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/patrocinadores"
          aria-label="Patrocinadores"
          className="flex items-center gap-1.5 text-puc-bordeaux text-[10px] font-extrabold tracking-widest uppercase"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
          <span className="hidden sm:inline">Patrocinadores</span>
        </Link>
        {badge && (
          <span className="bg-puc-bordeaux text-white text-[9px] font-extrabold tracking-widest uppercase px-3 py-1.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
    </header>
  )
}
