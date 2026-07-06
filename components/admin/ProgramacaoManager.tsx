'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ProgramacaoItem, ProgramacaoTipo } from '@/lib/types'
import { PROGRAMACAO_TIPOS } from '@/lib/types'
import { Modal } from '@/components/admin/ui/Overlay'
import { ProgramacaoTimeline } from '@/components/programacao/ProgramacaoTimeline'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

const TIPO_OPCOES: { value: ProgramacaoTipo; label: string }[] = [
  { value: 'palestra', label: 'Palestra' },
  { value: 'mesa_redonda', label: 'Mesa redonda' },
  { value: 'coffee_break', label: 'Coffee break' },
  { value: 'abertura', label: 'Abertura' },
  { value: 'encerramento', label: 'Encerramento' },
  { value: 'outro', label: 'Outro' },
]

const inputClass = 'mt-1 w-full rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5 focus:bg-white'

type FormState = {
  dia: string
  hora_inicio: string
  hora_fim: string
  titulo: string
  palestrante: string
  descricao: string
  local_sala: string
  tipo: ProgramacaoTipo
  ordem: number
}

const formVazio = (diaPadrao: string): FormState => ({
  dia: diaPadrao,
  hora_inicio: '08:00',
  hora_fim: '',
  titulo: '',
  palestrante: '',
  descricao: '',
  local_sala: '',
  tipo: 'palestra',
  ordem: 0,
})

function itemParaForm(item: ProgramacaoItem): FormState {
  return {
    dia: item.dia,
    hora_inicio: item.hora_inicio.slice(0, 5),
    hora_fim: item.hora_fim?.slice(0, 5) ?? '',
    titulo: item.titulo,
    palestrante: item.palestrante ?? '',
    descricao: item.descricao ?? '',
    local_sala: item.local_sala ?? '',
    tipo: item.tipo,
    ordem: item.ordem,
  }
}

