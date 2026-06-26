'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatBRL } from '@/lib/money'
import { maskCpf } from '@/lib/masks'
import { Search, Clock, CircleCheck, CircleX, ArrowRight, Ticket } from 'lucide-react'

interface PedidoResumo {
  codigo: string
  status: string
  valor_total_centavos: number
  quantidade: number
  lote_nome: string
  created_at: string
  ingressos: { nome: string; status: string }[]
}

const STATUS_LABEL: Record<string, { texto: string; classe: string; Icon: typeof Clock }> = {
  pendente: { texto: 'Aguardando pagamento', classe: 'bg-accent-tint/40 text-accent-hover', Icon: Clock },
  pago: { texto: 'Pago', classe: 'bg-brand/10 text-brand', Icon: CircleCheck },
  cancelado: { texto: 'Cancelado', classe: 'bg-red-100 text-red-700', Icon: CircleX },
}

export function MeusIngressosClient() {
  const [cpf, setCpf] = useState('')
  const [pedidos, setPedidos] = useState<PedidoResumo[] | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function buscar() {
    setErro('')
    setCarregando(true)
    try {
      const res = await fetch('/api/meus-ingressos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro na busca')
        setPedidos(null)
      } else {
        setPedidos(data.pedidos)
      }
    } catch {
      setErro('Erro de conexão')
    }
    setCarregando(false)
  }

  return (
    <div className="mt-8">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 placeholder:text-ink/40"
          placeholder="Seu CPF"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => setCpf(maskCpf(e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && buscar()}
        />
        <button
          onClick={buscar}
          disabled={carregando}
          className="flex items-center gap-2 rounded-full bg-accent px-6 font-bold uppercase text-brand transition hover:bg-accent-hover hover:text-on-dark disabled:opacity-60"
        >
          <Search size={18} />
          {carregando ? '...' : 'Buscar'}
        </button>
      </div>
      {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}

      {pedidos && pedidos.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-white/50 p-10 text-center">
          <Ticket className="mx-auto text-ink/30" size={32} />
          <p className="mt-3 text-ink/60">Nenhum pedido encontrado para este CPF.</p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {pedidos?.map((p, idx) => {
          const badge = STATUS_LABEL[p.status] ?? STATUS_LABEL.pendente
          return (
            <div
              key={p.codigo}
              className="animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-card"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold tracking-tight text-brand">{p.codigo}</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.classe}`}>
                  <badge.Icon size={13} /> {badge.texto}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink/60">
                {p.lote_nome} · {p.quantidade} ingresso(s) · {formatBRL(p.valor_total_centavos)}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {p.ingressos.map((ing, i) => (
                  <li
                    key={i}
                    className={ing.status === 'cancelado' ? 'text-red-600 line-through' : 'text-ink/80'}
                  >
                    {ing.nome} {ing.status === 'cancelado' && '(cancelado)'}
                  </li>
                ))}
              </ul>
              {p.status === 'pendente' && (
                <Link
                  href={`/pedido/${p.codigo}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand underline-offset-4 transition hover:gap-2 hover:underline"
                >
                  Ver pagamento <ArrowRight size={15} />
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
