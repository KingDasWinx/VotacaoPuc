interface HeaderProps {
  badge?: string
}

export default function Header({ badge = 'Eleição 2026' }: HeaderProps) {
  return (
    <header className="bg-white border-b-[3px] border-puc-bordeaux px-5 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-11 h-11 bg-puc-bordeaux rounded flex items-center justify-center text-white font-black text-sm tracking-tight leading-none">
          PUC
        </div>
        <div>
          <div className="text-puc-bordeaux text-[22px] font-black tracking-wide leading-none">
            PUCPR
          </div>
          <div className="text-puc-bordeaux text-[8px] font-bold tracking-[2px] uppercase opacity-70">
            GRUPO MARISTA
          </div>
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
