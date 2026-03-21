'use client'

import { useState } from 'react'
import PhotoUpload from './PhotoUpload'

interface RegisterClientProps {
  secret: string
}

export default function RegisterClient({ secret }: RegisterClientProps) {
  const [fotoUrl, setFotoUrl] = useState('')
  const [nome, setNome] = useState('')
  const [frase, setFrase] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (success) {
    return (
      <div className="p-4">
        <div className="bg-white rounded shadow-md overflow-hidden">
          <div className="bg-puc-bordeaux px-6 py-10 text-center">
            <div className="flex justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.123 2.123 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.123 2.123 0 0 0 1.597-1.16z"/></svg>
            </div>
            <h2 className="text-white text-2xl font-black uppercase tracking-wide mb-2">Cadastro Realizado!</h2>
            <p className="text-white/75 text-sm">Boa sorte na eleição!</p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-gray-500 text-sm leading-relaxed">
              <span className="capitalize font-bold text-puc-bordeaux">{nome}</span>, sua candidatura foi registrada com sucesso.<br /><br />
              Aguarde o período de votação para que seus colegas possam votar em você.
            </p>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fotoUrl) { setError('Por favor, adicione uma foto antes de continuar.'); return }
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/candidatos?secret=${encodeURIComponent(secret)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, frase, foto_url: fotoUrl }),
    })

    if (res.status === 409) {
      setError('Já existe um candidato com este nome. Verifique se você já se cadastrou.')
      setLoading(false)
      return
    }
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erro ao cadastrar. Tente novamente.')
      setLoading(false)
      return
    }
    setSuccess(true)
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-10">
      <div className="mb-5">
        <PhotoUpload onUpload={setFotoUrl} disabled={loading} />
      </div>
      <div className="mb-4">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Nome completo</label>
        <input
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como aparecerá na votação"
          className="w-full border-2 border-gray-200 rounded-md px-4 py-3.5 text-[15px] font-medium text-gray-900 outline-none focus:border-puc-bordeaux transition-colors"
          disabled={loading}
        />
      </div>
      <div className="mb-6">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Frase de campanha</label>
        <input
          type="text"
          required
          maxLength={80}
          value={frase}
          onChange={(e) => setFrase(e.target.value)}
          placeholder="Sua mensagem para os colegas"
          className="w-full border-2 border-gray-200 rounded-md px-4 py-3.5 text-[15px] font-medium text-gray-900 outline-none focus:border-puc-bordeaux transition-colors"
          disabled={loading}
        />
        <p className="text-right text-gray-400 text-[11px] mt-1">{frase.length} / 80</p>
      </div>
      {error && <p className="text-puc-red text-xs font-semibold mb-4">{error}</p>}
      <button
        type="submit"
        disabled={loading || !fotoUrl}
        className="w-full bg-puc-bordeaux text-white rounded-full py-4 text-[14px] font-extrabold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Cadastrando...' : 'Cadastrar candidatura →'}
      </button>
    </form>
  )
}
