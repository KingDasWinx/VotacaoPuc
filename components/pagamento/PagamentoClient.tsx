'use client'

import { useEffect, useState } from 'react'
import {
  Copy, Check, Upload, MessageCircle, Clock, CircleCheck, CircleX, BadgeCheck, X, ShieldCheck,
} from 'lucide-react'
import { addPedidoLocal } from '@/lib/pedidos-local'
import { Vouchers } from '@/components/voucher/Vouchers'
import type { VoucherInfo } from '@/components/voucher/VoucherCard'

const STATUS_LABEL: Record<string, { texto: string; classe: string; Icon: typeof Clock }> = {
  pendente: { texto: 'Aguardando pagamento', classe: 'bg-accent-tint/40 text-accent-hover', Icon: Clock },
  pago: { texto: 'Pagamento confirmado', classe: 'bg-brand/10 text-brand', Icon: CircleCheck },
  cancelado: { texto: 'Pedido cancelado', classe: 'bg-red-100 text-red-700', Icon: CircleX },
}

export function PagamentoClient({
  codigo, status, valorFormatado, pixPayload, pixChave, qrDataUrl, whatsappNumero, jaTemComprovante,
  voucherBase, ingressos,
}: {
  codigo: string
  status: string
  valorFormatado: string
  pixPayload: string
  pixChave: string
  qrDataUrl: string
  whatsappNumero: string | null
  jaTemComprovante: boolean
  voucherBase: Omit<VoucherInfo, 'nome' | 'ingressoId'>
  ingressos: { id: string; nome: string; status: string }[]
}) {
  const [copiado, setCopiado] = useState(false)
  const [enviado, setEnviado] = useState(jaTemComprovante)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [pagamentoInformado, setPagamentoInformado] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)

  const badge = STATUS_LABEL[status] ?? STATUS_LABEL.pendente

  useEffect(() => {
    addPedidoLocal(codigo)
    if (jaTemComprovante || (typeof window !== 'undefined' && localStorage.getItem(`simp_paguei_${codigo}`) === '1')) {
      setPagamentoInformado(true)
    }
  }, [codigo, jaTemComprovante])

  useEffect(() => {
    if (!modalAberto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalAberto(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [modalAberto])

  function informarPagamento() {
    setPagamentoInformado(true)
    setModalAberto(true)
    try {
      localStorage.setItem(`simp_paguei_${codigo}`, '1')
    } catch {
      /* localStorage indisponível — segue só na sessão */
    }
  }

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
      if (!res.ok) setErro(data.error ?? 'Falha ao enviar')
      else setEnviado(true)
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

  const mostrarVouchers = status === 'pago' || (status === 'pendente' && pagamentoInformado)

  return (
    <div className="mt-6 space-y-6">
      <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${badge.classe}`}>
        <badge.Icon size={16} /> {badge.texto}
      </span>

      {/* PIX / QR — some depois que o usuário informa o pagamento */}
      {status === 'pendente' && !pagamentoInformado && (
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
          <p className="mt-3 break-all rounded-xl bg-surface px-3 py-2 text-xs text-ink/60">Chave: {pixChave}</p>

          <button
            onClick={informarPagamento}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 font-bold uppercase tracking-wide text-on-dark shadow-card transition hover:-translate-y-0.5 hover:bg-brand-hover"
          >
            <BadgeCheck size={18} /> Já fiz o pagamento
          </button>
          <p className="mt-2 text-xs text-ink/50">
            Clique após pagar para liberar seu ingresso e enviar o comprovante.
          </p>
        </div>
      )}

      {/* Resumo após informar pagamento */}
      {status === 'pendente' && pagamentoInformado && (
        <div className="animate-scale-in rounded-3xl border border-brand/20 bg-brand/5 p-6">
          <p className="flex items-center gap-2 text-lg font-bold text-brand">
            <BadgeCheck size={22} /> Pagamento informado
          </p>
          {enviado ? (
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-brand">
              <CircleCheck size={16} /> Comprovante enviado. Em breve confirmaremos.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink/70">
                Envie o comprovante para agilizar a confirmação do seu pagamento.
              </p>
              <button
                onClick={() => setModalAberto(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-bold uppercase tracking-wide text-brand shadow-card transition hover:-translate-y-0.5 hover:bg-accent-hover hover:text-on-dark"
              >
                <Upload size={18} /> Enviar comprovante
              </button>
            </>
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

      {mostrarVouchers && (
        <div>
          {status === 'pendente' && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-accent/30 bg-accent-tint/20 px-4 py-3 text-sm text-ink/70">
              <Clock size={16} className="mt-0.5 shrink-0 text-accent-hover" />
              <span>
                Pagamento em análise. Salve seu ingresso agora — ele será validado na entrada assim que
                confirmarmos o pagamento.
              </span>
            </div>
          )}
          <Vouchers base={voucherBase} ingressos={ingressos} />
        </div>
      )}

      {/* Modal de envio de comprovante */}
      {modalAberto && (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setModalAberto(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Enviar comprovante"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-up w-full rounded-t-3xl bg-white p-6 shadow-card-hover sm:max-w-md sm:rounded-3xl sm:animate-scale-in"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-brand">
                  <ShieldCheck size={20} className="text-accent-hover" /> Enviar comprovante
                </h2>
                <p className="mt-1 text-sm text-ink/60">
                  Anexe o comprovante ou envie pelo WhatsApp. Isso agiliza a confirmação.
                </p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                aria-label="Fechar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/50 transition hover:bg-surface hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {enviado ? (
              <div className="mt-5 flex flex-col items-center rounded-2xl bg-brand/5 p-6 text-center">
                <CircleCheck size={48} className="text-brand" />
                <p className="mt-3 font-bold text-brand">Comprovante recebido!</p>
                <p className="mt-1 text-sm text-ink/60">Em breve confirmaremos seu pagamento.</p>
                <button
                  onClick={() => setModalAberto(false)}
                  className="mt-5 w-full rounded-full bg-brand py-3 font-bold uppercase tracking-wide text-on-dark transition hover:bg-brand-hover"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-center font-bold uppercase tracking-wide text-brand shadow-card transition hover:bg-accent-hover hover:text-on-dark">
                  <Upload size={18} />
                  {enviando ? 'Enviando…' : 'Anexar imagem ou PDF'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={enviarComprovante}
                    disabled={enviando}
                  />
                </label>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-3.5 text-center font-bold text-white transition hover:brightness-95"
                  >
                    <MessageCircle size={18} /> Enviar pelo WhatsApp
                  </a>
                )}
                {erro && <p className="text-sm text-red-700">{erro}</p>}
                <button
                  onClick={() => setModalAberto(false)}
                  className="w-full py-2 text-sm font-semibold text-ink/55 transition hover:text-ink"
                >
                  Enviar depois
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
