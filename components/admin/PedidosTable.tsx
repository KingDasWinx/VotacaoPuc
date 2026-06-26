'use client'

import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'
import { formatCpf } from '@/lib/cpf'
import { maskTelefone } from '@/lib/masks'
import {
  Search, Check, Ban, RotateCcw, FileText, MessageCircle, ChevronDown,
} from 'lucide-react'

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
  pendente: 'bg-accent-tint/40 text-accent-hover',
  pago: 'bg-brand/10 text-brand',
  cancelado: 'bg-red-100 text-red-700',
}

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendente', label: 'Pendentes' },
  { id: 'pago', label: 'Pagos' },
  { id: 'cancelado', label: 'Cancelados' },
]

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_CLASSE[status] ?? ''}`}>
      {status}
    </span>
  )
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
    const digits = p.comprador_telefone.replace(/\D/g, '')
    const num = digits.startsWith('55') ? digits : `55${digits}`
    const texto = encodeURIComponent(`Olá ${p.comprador_nome}! Sobre sua inscrição ${p.codigo} no Simpósio.`)
    window.open(`https://wa.me/${num}?text=${texto}`, '_blank')
  }

  const btn = 'inline-grid h-8 w-8 place-items-center rounded-lg transition disabled:opacity-40'

  function Acoes({ p }: { p: PedidoRow }) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {p.status !== 'pago' && (
          <button
            disabled={ocupado}
            onClick={() => setStatus(p.id, 'pago')}
            title="Marcar como pago"
            className={`${btn} bg-brand/10 text-brand hover:bg-brand hover:text-on-dark`}
          >
            <Check size={16} />
          </button>
        )}
        {p.status !== 'cancelado' && (
          <button
            disabled={ocupado}
            onClick={() => setStatus(p.id, 'cancelado')}
            title="Cancelar pedido"
            className={`${btn} bg-red-100 text-red-600 hover:bg-red-600 hover:text-white`}
          >
            <Ban size={16} />
          </button>
        )}
        {p.status === 'cancelado' && (
          <button
            disabled={ocupado}
            onClick={() => setStatus(p.id, 'pendente')}
            title="Reabrir pedido"
            className={`${btn} bg-accent-tint/40 text-accent-hover hover:bg-accent hover:text-brand`}
          >
            <RotateCcw size={16} />
          </button>
        )}
        {p.tem_comprovante && (
          <button
            onClick={() => verComprovante(p.id)}
            title="Ver comprovante"
            className={`${btn} bg-surface text-brand hover:bg-brand hover:text-on-dark`}
          >
            <FileText size={16} />
          </button>
        )}
        <button
          onClick={() => whatsapp(p)}
          title="Abrir WhatsApp"
          className={`${btn} bg-[#25D366]/15 text-[#1c9b4d] hover:bg-[#25D366] hover:text-white`}
        >
          <MessageCircle size={16} />
        </button>
      </div>
    )
  }

  function Participantes({ p }: { p: PedidoRow }) {
    return (
      <>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/55">Participantes</p>
        <ul className="space-y-1.5">
          {p.ingressos.map((ing) => (
            <li key={ing.id} className="flex items-center justify-between gap-3">
              <span className={ing.status === 'cancelado' ? 'text-red-600 line-through' : 'text-ink/80'}>
                {ing.nome} — {formatCpf(ing.cpf)}
              </span>
              <button
                disabled={ocupado}
                onClick={() => cancelarIngresso(ing.id, ing.status)}
                className="shrink-0 text-xs font-semibold text-brand underline-offset-2 transition hover:underline"
              >
                {ing.status === 'cancelado' ? 'Reativar' : 'Cancelar ingresso'}
              </button>
            </li>
          ))}
        </ul>
        {p.observacao_admin && <p className="mt-2 text-xs text-ink/65">Obs.: {p.observacao_admin}</p>}
      </>
    )
  }

  return (
    <div className="mt-8">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroStatus(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                filtroStatus === f.id ? 'bg-brand text-on-dark' : 'bg-white text-brand hover:bg-surface'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome, CPF ou código"
            className="w-full rounded-full border border-line bg-white py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      {/* Desktop: tabela */}
      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-line bg-white shadow-card md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/50 text-left text-xs uppercase tracking-wide text-ink/55">
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Comprador</th>
              <th className="px-4 py-3 font-semibold">Telefone</th>
              <th className="px-4 py-3 font-semibold">Qtd</th>
              <th className="px-4 py-3 font-semibold">Lote</th>
              <th className="px-4 py-3 font-semibold">Valor</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <Fragment key={p.id}>
                <tr className="border-b border-line/60 align-middle transition hover:bg-surface/30">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                      className="inline-flex items-center gap-1 font-bold text-brand"
                    >
                      {p.codigo}
                      <ChevronDown
                        size={14}
                        className={`transition ${expandido === p.id ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {p.comprador_nome}
                    <span className="block text-xs text-ink/55">{formatCpf(p.comprador_cpf)}</span>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{maskTelefone(p.comprador_telefone)}</td>
                  <td className="px-4 py-3">{p.quantidade}</td>
                  <td className="px-4 py-3 text-ink/70">{p.lote_nome}</td>
                  <td className="px-4 py-3 font-semibold">{formatBRL(p.valor_total_centavos)}</td>
                  <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-4 py-3"><Acoes p={p} /></td>
                </tr>
                {expandido === p.id && (
                  <tr className="border-b border-line/60 bg-surface/30">
                    <td colSpan={8} className="px-4 py-3">
                      <Participantes p={p} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="py-10 text-center text-ink/55">Nenhum pedido.</p>}
      </div>

      {/* Mobile: cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtrados.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-brand">{p.codigo}</span>
              <StatusPill status={p.status} />
            </div>
            <p className="mt-1 text-sm">{p.comprador_nome}</p>
            <p className="text-xs text-ink/55">{formatCpf(p.comprador_cpf)} · {maskTelefone(p.comprador_telefone)}</p>
            <p className="mt-1 text-sm text-ink/70">
              {p.lote_nome} · {p.quantidade}x · <span className="font-semibold text-ink">{formatBRL(p.valor_total_centavos)}</span>
            </p>
            <div className="mt-3">
              <Acoes p={p} />
            </div>
            <button
              onClick={() => setExpandido(expandido === p.id ? null : p.id)}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand"
            >
              Participantes
              <ChevronDown size={13} className={`transition ${expandido === p.id ? 'rotate-180' : ''}`} />
            </button>
            {expandido === p.id && (
              <div className="mt-2 rounded-xl bg-surface/40 p-3">
                <Participantes p={p} />
              </div>
            )}
          </div>
        ))}
        {filtrados.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line py-10 text-center text-ink/55">
            Nenhum pedido.
          </p>
        )}
      </div>
    </div>
  )
}
