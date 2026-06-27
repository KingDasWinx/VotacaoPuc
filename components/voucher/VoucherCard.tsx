'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'

export interface VoucherInfo {
  eventoNome: string
  periodo: string
  local: string
  nome: string
  loteNome: string
  codigo: string
  ingressoId: string
}

// Dimensões lógicas (o PNG sai em 3x para ficar nítido no print/celular).
const W = 380
const H = 600
const DPR = 3

const COR = {
  brand: '#2C4A2E',
  brandHover: '#3D6B40',
  accent: '#C8A84B',
  accentTint: '#E8D49A',
  canvas: '#F7F3EC',
  ink: '#26302A',
  inkSoft: '#5C7A5E',
  onDark: '#F5F0E8',
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Reduz nomes longos para "Primeiro Último" (mantém nomes simples como estão). */
function primeiroUltimo(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length <= 1) return partes[0] ?? ''
  return `${partes[0]} ${partes[partes.length - 1]}`
}

/** Quebra o texto em até `maxLinhas` linhas que caibam em `maxW`; corta com … se exceder. */
function wrap(ctx: CanvasRenderingContext2D, texto: string, maxW: number, maxLinhas: number): string[] {
  const palavras = texto.split(/\s+/)
  const linhas: string[] = []
  let atual = ''
  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p
    if (ctx.measureText(teste).width > maxW && atual) {
      linhas.push(atual)
      atual = p
      if (linhas.length === maxLinhas - 1) break
    } else {
      atual = teste
    }
  }
  if (atual && linhas.length < maxLinhas) linhas.push(atual)
  // se sobrou texto, adiciona reticências na última linha
  const usados = linhas.join(' ').split(/\s+/).length
  if (usados < palavras.length && linhas.length) {
    let ultima = linhas[linhas.length - 1]
    while (ctx.measureText(ultima + '…').width > maxW && ultima.length > 1) ultima = ultima.slice(0, -1)
    linhas[linhas.length - 1] = ultima + '…'
  }
  return linhas
}

export function VoucherCard({ info }: { info: VoucherInfo }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    let cancelado = false
    async function desenhar() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      try {
        await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready
      } catch {
        /* fonte padrão serve de fallback */
      }

      const qrUrl = await QRCode.toDataURL(info.ingressoId, {
        margin: 1,
        width: 480,
        color: { dark: COR.ink, light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      })
      const qrImg = new Image()
      qrImg.src = qrUrl
      await new Promise((r) => {
        qrImg.onload = r
        qrImg.onerror = r
      })
      if (cancelado) return

      canvas.width = W * DPR
      canvas.height = H * DPR
      ctx.scale(DPR, DPR)

      // Fundo
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, W, H)

      // Header verde
      const headerH = 150
      const grad = ctx.createLinearGradient(0, 0, W, headerH)
      grad.addColorStop(0, COR.brand)
      grad.addColorStop(1, COR.brandHover)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, headerH)

      const pad = 28
      ctx.textBaseline = 'alphabetic'

      // eyebrow
      ctx.fillStyle = COR.accentTint
      ctx.font = '700 11px Montserrat, sans-serif'
      ctx.textAlign = 'left'
      const eyebrow = '1º SIMPÓSIO'
      ctx.save()
      ctx.letterSpacing = '3px'
      ctx.fillText(eyebrow, pad, 36)
      ctx.restore()

      // título do evento
      ctx.fillStyle = COR.onDark
      ctx.font = '800 19px Montserrat, sans-serif'
      const titulo = wrap(ctx, info.eventoNome, W - pad * 2, 3)
      titulo.forEach((l, i) => ctx.fillText(l, pad, 60 + i * 23))

      // período + local
      ctx.fillStyle = 'rgba(245,240,232,0.85)'
      ctx.font = '600 11px Montserrat, sans-serif'
      ctx.fillText(`${info.periodo}${info.local ? '  ·  ' + info.local : ''}`.slice(0, 60), pad, headerH - 16)

      // faixa dourada
      ctx.fillStyle = COR.accent
      ctx.fillRect(0, headerH, W, 5)

      // Corpo com cursor vertical (evita sobreposição com nomes longos).
      let y = headerH + 5

      // label INGRESSO
      y += 30
      ctx.fillStyle = COR.accent
      ctx.font = '800 11px Montserrat, sans-serif'
      ctx.save()
      ctx.letterSpacing = '2px'
      ctx.fillText('INGRESSO', pad, y)
      ctx.restore()

      // nome do participante
      y += 30
      ctx.fillStyle = COR.brand
      ctx.font = '800 24px Montserrat, sans-serif'
      const nome = wrap(ctx, primeiroUltimo(info.nome), W - pad * 2, 2)
      nome.forEach((l, i) => ctx.fillText(l, pad, y + i * 28))
      y += (nome.length - 1) * 28

      // lote
      y += 24
      ctx.fillStyle = COR.inkSoft
      ctx.font = '600 13px Montserrat, sans-serif'
      ctx.fillText(info.loteNome, pad, y)

      // QR em caixa
      const qrSize = 200
      const boxW = qrSize + 28
      const boxX = (W - boxW) / 2
      const boxY = y + 18
      ctx.fillStyle = COR.canvas
      roundRect(ctx, boxX, boxY, boxW, boxW, 18)
      ctx.fill()
      ctx.strokeStyle = COR.accent
      ctx.lineWidth = 1.5
      roundRect(ctx, boxX, boxY, boxW, boxW, 18)
      ctx.stroke()
      ctx.drawImage(qrImg, boxX + 14, boxY + 14, qrSize, qrSize)
      y = boxY + boxW

      // código
      y += 32
      ctx.textAlign = 'center'
      ctx.fillStyle = COR.ink
      ctx.font = '800 18px Montserrat, sans-serif'
      ctx.save()
      ctx.letterSpacing = '2px'
      ctx.fillText(info.codigo, W / 2, y)
      ctx.restore()

      // instrução
      y += 22
      ctx.fillStyle = COR.inkSoft
      ctx.font = '600 11px Montserrat, sans-serif'
      ctx.fillText('Apresente este QR Code na entrada do evento', W / 2, y)

      ctx.textAlign = 'left'
      if (!cancelado) setPronto(true)
    }
    desenhar()
    return () => {
      cancelado = true
    }
  }, [info])

  function salvar() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ingresso-${info.codigo}-${info.nome.split(' ')[0].toLowerCase()}.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        className="w-full max-w-[320px] rounded-2xl shadow-card"
        style={{ aspectRatio: `${W} / ${H}` }}
      />
      <button
        type="button"
        onClick={salvar}
        disabled={!pronto}
        className="flex w-full max-w-[320px] items-center justify-center gap-2 rounded-full bg-accent py-3 font-bold uppercase tracking-wide text-brand shadow-card transition hover:-translate-y-0.5 hover:bg-accent-hover hover:text-on-dark disabled:translate-y-0 disabled:opacity-60"
      >
        <Download size={18} /> Salvar ingresso
      </button>
    </div>
  )
}
