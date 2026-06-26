'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginClient() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar() {
    setErro('')
    setEnviando(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErro(data.error ?? 'Erro')
        setEnviando(false)
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setErro('Erro de conexão')
      setEnviando(false)
    }
  }

  return (
    <div className="mt-6">
      <input type="password" className="w-full rounded-lg border border-simp-mist px-3 py-2"
        placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && entrar()} />
      {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
      <button onClick={entrar} disabled={enviando}
        className="mt-4 w-full rounded-full bg-simp-teal py-3 font-bold uppercase text-white disabled:opacity-60">
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </div>
  )
}
