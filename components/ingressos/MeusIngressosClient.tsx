'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { formatBRL } from '@/lib/money'
import { getPedidosLocais, removePedidoLocal } from '@/lib/pedidos-local'
import { Clock, CircleCheck, CircleX, ArrowRight, Ticket, X } from 'lucide-react'

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
  const [pedidos, setPedidos] = useState<PedidoResumo[] | null>(null)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const codigos = getPedidosLocais()
    if (codigos.length === 0) {
      setPedidos([])
      return
    }
    setErro('')
    try {
      const res = await fetch('/api/meus-ingressos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigos }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao carregar')
        setPedidos([])
      } else {
        setPedidos(data.pedidos)
      }
    } catch {
      setErro('Erro de conexão')
      setPedidos([])
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  function esquecer(codigo: string) {
    removePedidoLocal(codigo)
    setPedidos((prev) => (prev ? prev.filter((p) => p.codigo !== codigo) : prev))
  }

  if (pedidos === null) {
    return <p className="mt-8 text-center text-ink/55">Carregando…</p>
  }

  return (
    <div className="mt-8">
      {erro && <p className="mb-4 text-sm text-red-700">{erro}</p>}

      {pedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white/50 p-10 text-center">
          <Ticket className="mx-auto text-ink/30" size={32} />
          <p className="mt-3 text-ink/60">Nenhum ingresso salvo neste dispositivo.</p>
          <Link
            href="/inscricao"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand underline-offset-4 transition hover:gap-2 hover:underline"
          >
            Fazer inscrição <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p, idx) => {
            const badge = STATUS_LABEL[p.status] ?? STATUS_LABEL.pendente
            return (
              <div
                key={p.codigo}
                className="animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-card"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
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
                <div className="mt-3 flex items-center justify-between gap-3">
                  {p.status === 'pendente' ? (
                    <Link
                      href={`/pedido/${p.codigo}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand underline-offset-4 transition hover:gap-2 hover:underline"
                    >
                      Ver pagamento <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <Link
                      href={`/pedido/${p.codigo}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand/70 underline-offset-4 transition hover:underline"
                    >
                      Detalhes
                    </Link>
                  )}
                  <button
                    onClick={() => esquecer(p.codigo)}
                    title="Remover deste dispositivo"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ink/45 transition hover:text-red-600"
                  >
                    <X size={13} /> Remover
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
