import Image from 'next/image'

interface HeaderProps {
  badge?: string
}

export default function Header({ badge = 'Eleição 2026' }: HeaderProps) {
  return (
    <header className="bg-white border-b-[3px] border-puc-bordeaux px-5 md:px-10 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-11 h-11 relative flex-shrink-0 rounded-lg overflow-hidden">
          <Image src="/image.png" alt="PUCPR" fill className="object-contain" sizes="44px" />
        </div>
        <div>
          <div className="text-puc-bordeaux text-[22px] font-black tracking-wide leading-none">PUCPR</div>
          <div className="text-puc-bordeaux text-[8px] font-bold tracking-[2px] uppercase opacity-70">GRUPO MARISTA</div>
        </div>
      </div>
      {badge && (
        <span className="bg-puc-bordeaux text-white text-[9px] font-extrabold tracking-widest uppercase px-3 py-1.5 rounded-full">
          {badge}
        </span>
      )}
    </header>
  )
}
