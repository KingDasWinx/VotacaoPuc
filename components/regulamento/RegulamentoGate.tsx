'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { REGULAMENTO_ACEITE_KEY, REGULAMENTO_FILENAME } from '@/lib/regulamento-constants'
import { renderSimpleMarkdown } from '@/lib/markdown-simple'
import { Check, ScrollText, X } from 'lucide-react'

export function useRegulamentoAceito() {
  const [aceito, setAceito] = useState(false)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    setAceito(sessionStorage.getItem(REGULAMENTO_ACEITE_KEY) === '1')
    setPronto(true)
  }, [])

  const marcarAceito = useCallback(() => {
    sessionStorage.setItem(REGULAMENTO_ACEITE_KEY, '1')
    setAceito(true)
  }, [])

  return { aceito, pronto, marcarAceito }
}

function useRegulamentoMd() {
  const [md, setMd] = useState<string | null>(null)
  useEffect(() => {
    fetch(`/${REGULAMENTO_FILENAME}`)
      .then((r) => r.text())
      .then(setMd)
      .catch(() => setMd(''))
  }, [])
  return md
}

interface RegulamentoGateProps {
  onAceito: () => void
  onFechar?: () => void
}

export function RegulamentoGate({ onAceito, onFechar }: RegulamentoGateProps) {
  const md = useRegulamentoMd()
  const [marcado, setMarcado] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  function aceitar() {
    if (!marcado) return
    sessionStorage.setItem(REGULAMENTO_ACEITE_KEY, '1')
    onAceito()
  }

  const content = md ? renderSimpleMarkdown(md) : null

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas" role="dialog" aria-modal="true" aria-labelledby="regulamento-titulo">
      <div className="flex shrink-0 items-center justify-between border-b border-line bg-canvas/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10 text-brand">
            <ScrollText size={18} />
          </span>
          <div>
            <p id="regulamento-titulo" className="font-extrabold text-brand">
              Regulamento do evento
            </p>
            <p className="text-xs text-ink/55">Leia e confirme para continuar</p>
          </div>
        </div>
        {onFechar && (
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-9 w-9 place-items-center rounded-full text-ink/50 transition hover:bg-surface"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto max-w-2xl">
          {!content ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-surface" />
              ))}
            </div>
          ) : (
            content
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-white/95 px-5 py-4 shadow-card-hover backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink/80">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              checked={marcado}
              onChange={(e) => setMarcado(e.target.checked)}
            />
            <span>
              Li e aceito integralmente o{' '}
              <strong className="text-brand">Regulamento do evento</strong>
            </span>
          </label>
          <button
            type="button"
            onClick={aceitar}
            disabled={!marcado}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-bold uppercase tracking-wide text-brand shadow-card transition hover:bg-accent-hover hover:text-on-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={18} />
            Aceitar e continuar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function InscricaoCTA({ className, children }: { className?: string; children: React.ReactNode }) {
  const router = useRouter()
  const { aceito, pronto, marcarAceito } = useRegulamentoAceito()
  const [mostrarGate, setMostrarGate] = useState(false)

  function clicar() {
    if (aceito) {
      router.push('/inscricao')
      return
    }
    setMostrarGate(true)
  }

  if (!pronto) {
    return <div className={`${className ?? ''} animate-pulse rounded-full bg-surface py-3.5`} />
  }

  return (
    <>
      <button type="button" onClick={clicar} className={className}>
        {children}
      </button>
      {mostrarGate && (
        <RegulamentoGate
          onFechar={() => setMostrarGate(false)}
          onAceito={() => {
            marcarAceito()
            setMostrarGate(false)
            router.push('/inscricao')
          }}
        />
      )}
    </>
  )
}

export function InscricaoRegulamentoGuard({ children }: { children: React.ReactNode }) {
  const { aceito, pronto, marcarAceito } = useRegulamentoAceito()

  if (!pronto) {
    return <div className="mt-8 h-40 animate-pulse rounded-2xl bg-surface" />
  }

  if (!aceito) {
    return <RegulamentoGate onAceito={marcarAceito} />
  }

  return <>{children}</>
}
