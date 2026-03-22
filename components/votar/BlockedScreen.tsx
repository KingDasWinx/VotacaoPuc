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

function calcTimeLeft(votacaoInicio: string) {
  const diff = new Date(votacaoInicio).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

export default function BlockedScreen({ votacaoInicio, ended, onOpen }: BlockedScreenProps) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(votacaoInicio))

  useEffect(() => {
    if (ended) return
    // Recalculate immediately when votacaoInicio changes
    setTimeLeft(calcTimeLeft(votacaoInicio))
    function update() {
      const diff = new Date(votacaoInicio).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        onOpen?.()
        return
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [votacaoInicio, ended, onOpen])

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
            <span className="mt-0.5 text-puc-bordeaux flex-shrink-0">
              {ended
                ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              }
            </span>
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
