import { Candidato } from '@/types'
import CandidateCard from './CandidateCard'

interface CandidateListProps {
  candidatos: Candidato[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function CandidateList({ candidatos, selectedId, onSelect }: CandidateListProps) {
  return (
    <div>
      <div className="flex items-center gap-2.5 px-4 pt-6 pb-3.5">
        <div className="w-1 h-[22px] bg-puc-bordeaux rounded-sm" />
        <h2 className="text-[13px] font-extrabold uppercase tracking-[1.5px] text-gray-800">Candidatos</h2>
      </div>
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-32 md:pb-8">
        {candidatos.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8 col-span-full">Nenhum candidato cadastrado ainda.</p>
        )}
        {candidatos.map((c) => (
          <CandidateCard key={c.id} candidato={c} selected={selectedId === c.id} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}
