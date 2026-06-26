'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'

interface Participante {
  nome: string
  cpf: string
  data_nascimento: string
  telefone: string
}

const vazio = (): Participante => ({ nome: '', cpf: '', data_nascimento: '', telefone: '' })

export function CheckoutClient({ loteNome, precoCentavos }: { loteNome: string; precoCentavos: number }) {
  const router = useRouter()
  const [participantes, setParticipantes] = useState<Participante[]>([vazio()])
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const total = useMemo(() => precoCentavos * participantes.length, [precoCentavos, participantes.length])

  function update(i: number, campo: keyof Participante, valor: string) {
    setParticipantes((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)))
  }
  function add() {
    setParticipantes((prev) => [...prev, vazio()])
  }
  function remove(i: number) {
    setParticipantes((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function submit() {
    setErro('')
    setEnviando(true)
    try {
      const res = await fetch('/api/inscricao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao processar inscrição')
        setEnviando(false)
        return
      }
      router.push(`/pedido/${data.codigo}`)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
      setEnviando(false)
    }
  }

  return (
    <div className="mt-6">
      {participantes.map((p, i) => (
        <div key={i} className="mb-4 rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-simp-deep">
              {i === 0 ? 'Seu ingresso (seus dados)' : `Ingresso ${i + 1}`}
            </h2>
            {i > 0 && (
              <button type="button" onClick={() => remove(i)} className="text-sm font-semibold text-red-600">
                Remover
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-3">
            <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="Nome completo"
              value={p.nome} onChange={(e) => update(i, 'nome', e.target.value)} />
            <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="CPF" inputMode="numeric"
              value={p.cpf} onChange={(e) => update(i, 'cpf', e.target.value)} />
            <input className="rounded-lg border border-simp-mist px-3 py-2" type="date" aria-label="Data de nascimento"
              value={p.data_nascimento} onChange={(e) => update(i, 'data_nascimento', e.target.value)} />
            <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="Telefone (WhatsApp)" inputMode="tel"
              value={p.telefone} onChange={(e) => update(i, 'telefone', e.target.value)} />
          </div>
        </div>
      ))}

      <button type="button" onClick={add}
        className="mb-6 w-full rounded-full border-2 border-dashed border-simp-teal py-3 font-semibold text-simp-teal">
        + Adicionar ingresso para outra pessoa
      </button>

      <div className="rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm text-simp-ink/70">
          <span>{loteNome} × {participantes.length}</span>
          <span>{formatBRL(precoCentavos)} cada</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-lg font-extrabold text-simp-deep">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>
        {erro && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
        <button type="button" onClick={submit} disabled={enviando}
          className="mt-4 w-full rounded-full bg-simp-teal py-3 font-bold uppercase tracking-wide text-white transition hover:bg-simp-deep disabled:opacity-60">
          {enviando ? 'Processando…' : 'Ir para pagamento'}
        </button>
      </div>
    </div>
  )
}
