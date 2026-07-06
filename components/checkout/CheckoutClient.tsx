'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'
import { maskCpf, maskTelefone } from '@/lib/masks'
import { Plus, Trash2, User, ArrowRight } from 'lucide-react'

interface Participante {
  nome: string
  cpf: string
  data_nascimento: string
  telefone: string
}

const vazio = (): Participante => ({ nome: '', cpf: '', data_nascimento: '', telefone: '' })

const inputClass =
  'w-full rounded-xl border border-line bg-canvas/40 px-4 py-3 text-base text-ink placeholder:text-ink/40 focus:bg-white'

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
        body: JSON.stringify({ participantes, aceitou_regulamento: true }),
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
    <div className="mt-8">
      {participantes.map((p, i) => (
        <div
          key={i}
          className="animate-fade-up mb-4 rounded-2xl border border-line bg-white p-5 shadow-card"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-brand">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand">
                <User size={15} />
              </span>
              {i === 0 ? 'Seus dados' : `Ingresso ${i + 1}`}
            </h2>
            {i > 0 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={15} /> Remover
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-3">
            <label className="text-xs font-semibold text-ink/55">
              Nome completo
              <input
                className={`${inputClass} mt-1`}
                placeholder="Ex.: Maria da Silva"
                value={p.nome}
                onChange={(e) => update(i, 'nome', e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-ink/55">
              CPF
              <input
                className={`${inputClass} mt-1`}
                placeholder="000.000.000-00"
                inputMode="numeric"
                value={p.cpf}
                onChange={(e) => update(i, 'cpf', maskCpf(e.target.value))}
              />
            </label>
            <label className="text-xs font-semibold text-ink/55">
              Data de nascimento
              <input
                className={`${inputClass} mt-1`}
                type="date"
                value={p.data_nascimento}
                onChange={(e) => update(i, 'data_nascimento', e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-ink/55">
              Telefone (WhatsApp)
              <div className="mt-1 flex items-stretch">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-line bg-surface px-3 text-base font-semibold text-ink/70">
                  +55
                </span>
                <input
                  className={`${inputClass} !rounded-l-none`}
                  placeholder="45 9 9134-8030"
                  inputMode="tel"
                  value={p.telefone}
                  onChange={(e) => update(i, 'telefone', maskTelefone(e.target.value))}
                />
              </div>
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-muted/50 py-3.5 font-semibold text-brand transition hover:border-brand hover:bg-surface/50"
      >
        <Plus size={18} /> Adicionar ingresso para outra pessoa
      </button>

      <div className="sticky bottom-4 rounded-2xl border border-line bg-white p-5 shadow-card-hover">
        <div className="flex items-center justify-between text-sm text-ink/60">
          <span>
            {loteNome} × {participantes.length}
          </span>
          <span>{formatBRL(precoCentavos)} cada</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xl font-extrabold text-brand">
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>
        {erro && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={enviando}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-bold uppercase tracking-wide text-brand shadow-card transition hover:-translate-y-0.5 hover:bg-accent-hover hover:text-on-dark disabled:translate-y-0 disabled:opacity-60"
        >
          {enviando ? 'Processando…' : <>Ir para pagamento <ArrowRight size={18} /></>}
        </button>
        <p className="mt-3 text-center text-xs text-ink/55">
          Inscrição sujeita ao regulamento do evento (aceito anteriormente).
        </p>
      </div>
    </div>
  )
}
