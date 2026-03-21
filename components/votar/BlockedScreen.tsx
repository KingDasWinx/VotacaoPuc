'use client'

import { useEffect, useState } from 'react'

interface BlockedScreenProps {
  votacaoInicio: string
  ended?: boolean
  onOpen?: () => void
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function BlockedScreen({ votacaoInicio, ended, onOpen }: BlockedScreenProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (ended) return
    function update() {
      const diff = new Date(votacaoInicio).getTime() - Date.now()
      if (diff <= 0) { onOpen?.(); return }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [votacaoInicio, ended])

  const openDate = new Date(votacaoInicio).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="md:flex md:min-h-[calc(100vh-88px)]">
      <div className="bg-puc-bordeaux px-5 pt-10 pb-8 md:w-80 md:flex-shrink-0 md:px-10 md:pt-16 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
        <p className="text-white/70 text-[10px] font-bold tracking-[3px] uppercase mb-2">Eleição de Liderança</p>
        <h1 className="text-white text-[32px] md:text-[40px] font-black uppercase leading-[1.05] mb-2 relative z-10">
          LÍDER<br />DE <span className="text-pink-300">TURMA</span>
        </h1>
        <p className="text-white/80 text-sm font-medium relative z-10">Sua voz define quem vai te representar neste semestre.</p>
      </div>
      <div className="md:flex-1 md:flex md:items-center md:justify-center p-4 md:p-12">
        <div className="bg-white rounded shadow-md overflow-hidden w-full md:max-w-md">
          <div className="bg-puc-bordeaux px-6 py-8 text-center">
            <h2 className="text-white text-xl font-black uppercase tracking-wide mb-1">
              {ended ? 'Votação Encerrada' : 'Votação Fechada'}
            </h2>
            <p className="text-white/70 text-sm">
              {ended ? 'O período de votação foi encerrado.' : 'A votação abrirá em breve'}
            </p>
          </div>
          {!ended && (
            <div className="flex justify-center items-center gap-2 px-4 py-7">
              {[
                { value: timeLeft.days, label: 'Dias' },
                { value: timeLeft.hours, label: 'Horas' },
                { value: timeLeft.minutes, label: 'Min' },
                { value: timeLeft.seconds, label: 'Seg' },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-2">
                  {i > 0 && <span className="text-puc-bordeaux text-4xl font-black leading-none pb-4">:</span>}
                  <div className="text-center">
                    <span className="block text-puc-bordeaux text-4xl font-black leading-none">{pad(item.value)}</span>
                    <span className="block text-gray-400 text-[9px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="bg-pink-50 px-6 py-4 flex items-start gap-3 border-t border-pink-100">
            <span className="text-xl mt-0.5">{ended ? '🔒' : '📅'}</span>
            <p className="text-sm text-gray-600 leading-relaxed">
              {ended
                ? 'Aguarde o resultado ser divulgado pela coordenação do curso.'
                : <>Abertura em <strong className="text-puc-bordeaux">{openDate}</strong>.<br />Volte nesta hora para votar.</>
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
