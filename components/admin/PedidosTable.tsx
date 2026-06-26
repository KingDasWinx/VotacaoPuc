'use client'

import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'
import { formatCpf } from '@/lib/cpf'

export interface PedidoRow {
  id: string
  codigo: string
  comprador_nome: string
  comprador_cpf: string
  comprador_telefone: string
  quantidade: number
  valor_total_centavos: number
  status: string
  metodo_comprovante: string
  tem_comprovante: boolean
  observacao_admin: string | null
  lote_nome: string
  ingressos: { id: string; nome: string; cpf: string; status: string }[]
}

const STATUS_CLASSE: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  pago: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}

export function PedidosTable({ pedidos }: { pedidos: PedidoRow[] }) {
  const router = useRouter()
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return pedidos.filter((p) => {
      if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false
      if (!q) return true
      return (
        p.codigo.toLowerCase().includes(q) ||
        p.comprador_nome.toLowerCase().includes(q) ||
        p.comprador_cpf.includes(q.replace(/\D/g, ''))
      )
    })
  }, [pedidos, filtroStatus, busca])

  async function setStatus(id: string, status: string) {
    if (status === 'cancelado' && !confirm('Cancelar este pedido?')) return
    setOcupado(true)
    await fetch(`/api/admin/pedidos/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setOcupado(false)
    router.refresh()
  }

  async function cancelarIngresso(id: string, atual: string) {
    const novo = atual === 'cancelado' ? 'valido' : 'cancelado'
    setOcupado(true)
    await fetch(`/api/admin/ingressos/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novo }),
    })
    setOcupado(false)
    router.refresh()
  }

  async function verComprovante(pedidoId: string) {
    const res = await fetch(`/api/admin/comprovante/${pedidoId}`)
    const data = await res.json()
    if (res.ok && data.url) window.open(data.url, '_blank')
    else alert(data.error ?? 'Sem comprovante')
  }

  function whatsapp(p: PedidoRow) {
    const num = p.comprador_telefone.replace(/\D/g, '')
    const texto = encodeURIComponent(`Olá ${p.comprador_nome}! Sobre sua inscrição ${p.codigo} no Simpósio.`)
    window.open(`https://wa.me/55${num}?text=${texto}`, '_blank')
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-lg border border-simp-mist px-3 py-2 text-sm">
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="pago">Pagos</option>
          <option value="cancelado">Cancelados</option>
        </select>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome, CPF ou código"
          className="flex-1 rounded-lg border border-simp-mist px-3 py-2 text-sm" />
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-simp-mist text-left text-simp-ink/60">
              <th className="py-2 pr-3">Código</th>
              <th className="py-2 pr-3">Comprador</th>
              <th className="py-2 pr-3">Telefone</th>
              <th className="py-2 pr-3">Qtd</th>
              <th className="py-2 pr-3">Lote</th>
              <th className="py-2 pr-3">Valor</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <Fragment key={p.id}>
                <tr className="border-b border-simp-mist/60 align-top">
                  <td className="py-3 pr-3 font-bold text-simp-deep">
                    <button onClick={() => setExpandido(expandido === p.id ? null : p.id)} className="underline">
                      {p.codigo}
                    </button>
                  </td>
                  <td className="py-3 pr-3">{p.comprador_nome}<br /><span className="text-xs text-simp-ink/60">{formatCpf(p.comprador_cpf)}</span></td>
                  <td className="py-3 pr-3">{p.comprador_telefone}</td>
                  <td className="py-3 pr-3">{p.quantidade}</td>
                  <td className="py-3 pr-3">{p.lote_nome}</td>
                  <td className="py-3 pr-3">{formatBRL(p.valor_total_centavos)}</td>
                  <td className="py-3 pr-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSE[p.status] ?? ''}`}>{p.status}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {p.status !== 'pago' && (
                        <button disabled={ocupado} onClick={() => setStatus(p.id, 'pago')}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white">Marcar pago</button>
                      )}
                      {p.status !== 'cancelado' && (
                        <button disabled={ocupado} onClick={() => setStatus(p.id, 'cancelado')}
                          className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">Cancelar</button>
                      )}
                      {p.status === 'cancelado' && (
                        <button disabled={ocupado} onClick={() => setStatus(p.id, 'pendente')}
                          className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white">Reabrir</button>
                      )}
                      {p.tem_comprovante && (
                        <button onClick={() => verComprovante(p.id)}
                          className="rounded bg-simp-teal px-2 py-1 text-xs font-semibold text-white">Comprovante</button>
                      )}
                      <button onClick={() => whatsapp(p)}
                        className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white">WhatsApp</button>
                    </div>
                  </td>
                </tr>
                {expandido === p.id && (
                  <tr className="border-b border-simp-mist/60 bg-simp-mist/30">
                    <td colSpan={8} className="px-3 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-simp-ink/60">Participantes</p>
                      <ul className="space-y-1">
                        {p.ingressos.map((ing) => (
                          <li key={ing.id} className="flex items-center justify-between">
                            <span className={ing.status === 'cancelado' ? 'text-red-600 line-through' : ''}>
                              {ing.nome} — {formatCpf(ing.cpf)}
                            </span>
                            <button disabled={ocupado} onClick={() => cancelarIngresso(ing.id, ing.status)}
                              className="text-xs font-semibold text-simp-teal underline">
                              {ing.status === 'cancelado' ? 'Reativar' : 'Cancelar ingresso'}
                            </button>
                          </li>
                        ))}
                      </ul>
                      {p.observacao_admin && (
                        <p className="mt-2 text-xs text-simp-ink/70">Obs.: {p.observacao_admin}</p>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="py-6 text-center text-simp-ink/60">Nenhum pedido.</p>}
      </div>
    </div>
  )
}
