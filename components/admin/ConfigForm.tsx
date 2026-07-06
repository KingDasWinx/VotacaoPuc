'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EventConfig } from '@/lib/event-data'
import { Drawer } from '@/components/admin/ui/Overlay'
import { Save, Pencil, CalendarDays, CreditCard, Settings2 } from 'lucide-react'

const inputClass = 'mt-1 w-full rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5 font-normal focus:bg-white'

function localInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type Secao = 'evento' | 'pix' | 'vendas'

export function ConfigForm({ config }: { config: EventConfig }) {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string | number | boolean | null>>({ ...config })
  const [msg, setMsg] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [drawer, setDrawer] = useState<Secao | null>(null)

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
    if (res.ok) {
      router.refresh()
      setDrawer(null)
    }
  }

  const secoes: { key: Secao; titulo: string; desc: string; Icon: typeof CalendarDays }[] = [
    { key: 'evento', titulo: 'Dados do evento', desc: config.nome, Icon: CalendarDays },
    { key: 'pix', titulo: 'Pagamento PIX', desc: String(form.pix_chave ?? ''), Icon: CreditCard },
    { key: 'vendas', titulo: 'Vendas e capacidade', desc: form.inscricoes_abertas ? 'Inscrições abertas' : 'Inscrições fechadas', Icon: Settings2 },
  ]

  return (
    <>
      <div className="animate-fade-up mt-6 grid gap-4 sm:grid-cols-3">
        {secoes.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setDrawer(s.key)}
            className="group rounded-2xl border border-line bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-on-dark">
              <s.Icon size={20} />
            </span>
            <p className="mt-3 font-bold text-brand">{s.titulo}</p>
            <p className="mt-1 truncate text-sm text-ink/55">{s.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-hover">
              <Pencil size={12} /> Editar
            </span>
          </button>
        ))}
      </div>

      {msg && (
        <p className="mt-4 rounded-xl bg-brand/10 px-4 py-2 text-sm font-semibold text-brand">{msg}</p>
      )}

      <Drawer
        aberto={drawer === 'evento'}
        onFechar={() => setDrawer(null)}
        titulo="Dados do evento"
        subtitulo="Nome, datas, local e banner"
      >
        <div className="space-y-4">
          {(['nome', 'subtitulo', 'local', 'tags', 'banner_url'] as const).map((key) => (
            <label key={key} className="block text-sm font-semibold text-ink/80">
              {{ nome: 'Nome', subtitulo: 'Subtítulo', local: 'Local', tags: 'Tags', banner_url: 'URL do banner' }[key]}
              <input className={inputClass} value={String(form[key] ?? '')} onChange={(e) => set(key, e.target.value)} />
            </label>
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-ink/80">
              Início
              <input type="datetime-local" className={inputClass} defaultValue={localInput(config.data_inicio)} onChange={(e) => set('data_inicio', new Date(e.target.value).toISOString())} />
            </label>
            <label className="block text-sm font-semibold text-ink/80">
              Fim
              <input type="datetime-local" className={inputClass} defaultValue={localInput(config.data_fim)} onChange={(e) => set('data_fim', new Date(e.target.value).toISOString())} />
            </label>
          </div>
        </div>
        <SalvarBar salvando={salvando} onSalvar={salvar} />
      </Drawer>

      <Drawer
        aberto={drawer === 'pix'}
        onFechar={() => setDrawer(null)}
        titulo="Pagamento PIX"
        subtitulo="Chave e dados do recebedor"
      >
        <div className="space-y-4">
          {(['pix_chave', 'pix_nome_recebedor', 'pix_cidade', 'whatsapp_numero'] as const).map((key) => (
            <label key={key} className="block text-sm font-semibold text-ink/80">
              {{ pix_chave: 'Chave PIX', pix_nome_recebedor: 'Nome do recebedor (≤25)', pix_cidade: 'Cidade (≤15)', whatsapp_numero: 'WhatsApp' }[key]}
              <input className={inputClass} value={String(form[key] ?? '')} onChange={(e) => set(key, e.target.value)} />
            </label>
          ))}
        </div>
        <SalvarBar salvando={salvando} onSalvar={salvar} />
      </Drawer>

      <Drawer
        aberto={drawer === 'vendas'}
        onFechar={() => setDrawer(null)}
        titulo="Vendas e capacidade"
        subtitulo="Controle de inscrições"
      >
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-ink/80">
            Capacidade (0 = ilimitada)
            <input type="number" min={0} className={inputClass} value={Number(form.capacidade ?? 0)} onChange={(e) => set('capacidade', Number(e.target.value))} />
          </label>
          <label className="flex items-center gap-2.5 rounded-xl bg-surface/50 px-4 py-3 text-sm font-semibold text-ink/80">
            <input type="checkbox" className="h-4 w-4 accent-brand" checked={Boolean(form.inscricoes_abertas)} onChange={(e) => set('inscricoes_abertas', e.target.checked)} />
            Inscrições abertas
          </label>
        </div>
        <SalvarBar salvando={salvando} onSalvar={salvar} />
      </Drawer>
    </>
  )
}

function SalvarBar({ salvando, onSalvar }: { salvando: boolean; onSalvar: () => void }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-6 border-t border-line bg-canvas px-5 py-4">
      <button
        type="button"
        onClick={onSalvar}
        disabled={salvando}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-bold uppercase text-brand transition hover:bg-accent-hover hover:text-on-dark disabled:opacity-60"
      >
        <Save size={18} />
        {salvando ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </div>
  )
}
