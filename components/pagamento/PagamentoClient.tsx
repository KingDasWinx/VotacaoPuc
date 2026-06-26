'use client'

import { useState } from 'react'

const STATUS_LABEL: Record<string, { texto: string; classe: string }> = {
  pendente: { texto: 'Aguardando pagamento', classe: 'bg-amber-100 text-amber-800' },
  pago: { texto: 'Pagamento confirmado', classe: 'bg-green-100 text-green-800' },
  cancelado: { texto: 'Pedido cancelado', classe: 'bg-red-100 text-red-800' },
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
      <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold ${badge.classe}`}>
        {badge.texto}
      </span>

      {status === 'pendente' && (
        <div className="rounded-2xl border border-simp-mist bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-simp-ink/70">Valor total</p>
          <p className="text-3xl font-extrabold text-simp-deep">{valorFormatado}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR Code PIX" className="mx-auto mt-4 h-64 w-64" />
          <button onClick={copiar}
            className="mt-4 w-full rounded-full bg-simp-teal py-3 font-bold uppercase tracking-wide text-white transition hover:bg-simp-deep">
            {copiado ? 'Código copiado!' : 'Copiar código PIX'}
          </button>
          <p className="mt-3 break-all rounded-lg bg-simp-mist px-3 py-2 text-xs text-simp-ink/70">
            Chave: {pixChave}
          </p>
        </div>
      )}

      {status === 'pendente' && (
        <div className="rounded-2xl border border-simp-mist bg-white p-6 shadow-sm">
          <h2 className="font-bold text-simp-deep">Enviar comprovante</h2>
          <p className="mt-1 text-sm text-simp-ink/70">
            Depois de pagar, anexe o comprovante aqui ou envie pelo WhatsApp.
          </p>
          {enviado ? (
            <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              Comprovante recebido! Em breve confirmaremos seu pagamento.
            </p>
          ) : (
            <label className="mt-4 block cursor-pointer rounded-full border-2 border-simp-teal py-3 text-center font-semibold text-simp-teal">
              {enviando ? 'Enviando…' : 'Anexar comprovante (imagem ou PDF)'}
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={enviarComprovante} disabled={enviando} />
            </label>
          )}
          {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
              className="mt-3 block rounded-full bg-green-600 py-3 text-center font-semibold text-white">
              Enviar comprovante por WhatsApp
            </a>
          )}
        </div>
      )}

      {status === 'pago' && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-800">
          Pagamento confirmado! Seu(s) ingresso(s) está(ão) garantido(s). Guarde o código <b>{codigo}</b>.
        </div>
      )}
    </div>
  )
}
