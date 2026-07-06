'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatBRL } from '@/lib/money'
import type { Lote } from '@/lib/types'
import { Modal } from '@/components/admin/ui/Overlay'
import { Plus, Power, Trash2, Pencil } from 'lucide-react'

function reaisParaCentavos(valor: string): number {
  const limpo = valor.replace(/\./g, '').replace(',', '.')
  return Math.round(parseFloat(limpo) * 100)
}

function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

function paraInputLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const inputClass = 'mt-1 w-full rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5 focus:bg-white'

type FormLote = { nome: string; preco: string; inicio: string; fim: string }

const formVazio = (): FormLote => ({ nome: '', preco: '', inicio: '', fim: '' })

function loteParaForm(l: Lote): FormLote {
  return {
    nome: l.nome,
    preco: centavosParaReais(l.preco_centavos),
    inicio: paraInputLocal(l.data_inicio),
    fim: paraInputLocal(l.data_fim),
  }
}

export function LotesManager({ lotesIniciais }: { lotesIniciais: Lote[] }) {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Lote | null>(null)
  const [form, setForm] = useState<FormLote>(formVazio())
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [confirmExcluir, setConfirmExcluir] = useState<Lote | null>(null)

  function abrirNovo() {
    setEditando(null)
    setForm(formVazio())
    setErro('')
    setModalAberto(true)
  }

  function abrirEditar(lote: Lote) {
    setEditando(lote)
    setForm(loteParaForm(lote))
    setErro('')
    setModalAberto(true)
  }

  async function salvar() {
    setErro('')
    const centavos = reaisParaCentavos(form.preco)
    if (!Number.isFinite(centavos) || centavos < 0) {
      setErro('Preço inválido')
      return
    }
    setSalvando(true)
    const payload = {
      ...(editando ? { id: editando.id, ativo: editando.ativo } : {}),
      nome: form.nome,
      preco_centavos: centavos,
      data_inicio: new Date(form.inicio).toISOString(),
      data_fim: new Date(form.fim).toISOString(),
    }
    const res = await fetch('/api/admin/lotes', {
      method: editando ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setSalvando(false)
    if (!res.ok) {
      setErro(data.error ?? 'Erro')
      return
    }
    setModalAberto(false)
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
    setConfirmExcluir(null)
    router.refresh()
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">{lotesIniciais.length} lote(s) cadastrado(s)</p>
        <button
          type="button"
          onClick={abrirNovo}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold uppercase text-brand transition hover:bg-accent-hover hover:text-on-dark"
        >
          <Plus size={16} /> Novo lote
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {lotesIniciais.map((l, i) => (
          <div
            key={l.id}
            className="animate-fade-up flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:shadow-card-hover"
            style={{ animationDelay: `${i * 40}ms` }}
          >
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
              <button
                type="button"
                onClick={() => abrirEditar(l)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-brand transition hover:bg-surface"
              >
                <Pencil size={15} /> Editar
              </button>
              <button
                type="button"
                onClick={() => toggleAtivo(l)}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand px-3 py-1.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-on-dark"
              >
                <Power size={15} /> {l.ativo ? 'Desativar' : 'Ativar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmExcluir(l)}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-400 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
              >
                <Trash2 size={15} /> Excluir
              </button>
            </div>
          </div>
        ))}
        {lotesIniciais.length === 0 && (
          <button
            type="button"
            onClick={abrirNovo}
            className="w-full rounded-2xl border-2 border-dashed border-brand-muted/40 py-14 text-center text-sm font-semibold text-brand transition hover:border-brand hover:bg-surface/40"
          >
            <Plus size={20} className="mx-auto mb-2" />
            Criar primeiro lote
          </button>
        )}
      </div>

      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo={editando ? 'Editar lote' : 'Novo lote'}
        largura="max-w-lg"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-ink/80 sm:col-span-2">
            Nome
            <input className={inputClass} placeholder="Ex.: Lote Promocional" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </label>
          <label className="text-sm font-semibold text-ink/80 sm:col-span-2">
            Preço (ex.: 150,00)
            <input className={inputClass} value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
          </label>
          <label className="text-sm font-semibold text-ink/80">
            Início
            <input type="datetime-local" className={inputClass} value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
          </label>
          <label className="text-sm font-semibold text-ink/80">
            Fim
            <input type="datetime-local" className={inputClass} value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} />
          </label>
        </div>
        {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="rounded-full bg-accent px-6 py-2.5 font-bold uppercase text-brand transition hover:bg-accent-hover hover:text-on-dark disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
          <button type="button" onClick={() => setModalAberto(false)} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink/60 hover:bg-surface">
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal
        aberto={Boolean(confirmExcluir)}
        onFechar={() => setConfirmExcluir(null)}
        titulo="Excluir lote"
        largura="max-w-md"
      >
        <p className="text-sm text-ink/70">
          Tem certeza que deseja excluir o lote <strong>{confirmExcluir?.nome}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => confirmExcluir && excluir(confirmExcluir.id)}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Excluir
          </button>
          <button type="button" onClick={() => setConfirmExcluir(null)} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink/60 hover:bg-surface">
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}
