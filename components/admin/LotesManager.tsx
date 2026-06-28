'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'
import type { Lote } from '@/lib/types'
import { Plus, Power, Trash2, Pencil, Save, X } from 'lucide-react'

// Converte "150,00" ou "150.00" em centavos (15000)
function reaisParaCentavos(valor: string): number {
  const limpo = valor.replace(/\./g, '').replace(',', '.')
  return Math.round(parseFloat(limpo) * 100)
}

// Centavos -> "350,00" (para preencher o input ao editar)
function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

// ISO -> "2026-11-20T08:00" (formato do input datetime-local, hora local)
function paraInputLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputClass = 'w-full rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5 focus:bg-white'

export function LotesManager({ lotesIniciais }: { lotesIniciais: Lote[] }) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [erro, setErro] = useState('')

  // Edição inline
  const [editId, setEditId] = useState<string | null>(null)
  const [eNome, setENome] = useState('')
  const [ePreco, setEPreco] = useState('')
  const [eInicio, setEInicio] = useState('')
  const [eFim, setEFim] = useState('')
  const [eErro, setEErro] = useState('')

  async function criar() {
    setErro('')
    const centavos = reaisParaCentavos(preco)
    if (!Number.isFinite(centavos) || centavos < 0) {
      setErro('Preço inválido')
      return
    }
    const res = await fetch('/api/admin/lotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        preco_centavos: centavos,
        data_inicio: new Date(inicio).toISOString(),
        data_fim: new Date(fim).toISOString(),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setErro(data.error ?? 'Erro')
      return
    }
    setNome(''); setPreco(''); setInicio(''); setFim('')
    router.refresh()
  }

  function abrirEdicao(lote: Lote) {
    setEErro('')
    setEditId(lote.id)
    setENome(lote.nome)
    setEPreco(centavosParaReais(lote.preco_centavos))
    setEInicio(paraInputLocal(lote.data_inicio))
    setEFim(paraInputLocal(lote.data_fim))
  }

  async function salvarEdicao(lote: Lote) {
    setEErro('')
    const centavos = reaisParaCentavos(ePreco)
    if (!Number.isFinite(centavos) || centavos < 0) {
      setEErro('Preço inválido')
      return
    }
    const res = await fetch('/api/admin/lotes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lote.id,
        nome: eNome,
        preco_centavos: centavos,
        data_inicio: new Date(eInicio).toISOString(),
        data_fim: new Date(eFim).toISOString(),
        ativo: lote.ativo,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setEErro(data.error ?? 'Erro ao salvar')
      return
    }
    setEditId(null)
    router.refresh()
  }

  async function toggleAtivo(lote: Lote) {
    await fetch('/api/admin/lotes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lote.id, nome: lote.nome, preco_centavos: lote.preco_centavos,
        data_inicio: lote.data_inicio, data_fim: lote.data_fim, ativo: !lote.ativo,
      }),
    })
    router.refresh()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este lote?')) return
    const res = await fetch('/api/admin/lotes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error ?? 'Erro ao excluir')
      return
    }
    router.refresh()
  }

  return (
    <div className="mt-6">
      <div className="animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-card">
        <h2 className="font-bold text-brand">Novo lote</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={inputClass} placeholder="Nome (ex.: Lote Promocional)"
            value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className={inputClass} placeholder="Preço (ex.: 150,00)"
            value={preco} onChange={(e) => setPreco(e.target.value)} />
          <label className="text-xs font-semibold text-ink/55">Início
            <input type="datetime-local" className={`${inputClass} mt-1`}
              value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </label>
          <label className="text-xs font-semibold text-ink/55">Fim
            <input type="datetime-local" className={`${inputClass} mt-1`}
              value={fim} onChange={(e) => setFim(e.target.value)} />
          </label>
        </div>
        {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
        <button onClick={criar}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 font-bold uppercase text-brand transition hover:bg-accent-hover hover:text-on-dark">
          <Plus size={18} /> Criar lote
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {lotesIniciais.map((l, i) => (
          <div
            key={l.id}
            className="animate-fade-up rounded-2xl border border-line bg-white p-4 shadow-card"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {editId === l.id ? (
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-ink/55">Nome
                    <input className={`${inputClass} mt-1`} value={eNome} onChange={(e) => setENome(e.target.value)} />
                  </label>
                  <label className="text-xs font-semibold text-ink/55">Preço (ex.: 150,00)
                    <input className={`${inputClass} mt-1`} value={ePreco} onChange={(e) => setEPreco(e.target.value)} />
                  </label>
                  <label className="text-xs font-semibold text-ink/55">Início
                    <input type="datetime-local" className={`${inputClass} mt-1`} value={eInicio} onChange={(e) => setEInicio(e.target.value)} />
                  </label>
                  <label className="text-xs font-semibold text-ink/55">Fim
                    <input type="datetime-local" className={`${inputClass} mt-1`} value={eFim} onChange={(e) => setEFim(e.target.value)} />
                  </label>
                </div>
                {eErro && <p className="mt-3 text-sm text-red-700">{eErro}</p>}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => salvarEdicao(l)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-bold uppercase text-brand transition hover:bg-accent-hover hover:text-on-dark">
                    <Save size={15} /> Salvar
                  </button>
                  <button onClick={() => setEditId(null)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/60 transition hover:bg-surface">
                    <X size={15} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-brand">
                    {l.nome} — {formatBRL(l.preco_centavos)}
                  </p>
                  <p className="text-xs text-ink/55">
                    {new Date(l.data_inicio).toLocaleString('pt-BR')} → {new Date(l.data_fim).toLocaleString('pt-BR')}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      l.ativo ? 'bg-brand/10 text-brand' : 'bg-surface text-ink/50'
                    }`}
                  >
                    {l.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => abrirEdicao(l)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-brand transition hover:bg-surface">
                    <Pencil size={15} /> Editar
                  </button>
                  <button onClick={() => toggleAtivo(l)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand px-3 py-1.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-on-dark">
                    <Power size={15} /> {l.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => excluir(l.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-400 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white">
                    <Trash2 size={15} /> Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {lotesIniciais.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line py-10 text-center text-ink/55">
            Nenhum lote cadastrado.
          </p>
        )}
      </div>
    </div>
  )
}
