'use client'

import { useEffect, useRef, useState } from 'react'
import { FileDown, ChevronDown, FileText, FileSpreadsheet, FileType } from 'lucide-react'

const FORMATOS = [
  { f: 'csv', nome: 'CSV', Icon: FileText },
  { f: 'xlsx', nome: 'Excel', Icon: FileSpreadsheet },
  { f: 'pdf', nome: 'PDF', Icon: FileType },
] as const

const TIPOS = [
  { tipo: 'participantes', nome: 'Credenciamento' },
  { tipo: 'pagamentos', nome: 'Pagamentos' },
] as const

export function ExportMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-brand transition hover:bg-surface"
      >
        <FileDown size={15} /> Exportar
        <ChevronDown size={13} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-60 overflow-hidden rounded-xl border border-line bg-white p-2 shadow-card-hover animate-scale-in">
          {TIPOS.map((t) => (
            <div key={t.tipo} className="px-1 py-1.5">
              <p className="px-1 pb-1.5 text-xs font-bold uppercase tracking-wide text-ink/45">{t.nome}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {FORMATOS.map(({ f, nome, Icon }) => (
                  <a
                    key={f}
                    href={`/api/admin/export?tipo=${t.tipo}&formato=${f}`}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-line bg-canvas/40 py-2 text-xs font-semibold text-brand transition hover:bg-brand hover:text-on-dark"
                  >
                    <Icon size={16} /> {nome}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
