'use client'

import { useState, useEffect, useCallback } from 'react'
import { Candidato, Config } from '@/types'
import BlockedScreen from './BlockedScreen'
import AlreadyVotedScreen from './AlreadyVotedScreen'
import CandidateList from './CandidateList'
import ConfirmModal from './ConfirmModal'
import SuccessScreen from './SuccessScreen'

type Screen = 'loading' | 'blocked' | 'ended' | 'already-voted' | 'voting' | 'confirming' | 'success'

const VOTED_KEY = 'pucpr_voted'
const POLL_INTERVAL = 15_000

function resolveScreen(config: Config): Exclude<Screen, 'loading' | 'confirming' | 'success'> {
  const now = new Date()
  const inicio = new Date(config.votacao_inicio)
  const fim = config.votacao_fim ? new Date(config.votacao_fim) : null

  if (now < inicio) return 'blocked'
  if (fim && now > fim) return 'ended'

  try {
    if (localStorage.getItem(VOTED_KEY)) return 'already-voted'
  } catch { /* localStorage unavailable */ }

  return 'voting'
}

export default function VotingClient({ config: initialConfig, candidatos: initialCandidatos }: { config: Config; candidatos: Candidato[] }) {
  const [config, setConfig] = useState<Config>(initialConfig)
  const [candidatos, setCandidatos] = useState<Candidato[]>(initialCandidatos)
  const [screen, setScreen] = useState<Screen>('loading')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [voteLoading, setVoteLoading] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [configRes, candidatosRes] = await Promise.all([
        fetch('/api/config', { cache: 'no-store' }),
        fetch('/api/candidatos', { cache: 'no-store' }),
      ])
      if (configRes.ok) {
        const data = await configRes.json()
        setConfig(data)
      }
      if (candidatosRes.ok) {
        const data = await candidatosRes.json()
        setCandidatos(data)
      }
    } catch { /* silently ignore network errors */ }
  }, [])

  // Set initial screen from SSR data
  useEffect(() => {
    setScreen(resolveScreen(initialConfig))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update screen whenever config changes (from polling)
  useEffect(() => {
    setScreen((prev) => {
      // Don't override terminal states
      if (prev === 'success' || prev === 'already-voted' || prev === 'confirming') return prev
      return resolveScreen(config)
    })
  }, [config])

  // Poll every 15s
  useEffect(() => {
    const id = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  const selectedCandidato = candidatos.find((c) => c.id === selectedId) ?? null

  async function handleConfirmVote(nomeVotante: string) {
    if (!selectedId) return
    setVoteLoading(true)
    setVoteError(null)

    try {
      const res = await fetch('/api/votos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidato_id: selectedId, nome_votante: nomeVotante }),
      })

      if (res.status === 409) {
        setVoteError('Este nome já foi usado para votar. Caso tenha errado, entre em contato com o organizador.')
        setVoteLoading(false)
        return
      }
      if (res.status === 403) {
        const data = await res.json()
        setVoteError(data.error ?? 'A votação não está disponível no momento.')
        setVoteLoading(false)
        return
      }
      if (!res.ok) {
        setVoteError('Erro ao registrar voto. Tente novamente.')
        setVoteLoading(false)
        return
      }

      try { localStorage.setItem(VOTED_KEY, JSON.stringify({ voted: true, timestamp: Date.now() })) } catch { /* ok */ }
      setScreen('success')
    } catch {
      setVoteError('Erro de conexão. Verifique sua internet e tente novamente.')
      setVoteLoading(false)
    }
  }

  if (screen === 'loading') return null
  if (screen === 'blocked') return <BlockedScreen votacaoInicio={config.votacao_inicio} onOpen={() => setScreen('voting')} />
  if (screen === 'ended') return <BlockedScreen votacaoInicio={config.votacao_inicio} ended />
  if (screen === 'already-voted') return <AlreadyVotedScreen />
  if (screen === 'success') return <SuccessScreen />

  return (
    <>
      {/* Desktop: two-column layout */}
      <div className="md:flex md:min-h-[calc(100vh-88px)]">
        {/* Left column — hero (sticky sidebar on desktop) */}
        <div className="md:w-80 md:flex-shrink-0 md:sticky md:top-0 md:self-start">
          <div className="bg-puc-bordeaux px-5 pt-10 pb-8 md:min-h-screen md:px-10 md:pt-16 md:pb-16 relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#A50040] rounded-full opacity-50" />
            <p className="text-white/70 text-[10px] font-bold tracking-[3px] uppercase mb-2 relative z-10">Eleição de Liderança · 2026</p>
            <h1 className="text-white text-[32px] md:text-[40px] font-black uppercase leading-[1.05] mb-2 relative z-10">
              VOTE NO<br />SEU <span className="text-pink-300">LÍDER</span>
            </h1>
            <p className="text-white/80 text-sm font-medium relative z-10 mb-8">Selecione um candidato ao lado para confirmar seu voto.</p>

            {/* Desktop vote button inside sidebar */}
            <div className="hidden md:block relative z-10">
              <button
                disabled={!selectedId}
                onClick={() => setScreen('confirming')}
                className="w-full bg-white text-puc-bordeaux rounded-full py-4 text-[13px] font-extrabold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedId ? 'Confirmar voto →' : 'Selecione um candidato'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column — candidate list */}
        <div className="md:flex-1 md:overflow-y-auto pb-24 md:pb-8">
          <CandidateList candidatos={candidatos} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      {/* Mobile vote button (fixed bottom bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-xl px-5 py-3.5 z-40">
        <button
          disabled={!selectedId}
          onClick={() => setScreen('confirming')}
          className="w-full bg-puc-bordeaux text-white rounded-full py-4 text-[14px] font-extrabold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Votar neste candidato
        </button>
      </div>

      {screen === 'confirming' && selectedCandidato && (
        <ConfirmModal
          candidato={selectedCandidato}
          onConfirm={handleConfirmVote}
          onCancel={() => { setScreen('voting'); setVoteError(null) }}
          loading={voteLoading}
          error={voteError}
        />
      )}
    </>
  )
}
