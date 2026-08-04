'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'
import { formatCpf } from '@/lib/cpf'
import { maskTelefone } from '@/lib/masks'
import type { CategoriaInscricao, CategoriaParticipante } from '@/lib/types'
import {
  Search, Check, Ban, RotateCcw, FileText, MessageCircle, ChevronRight, X,
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
  ingressos: {
    id: string
    nome: string
    cpf: string
    data_nascimento: string
    telefone: string
    categoria: CategoriaParticipante
    status: string
  }[]
}

// "1990-05-20" -> "20/05/1990" (sem problemas de fuso, já que é data pura)
function formatData(iso: string): string {
  if (!iso) return '—'
  const [a, m, d] = iso.split('-')
  return d && m && a ? `${d}/${m}/${a}` : iso
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
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
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

  // Mantém o drawer sincronizado com os dados mais recentes após router.refresh().
  const selecionado = useMemo(
    () => pedidos.find((p) => p.id === selecionadoId) ?? null,
    [pedidos, selecionadoId],
  )

  useEffect(() => {
    if (!selecionadoId) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelecionadoId(null)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [selecionadoId])

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

  async function setCategoria(id: string, nome: string, categoria: CategoriaInscricao) {
    if (!confirm(`Você está alterando a categoria de ${nome} para ${categoria}. Deseja continuar?`)) return
    setOcupado(true)
    try {
      const res = await fetch(`/api/admin/ingressos/${id}/categoria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Falha ao atualizar categoria')
        return
      }
      router.refresh()
    } catch {
      alert('Erro de conexão ao atualizar categoria')
    } finally {
      setOcupado(false)
    }
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

      {/* Desktop: tabela (scroll horizontal em telas estreitas / tablet) */}
      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-line bg-white shadow-card md:block">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface/50 text-left text-xs uppercase tracking-wide text-ink/55">
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Comprador</th>
              <th className="px-4 py-3 font-semibold">Telefone</th>
              <th className="px-4 py-3 font-semibold">Qtd</th>
              <th className="px-4 py-3 font-semibold">Lote</th>
              <th className="px-4 py-3 font-semibold">Valor</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelecionadoId(p.id)}
                className="cursor-pointer border-b border-line/60 align-middle transition hover:bg-surface/40"
              >
                <td className="px-4 py-3 font-bold text-brand">{p.codigo}</td>
                <td className="px-4 py-3">
                  <span className="block max-w-[220px] truncate" title={p.comprador_nome}>
                    {p.comprador_nome}
                  </span>
                  <span className="block text-xs text-ink/55">{formatCpf(p.comprador_cpf)}</span>
                </td>
                <td className="px-4 py-3 text-ink/70">+55 {maskTelefone(p.comprador_telefone)}</td>
                <td className="px-4 py-3">{p.quantidade}</td>
                <td className="px-4 py-3 text-ink/70">{p.lote_nome}</td>
                <td className="px-4 py-3 font-semibold">{formatBRL(p.valor_total_centavos)}</td>
                <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                <td className="px-4 py-3 text-ink/35">
                  <ChevronRight size={18} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <p className="py-10 text-center text-ink/55">Nenhum pedido.</p>}
      </div>

      {/* Mobile: cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtrados.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelecionadoId(p.id)}
            className="block w-full rounded-2xl border border-line bg-white p-4 text-left shadow-card transition active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-brand">{p.codigo}</span>
              <StatusPill status={p.status} />
            </div>
            <p className="mt-1 truncate text-sm" title={p.comprador_nome}>{p.comprador_nome}</p>
            <p className="text-xs text-ink/55">{formatCpf(p.comprador_cpf)} · +55 {maskTelefone(p.comprador_telefone)}</p>
            <p className="mt-1 flex items-center justify-between text-sm text-ink/70">
              <span>{p.lote_nome} · {p.quantidade}x · <span className="font-semibold text-ink">{formatBRL(p.valor_total_centavos)}</span></span>
              <ChevronRight size={16} className="text-ink/35" />
            </p>
          </button>
        ))}
        {filtrados.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line py-10 text-center text-ink/55">
            Nenhum pedido.
          </p>
        )}
      </div>

      {/* Drawer lateral */}
      {selecionado && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-sm"
          onClick={() => setSelecionadoId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-in-right flex h-full w-full max-w-md flex-col overflow-y-auto bg-canvas shadow-card-hover"
          >
            {/* Cabeçalho */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-canvas/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink/45">Pedido</p>
                <p className="text-xl font-extrabold text-brand">{selecionado.codigo}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={selecionado.status} />
                <button
                  onClick={() => setSelecionadoId(null)}
                  aria-label="Fechar"
                  className="grid h-9 w-9 place-items-center rounded-full text-ink/50 transition hover:bg-surface hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5">
              {/* Comprador */}
              <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/45">Comprador</p>
                <p className="mt-1 font-bold text-ink">{selecionado.comprador_nome}</p>
                <dl className="mt-2 space-y-1 text-sm text-ink/70">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/45">CPF</dt>
                    <dd>{formatCpf(selecionado.comprador_cpf)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/45">Telefone</dt>
                    <dd>+55 {maskTelefone(selecionado.comprador_telefone)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/45">Lote</dt>
                    <dd className="text-right">{selecionado.lote_nome}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/45">Quantidade</dt>
                    <dd>{selecionado.quantidade}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink/45">Valor</dt>
                    <dd className="font-bold text-brand">{formatBRL(selecionado.valor_total_centavos)}</dd>
                  </div>
                </dl>
                {selecionado.observacao_admin && (
                  <p className="mt-3 rounded-xl bg-surface/60 px-3 py-2 text-xs text-ink/65">
                    Obs.: {selecionado.observacao_admin}
                  </p>
                )}
              </section>

              {/* Ações */}
              <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink/45">Ações</p>
                <div className="grid grid-cols-2 gap-2">
                  {selecionado.status !== 'pago' && (
                    <button
                      disabled={ocupado}
                      onClick={() => setStatus(selecionado.id, 'pago')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-on-dark transition hover:bg-brand-hover disabled:opacity-50"
                    >
                      <Check size={16} /> Marcar pago
                    </button>
                  )}
                  {selecionado.status !== 'cancelado' && (
                    <button
                      disabled={ocupado}
                      onClick={() => setStatus(selecionado.id, 'cancelado')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-100 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                    >
                      <Ban size={16} /> Cancelar
                    </button>
                  )}
                  {selecionado.status === 'cancelado' && (
                    <button
                      disabled={ocupado}
                      onClick={() => setStatus(selecionado.id, 'pendente')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-accent-tint/40 px-3 py-2.5 text-sm font-semibold text-accent-hover transition hover:bg-accent hover:text-brand disabled:opacity-50"
                    >
                      <RotateCcw size={16} /> Reabrir
                    </button>
                  )}
                  {selecionado.tem_comprovante && (
                    <button
                      onClick={() => verComprovante(selecionado.id)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-on-dark"
                    >
                      <FileText size={16} /> Comprovante
                    </button>
                  )}
                  <button
                    onClick={() => whatsapp(selecionado)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/15 px-3 py-2.5 text-sm font-semibold text-[#1c9b4d] transition hover:bg-[#25D366] hover:text-white"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </button>
                </div>
              </section>

              {/* Participantes */}
              <section className="rounded-2xl border border-line bg-white p-4 shadow-card">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink/45">
                  Participantes ({selecionado.ingressos.length})
                </p>
                <ul className="space-y-3">
                  {selecionado.ingressos.map((ing) => (
                    <li
                      key={ing.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-line/70 bg-canvas/40 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          title={ing.nome}
                          className={`truncate text-base font-bold ${ing.status === 'cancelado' ? 'text-red-600 line-through' : 'text-ink'}`}
                        >
                          {ing.nome}
                        </p>
                        <p className="mt-1 text-sm text-ink/70">CPF: {formatCpf(ing.cpf)}</p>
                        <p className="text-sm text-ink/70">Nascimento: {formatData(ing.data_nascimento)}</p>
                        <p className="text-sm text-ink/70">Telefone: +55 {maskTelefone(ing.telefone)}</p>
                        <label className="mt-2 block text-sm text-ink/70">
                          Categoria
                          <select
                            aria-label={`Categoria de ${ing.nome}`}
                            className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink"
                            value={ing.categoria}
                            disabled={ocupado}
                            onChange={(e) => setCategoria(ing.id, ing.nome, e.target.value as CategoriaInscricao)}
                          >
                            <option value="pendente" disabled>Pendente</option>
                            <option value="estudante">Estudante</option>
                            <option value="profissional">Profissional</option>
                          </select>
                        </label>
                      </div>
                      <button
                        disabled={ocupado}
                        onClick={() => cancelarIngresso(ing.id, ing.status)}
                        className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-surface disabled:opacity-50"
                      >
                        {ing.status === 'cancelado' ? 'Reativar' : 'Cancelar'}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
