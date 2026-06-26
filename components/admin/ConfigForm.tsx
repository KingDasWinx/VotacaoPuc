'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EventConfig } from '@/lib/event-data'

const CAMPOS_TEXTO: { key: keyof EventConfig; label: string }[] = [
  { key: 'nome', label: 'Nome do evento' },
  { key: 'subtitulo', label: 'Subtítulo' },
  { key: 'local', label: 'Local' },
  { key: 'tags', label: 'Faixa de tags' },
  { key: 'banner_url', label: 'URL do banner' },
  { key: 'pix_chave', label: 'Chave PIX' },
  { key: 'pix_nome_recebedor', label: 'Nome do recebedor (PIX, ≤25)' },
  { key: 'pix_cidade', label: 'Cidade do recebedor (PIX, ≤15)' },
  { key: 'whatsapp_numero', label: 'WhatsApp (ex.: 5545999999999)' },
]

export function ConfigForm({ config }: { config: EventConfig }) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string | number | boolean>>({ ...config })
  const [msg, setMsg] = useState('')
  const [salvando, setSalvando] = useState(false)

  function set(key: string, valor: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: valor }))
  }

  async function salvar() {
    setMsg('')
    setSalvando(true)
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setMsg(res.ok ? 'Salvo!' : (data.error ?? 'Erro'))
    setSalvando(false)
    if (res.ok) router.refresh()
  }

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-simp-mist bg-white p-5 shadow-sm">
      {CAMPOS_TEXTO.map((c) => (
        <label key={c.key} className="block text-sm font-semibold text-simp-ink/80">
          {c.label}
          <input className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2 font-normal"
            value={String(form[c.key] ?? '')} onChange={(e) => set(c.key, e.target.value)} />
        </label>
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-simp-ink/80">Início
          <input type="datetime-local" className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2 font-normal"
            defaultValue={localInput(config.data_inicio)}
            onChange={(e) => set('data_inicio', new Date(e.target.value).toISOString())} />
        </label>
        <label className="block text-sm font-semibold text-simp-ink/80">Fim
          <input type="datetime-local" className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2 font-normal"
            defaultValue={localInput(config.data_fim)}
            onChange={(e) => set('data_fim', new Date(e.target.value).toISOString())} />
        </label>
      </div>

      <label className="block text-sm font-semibold text-simp-ink/80">Capacidade (0 = ilimitada)
        <input type="number" min={0} className="mt-1 w-full rounded-lg border border-simp-mist px-3 py-2 font-normal"
          value={Number(form.capacidade ?? 0)} onChange={(e) => set('capacidade', Number(e.target.value))} />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-simp-ink/80">
        <input type="checkbox" checked={Boolean(form.inscricoes_abertas)}
          onChange={(e) => set('inscricoes_abertas', e.target.checked)} />
        Inscrições abertas
      </label>

      {msg && <p className="text-sm font-semibold text-simp-teal">{msg}</p>}
      <button onClick={salvar} disabled={salvando}
        className="rounded-full bg-simp-teal px-6 py-2 font-bold uppercase text-white disabled:opacity-60">
        {salvando ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  )
}

function localInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
