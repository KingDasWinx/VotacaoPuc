'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({
  aberto,
  onFechar,
  titulo,
  children,
  largura = 'max-w-lg',
}: {
  aberto: boolean
  onFechar: () => void
  titulo: string
  children: React.ReactNode
  largura?: string
}) {
  useEffect(() => {
    if (!aberto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`animate-scale-in flex max-h-[90vh] w-full ${largura} flex-col overflow-hidden rounded-t-3xl border border-line bg-canvas shadow-card-hover sm:rounded-3xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-extrabold text-brand">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-9 w-9 place-items-center rounded-full text-ink/50 transition hover:bg-surface"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

export function Drawer({
  aberto,
  onFechar,
  titulo,
  subtitulo,
  children,
}: {
  aberto: boolean
  onFechar: () => void
  titulo: string
  subtitulo?: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!aberto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex justify-end bg-ink/50 backdrop-blur-sm"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-in-right flex h-full w-full max-w-lg flex-col overflow-hidden bg-canvas shadow-card-hover"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-brand">{titulo}</h2>
            {subtitulo && <p className="text-xs text-ink/55">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-9 w-9 place-items-center rounded-full text-ink/50 transition hover:bg-surface"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
