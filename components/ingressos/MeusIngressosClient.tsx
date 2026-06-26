'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatBRL } from '@/lib/money'

interface PedidoResumo {
  codigo: string
  status: string
  valor_total_centavos: number
  quantidade: number
  lote_nome: string
  created_at: string
  ingressos: { nome: string; status: string }[]
}

const STATUS_LABEL: Record<string, { texto: string; classe: string }> = {
  pendente: { texto: 'Aguardando pagamento', classe: 'bg-amber-100 text-amber-800' },
  pago: { texto: 'Pago', classe: 'bg-green-100 text-green-800' },
  cancelado: { texto: 'Cancelado', classe: 'bg-red-100 text-red-800' },
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
    <div className="mt-6">
      <div className="flex gap-2">
        <input className="flex-1 rounded-lg border border-simp-mist px-3 py-2" placeholder="Seu CPF"
          inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} />
        <button onClick={buscar} disabled={carregando}
          className="rounded-full bg-simp-teal px-6 font-bold uppercase text-white disabled:opacity-60">
          {carregando ? '...' : 'Buscar'}
        </button>
      </div>
      {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}

      {pedidos && pedidos.length === 0 && (
        <p className="mt-6 text-simp-ink/70">Nenhum pedido encontrado para este CPF.</p>
      )}

      <div className="mt-6 space-y-4">
        {pedidos?.map((p) => {
          const badge = STATUS_LABEL[p.status] ?? STATUS_LABEL.pendente
          return (
            <div key={p.codigo} className="rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-simp-deep">{p.codigo}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.classe}`}>{badge.texto}</span>
              </div>
              <p className="mt-1 text-sm text-simp-ink/70">
                {p.lote_nome} · {p.quantidade} ingresso(s) · {formatBRL(p.valor_total_centavos)}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {p.ingressos.map((ing, idx) => (
                  <li key={idx} className={ing.status === 'cancelado' ? 'text-red-600 line-through' : 'text-simp-ink'}>
                    {ing.nome} {ing.status === 'cancelado' && '(cancelado)'}
                  </li>
                ))}
              </ul>
              {p.status === 'pendente' && (
                <Link href={`/pedido/${p.codigo}`} className="mt-3 inline-block text-sm font-semibold text-simp-teal underline">
                  Ver pagamento →
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