export function ProgramacaoManager({
  itensIniciais,
  diasSugeridos,
}: {
  itensIniciais: ProgramacaoItem[]
  diasSugeridos: string[]
}) {
  const router = useRouter()
  const [diaAtivo, setDiaAtivo] = useState(diasSugeridos[0] ?? '')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<ProgramacaoItem | null>(null)
  const [form, setForm] = useState<FormState>(formVazio(diasSugeridos[0] ?? ''))
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const dias = useMemo(() => {
    const set = new Set([...diasSugeridos, ...itensIniciais.map((i) => i.dia)])
    return Array.from(set).sort()
  }, [diasSugeridos, itensIniciais])

  const itensDoDia = useMemo(
    () => itensIniciais.filter((i) => i.dia === diaAtivo),
    [itensIniciais, diaAtivo]
  )

  function abrirNovo() {
    setEditando(null)
    setForm(formVazio(diaAtivo || dias[0] || ''))
    setErro('')
    setModalAberto(true)
  }

  function abrirEditar(item: ProgramacaoItem) {
    setEditando(item)
    setForm(itemParaForm(item))
    setErro('')
    setModalAberto(true)
  }

  async function salvar() {
    setErro('')
    setSalvando(true)
    const payload = {
      ...form,
      hora_fim: form.hora_fim || null,
      palestrante: form.palestrante || null,
      descricao: form.descricao || null,
      local_sala: form.local_sala || null,
      ...(editando ? { id: editando.id } : {}),
    }
    const res = await fetch('/api/admin/programacao', {
      method: editando ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setSalvando(false)
    if (!res.ok) {
      setErro(data.error ?? 'Erro ao salvar')
      return
    }
    setModalAberto(false)
    router.refresh()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta atividade da programação?')) return
    await fetch('/api/admin/programacao', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  async function moverOrdem(item: ProgramacaoItem, dir: -1 | 1) {
    const vizinhos = itensIniciais.filter((i) => i.dia === item.dia).sort((a, b) => a.ordem - b.ordem)
    const idx = vizinhos.findIndex((i) => i.id === item.id)
    const outro = vizinhos[idx + dir]
    if (!outro) return
    await Promise.all([
      fetch('/api/admin/programacao', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemParaForm(item), id: item.id, ordem: outro.ordem }),
      }),
      fetch('/api/admin/programacao', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemParaForm(outro), id: outro.id, ordem: item.ordem }),
      }),
    ])
    router.refresh()
  }

  function setF<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <div className="mt-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {dias.map((dia) => {
            const d = new Date(dia + 'T12:00:00')
            const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            return (
              <button
                key={dia}
                type="button"
                onClick={() => setDiaAtivo(dia)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  diaAtivo === dia ? 'bg-brand text-on-dark' : 'bg-white text-brand hover:bg-surface'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold uppercase text-brand transition hover:bg-accent-hover hover:text-on-dark"
        >
          <Plus size={16} /> Nova atividade
        </button>
      </div>

      {/* Lista editável do dia */}
      <div className="mt-6 space-y-2">
        {itensDoDia.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line py-12 text-center text-ink/55">
            Nenhuma atividade neste dia. Clique em &quot;Nova atividade&quot; para começar.
          </p>
        ) : (
          itensDoDia.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-brand">
                  {item.hora_inicio.slice(0, 5)}
                  {item.hora_fim ? ` – ${item.hora_fim.slice(0, 5)}` : ''}
                  {item.local_sala && <span className="ml-2 font-normal text-ink/50">{item.local_sala}</span>}
                </p>
                <p className="font-bold text-ink">{item.titulo}</p>
                {item.palestrante && <p className="text-sm text-brand-muted">{item.palestrante}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moverOrdem(item, -1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink/50 transition hover:bg-surface disabled:opacity-30"
                  aria-label="Subir"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={idx === itensDoDia.length - 1}
                  onClick={() => moverOrdem(item, 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink/50 transition hover:bg-surface disabled:opacity-30"
                  aria-label="Descer"
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => abrirEditar(item)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-brand transition hover:bg-surface"
                  aria-label="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => excluir(item.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                  aria-label="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview */}
      {itensIniciais.length > 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-surface/30 p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/45">Pré-visualização pública</p>
          <div className="mt-4">
            <ProgramacaoTimeline itens={itensIniciais} />
          </div>
        </div>
      )}

      <Modal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        titulo={editando ? 'Editar atividade' : 'Nova atividade'}
        largura="max-w-xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-ink/80 sm:col-span-2">
            Título *
            <input className={inputClass} value={form.titulo} onChange={(e) => setF('titulo', e.target.value)} />
          </label>
          <label className="text-sm font-semibold text-ink/80">
            Dia *
            <input type="date" className={inputClass} value={form.dia} onChange={(e) => setF('dia', e.target.value)} />
          </label>
          <label className="text-sm font-semibold text-ink/80">
            Tipo
            <select className={inputClass} value={form.tipo} onChange={(e) => setF('tipo', e.target.value as ProgramacaoTipo)}>
              {TIPO_OPCOES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-ink/80">
            Início *
            <input type="time" className={inputClass} value={form.hora_inicio} onChange={(e) => setF('hora_inicio', e.target.value)} />
          </label>
          <label className="text-sm font-semibold text-ink/80">
            Fim
            <input type="time" className={inputClass} value={form.hora_fim} onChange={(e) => setF('hora_fim', e.target.value)} />
          </label>
          <label className="text-sm font-semibold text-ink/80 sm:col-span-2">
            Palestrante / mediador
            <input className={inputClass} value={form.palestrante} onChange={(e) => setF('palestrante', e.target.value)} />
          </label>
          <label className="text-sm font-semibold text-ink/80 sm:col-span-2">
            Local / sala
            <input className={inputClass} value={form.local_sala} onChange={(e) => setF('local_sala', e.target.value)} placeholder="Ex.: Auditório principal" />
          </label>
          <label className="text-sm font-semibold text-ink/80 sm:col-span-2">
            Descrição
            <textarea
              className={`${inputClass} min-h-[80px] resize-y`}
              value={form.descricao}
              onChange={(e) => setF('descricao', e.target.value)}
              rows={3}
            />
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
          <button
            type="button"
            onClick={() => setModalAberto(false)}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink/60 transition hover:bg-surface"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}
