'use client'

import { useEffect, useRef, useState } from 'react'
import type { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle2, XCircle, AlertTriangle, Camera, ScanLine, RotateCcw, LogIn } from 'lucide-react'

type Tipo = 'ok' | 'duplicado' | 'invalido' | 'nao_encontrado' | 'erro'
interface Resultado {
  tipo: Tipo
  nome?: string
  mensagem?: string
  entradas?: number
  hora?: string
  horaAnterior?: string
}

const VISUAL: Record<Tipo, { Icon: typeof CheckCircle2; classe: string; icone: string }> = {
  ok: { Icon: CheckCircle2, classe: 'bg-brand text-on-dark', icone: 'text-accent-tint' },
  duplicado: { Icon: AlertTriangle, classe: 'bg-amber-500 text-white', icone: 'text-white' },
  invalido: { Icon: XCircle, classe: 'bg-red-600 text-white', icone: 'text-white' },
  nao_encontrado: { Icon: XCircle, classe: 'bg-red-600 text-white', icone: 'text-white' },
  erro: { Icon: XCircle, classe: 'bg-red-600 text-white', icone: 'text-white' },
}

function hhmm(iso?: string): string | undefined {
  return iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : undefined
}

export function CheckinClient() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lockRef = useRef(false)
  const [escaneando, setEscaneando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erroCamera, setErroCamera] = useState('')

  async function pararScanner() {
    const s = scannerRef.current
    if (s && s.isScanning) {
      try {
        await s.stop()
      } catch {
        /* já parado */
      }
    }
  }

  async function processar(texto: string) {
    if (lockRef.current) return
    lockRef.current = true
    await pararScanner()
    setEscaneando(false)
    try {
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingressoId: texto.trim() }),
      })
      const data = await res.json()
      setResultado({
        tipo: (data.resultado as Tipo) ?? 'erro',
        nome: data.nome,
        mensagem: data.mensagem,
        entradas: data.entradas,
        hora: hhmm(data.registrada_em),
        horaAnterior: hhmm(data.entrada_anterior),
      })
    } catch {
      setResultado({ tipo: 'erro', mensagem: 'Falha de conexão. Tente novamente.' })
    }
  }

  async function iniciar() {
    setErroCamera('')
    setResultado(null)
    lockRef.current = false
    setEscaneando(true)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode('reader')
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (texto) => {
          void processar(texto)
        },
        () => {},
      )
    } catch {
      setEscaneando(false)
      setErroCamera('Não foi possível acessar a câmera. Permita o acesso à câmera e tente novamente.')
    }
  }

  useEffect(() => {
    void iniciar()
    return () => {
      void pararScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const vis = resultado ? VISUAL[resultado.tipo] : null
  const entradas = resultado?.entradas ?? 0
  const reentrada = resultado?.tipo === 'ok' && entradas > 1

  function tituloOk(): string {
    return reentrada ? `Reentrada registrada` : 'Entrada registrada'
  }

  return (
    <div className="mt-6">
      {/* Câmera */}
      <div className={resultado ? 'hidden' : 'block'}>
        <div className="overflow-hidden rounded-3xl border border-line bg-black shadow-card">
          <div id="reader" className="w-full [&_video]:!w-full [&_video]:!rounded-none" />
        </div>
        {escaneando && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-ink/60">
            <ScanLine size={16} className="text-brand" /> Aponte para o QR Code do ingresso
          </p>
        )}
        {erroCamera && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            <Camera size={20} className="mx-auto mb-2" />
            {erroCamera}
            <button
              onClick={() => void iniciar()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 font-semibold text-on-dark"
            >
              <RotateCcw size={15} /> Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultado && vis && (
        <div className="animate-scale-in">
          <div className={`flex flex-col items-center rounded-3xl p-8 text-center shadow-card ${vis.classe}`}>
            <vis.Icon size={72} className={vis.icone} strokeWidth={2} />
            <h2 className="mt-4 text-2xl font-extrabold">
              {resultado.tipo === 'ok' && tituloOk()}
              {resultado.tipo === 'duplicado' && 'Entrada já registrada'}
              {resultado.tipo === 'invalido' && 'Ingresso inválido'}
              {resultado.tipo === 'nao_encontrado' && 'Não encontrado'}
              {resultado.tipo === 'erro' && 'Erro'}
            </h2>
            {resultado.nome && <p className="mt-2 text-xl font-bold">{resultado.nome}</p>}

            {resultado.tipo === 'ok' && (
              <>
                {resultado.hora && (
                  <p className="mt-1 text-sm font-semibold opacity-90">Registrada às {resultado.hora}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold">
                  <LogIn size={15} />
                  {entradas === 1 ? '1ª entrada' : `${entradas}ª entrada`}
                </span>
                {reentrada && resultado.horaAnterior && (
                  <p className="mt-2 text-xs opacity-80">Entrada anterior às {resultado.horaAnterior}</p>
                )}
              </>
            )}

            {resultado.tipo === 'duplicado' && (
              <>
                <p className="mt-1 text-sm font-semibold opacity-90">
                  Leitura repetida — registrada há instantes ({resultado.hora}).
                </p>
                {entradas > 0 && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold">
                    <LogIn size={15} /> {entradas} entrada(s) no total
                  </span>
                )}
              </>
            )}

            {resultado.mensagem && resultado.tipo !== 'duplicado' && (
              <p className="mt-1 text-sm opacity-90">{resultado.mensagem}</p>
            )}
          </div>

          <button
            onClick={() => void iniciar()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-lg font-bold uppercase tracking-wide text-brand shadow-card transition hover:bg-accent-hover hover:text-on-dark"
          >
            <ScanLine size={20} /> Escanear próximo
          </button>
        </div>
      )}
    </div>
  )
}
