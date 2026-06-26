'use client'

import { useState } from 'react'
import { Copy, Check, Upload, MessageCircle, Clock, CircleCheck, CircleX } from 'lucide-react'

const STATUS_LABEL: Record<string, { texto: string; classe: string; Icon: typeof Clock }> = {
  pendente: { texto: 'Aguardando pagamento', classe: 'bg-accent-tint/40 text-accent-hover', Icon: Clock },
  pago: { texto: 'Pagamento confirmado', classe: 'bg-brand/10 text-brand', Icon: CircleCheck },
  cancelado: { texto: 'Pedido cancelado', classe: 'bg-red-100 text-red-700', Icon: CircleX },
}

export function PagamentoClient({
  codigo, status, valorFormatado, pixPayload, pixChave, qrDataUrl, whatsappNumero, jaTemComprovante,
}: {
  codigo: string
  status: string
  valorFormatado: string
  pixPayload: string
  pixChave: string
  qrDataUrl: string
  whatsappNumero: string | null
  jaTemComprovante: boolean
}) {
  const [copiado, setCopiado] = useState(false)
  const [enviado, setEnviado] = useState(jaTemComprovante)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const badge = STATUS_LABEL[status] ?? STATUS_LABEL.pendente

  async function copiar() {
    await navigator.clipboard.writeText(pixPayload)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  async function enviarComprovante(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('codigo', codigo)
      fd.append('file', file)
      const res = await fetch('/api/comprovante', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Falha ao enviar')
      } else {
        setEnviado(true)
      }
    } catch {
      setErro('Erro de conexão')
    }
    setEnviando(false)
  }

  const whatsappLink = whatsappNumero
    ? `https://wa.me/${whatsappNumero.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Olá! Segue o comprovante de pagamento do pedido ${codigo}.`
      )}`
    : null

  return (
    <div className="mt-6 space-y-6">
      <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${badge.classe}`}>
        <badge.Icon size={16} /> {badge.texto}
      </span>

      {status === 'pendente' && (
        <div className="animate-scale-in rounded-3xl border border-line bg-white p-6 text-center shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Valor total</p>
          <p className="text-4xl font-extrabold text-brand">{valorFormatado}</p>
          <div className="mx-auto mt-5 w-fit rounded-2xl border border-line bg-white p-3 shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code PIX" className="h-60 w-60" />
          </div>
          <button
            onClick={copiar}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-bold uppercase tracking-wide text-brand shadow-card transition hover:-translate-y-0.5 hover:bg-accent-hover hover:text-on-dark"
          >
            {copiado ? <><Check size={18} /> Código copiado!</> : <><Copy size={18} /> Copiar código PIX</>}
          </button>
          <p className="mt-3 break-all rounded-xl bg-surface px-3 py-2 text-xs text-ink/60">
            Chave: {pixChave}
          </p>
        </div>
      )}

      {status === 'pendente' && (
        <div className="animate-fade-up rounded-3xl border border-line bg-white p-6 shadow-card">
          <h2 className="font-bold text-brand">Enviar comprovante</h2>
          <p className="mt-1 text-sm text-ink/60">
            Depois de pagar, anexe o comprovante aqui ou envie pelo WhatsApp.
          </p>
          {enviado ? (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand/10 px-4 py-3 text-sm font-semibold text-brand">
              <CircleCheck size={18} /> Comprovante recebido! Em breve confirmaremos seu pagamento.
            </p>
          ) : (
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-brand py-3 text-center font-semibold text-brand transition hover:bg-surface">
              <Upload size={18} />
              {enviando ? 'Enviando…' : 'Anexar comprovante (imagem ou PDF)'}
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={enviarComprovante}
                disabled={enviando}
              />
            </label>
          )}
          {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-center font-semibold text-white transition hover:brightness-95"
            >
              <MessageCircle size={18} /> Enviar comprovante por WhatsApp
            </a>
          )}
        </div>
      )}

      {status === 'pago' && (
        <div className="animate-scale-in rounded-3xl border border-brand/20 bg-brand/5 p-6 text-brand">
          <p className="flex items-center gap-2 text-lg font-bold">
            <CircleCheck size={22} /> Pagamento confirmado!
          </p>
          <p className="mt-2 text-ink/70">
            Seu(s) ingresso(s) está(ão) garantido(s). Guarde o código <b>{codigo}</b>.
          </p>
        </div>
      )}
    </div>
  )
}
