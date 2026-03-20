import Image from 'next/image'
import { Candidato } from '@/types'

interface CandidateCardProps {
  candidato: Candidato
  selected: boolean
  onSelect: (id: string) => void
}

export default function CandidateCard({ candidato, selected, onSelect }: CandidateCardProps) {
  return (
    <button
      onClick={() => onSelect(candidato.id)}
      className={`w-full flex items-stretch bg-white rounded shadow-sm text-left transition-all duration-150 border-l-4 ${
        selected ? 'border-puc-red shadow-lg scale-[1.01]' : 'border-puc-bordeaux'
      }`}
    >
      <div className="relative w-[90px] min-h-[110px] bg-puc-bordeaux flex-shrink-0 overflow-hidden">
        <Image src={candidato.foto_url} alt={candidato.nome} fill className="object-cover" sizes="90px" />
        {selected && (
          <div className="absolute top-1.5 right-1.5 bg-puc-red rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-black">✓</div>
        )}
      </div>
      <div className="p-3.5 flex flex-col justify-center flex-1">
        <p className="text-[15px] font-extrabold text-gray-900 uppercase tracking-wide mb-1.5 capitalize">{candidato.nome}</p>
        <p className="text-[12px] text-gray-500 italic leading-relaxed border-l-2 border-gray-200 pl-2">"{candidato.frase}"</p>
        <p className="mt-2 text-[11px] text-puc-bordeaux font-bold uppercase tracking-wide">
          {selected ? 'Selecionado ✓' : 'Selecionar →'}
        </p>
      </div>
    </button>
  )
}
