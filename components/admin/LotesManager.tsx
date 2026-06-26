'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'
import type { Lote } from '@/lib/types'

// Converte "150,00" ou "150.00" em centavos (15000)
function reaisParaCentavos(valor: string): number {
  const limpo = valor.replace(/\./g, '').replace(',', '.')
  return Math.round(parseFloat(limpo) * 100)
}

export function LotesManager({ lotesIniciais }: { lotesIniciais: Lote[] }) {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [erro, setErro] = useState('')

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
      <div className="rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
        <h2 className="font-bold text-simp-deep">Novo lote</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="Nome (ex.: Lote Promocional)"
            value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className="rounded-lg border border-simp-mist px-3 py-2" placeholder="Preço (ex.: 150,00)"
            value={preco} onChange={(e) => setPreco(e.target.value)} />
          <label className="text-sm text-simp-ink/70">Início
            <input type="datetime-local" className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2"
              value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </label>
          <label className="text-sm text-simp-ink/70">Fim
            <input type="datetime-local" className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2"
              value={fim} onChange={(e) => setFim(e.target.value)} />
          </label>
        </div>
        {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
        <button onClick={criar} className="mt-4 rounded-full bg-simp-teal px-6 py-2 font-bold uppercase text-white">
          Criar lote
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {lotesIniciais.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-simp-mist bg-white p-4 shadow-sm">
            <div>
              <p className="font-bold text-simp-deep">{l.nome} — {formatBRL(l.preco_centavos)}</p>
              <p className="text-xs text-simp-ink/60">
                {new Date(l.data_inicio).toLocaleString('pt-BR')} → {new Date(l.data_fim).toLocaleString('pt-BR')}
              </p>
              <span className={`text-xs font-semibold ${l.ativo ? 'text-green-700' : 'text-simp-ink/50'}`}>
                {l.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleAtivo(l)} className="rounded-full border border-simp-teal px-3 py-1 text-sm font-semibold text-simp-teal">
                {l.ativo ? 'Desativar' : 'Ativar'}
              </button>
              <button onClick={() => excluir(l.id)} className="rounded-full border border-red-500 px-3 py-1 text-sm font-semibold text-red-600">
                Excluir
              </button>
            </div>
          </div>
        ))}
        {lotesIniciais.length === 0 && <p className="text-simp-ink/60">Nenhum lote cadastrado.</p>}
      </div>
    </div>
  )
}
