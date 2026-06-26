'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

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
      <input
        type="password"
        className="w-full rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5 focus:bg-white"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && entrar()}
      />
      {erro && <p className="mt-3 text-sm text-red-700">{erro}</p>}
      <button
        onClick={entrar}
        disabled={enviando}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 font-bold uppercase text-brand transition hover:bg-accent-hover hover:text-on-dark disabled:opacity-60"
      >
        <LogIn size={18} />
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </div>
  )
}
