'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Candidato } from '@/types'

interface ConfirmModalProps {
  candidato: Candidato
  onConfirm: (nomeVotante: string, cpf: string) => Promise<void>
  onCancel: () => void
  loading: boolean
  error: string | null
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function isValidCpf(cpf: string) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

export default function ConfirmModal({ candidato, onConfirm, onCancel, loading, error }: ConfirmModalProps) {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')

  const cpfValido = isValidCpf(cpf)
  const canSubmit = nome.trim().length >= 2 && cpfValido

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end z-50">
      <div className="bg-white rounded-t-[20px] w-full max-w-[430px] mx-auto px-6 pt-6 pb-10 animate-slide-up">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <div className="flex items-center gap-3.5 bg-pink-50 rounded p-3.5 mb-6 border-l-4 border-puc-bordeaux">
          <div className="relative w-14 h-14 rounded-full bg-puc-bordeaux flex-shrink-0 overflow-hidden">
            <Image src={candidato.foto_url} alt={candidato.nome} fill className="object-cover" sizes="56px" />
          </div>
          <div>
            <p className="text-base font-extrabold text-gray-900 uppercase tracking-wide capitalize">{candidato.nome}</p>
            <p className="text-xs text-gray-500 italic mt-0.5">"{candidato.frase}"</p>
          </div>
        </div>
        <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-1.5">Confirmar<br />Voto</h2>
        <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
          Informe seus dados para registrar o voto. Este registro é único e não poderá ser alterado.
        </p>

        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Seu nome completo</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: João da Silva"
          className="w-full border-2 border-gray-200 rounded-md px-4 py-3.5 text-[15px] font-medium text-gray-900 outline-none focus:border-puc-bordeaux transition-colors mb-4"
          disabled={loading}
        />

        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">CPF</label>
        <input
          type="text"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          placeholder="000.000.000-00"
          className={`w-full border-2 rounded-md px-4 py-3.5 text-[15px] font-medium text-gray-900 outline-none transition-colors mb-1 ${
            cpf.length > 0 && !cpfValido ? 'border-puc-red' : cpfValido ? 'border-green-400' : 'border-gray-200 focus:border-puc-bordeaux'
          }`}
          disabled={loading}
        />
        {cpf.length > 0 && !cpfValido && (
          <p className="text-puc-red text-[11px] font-semibold mb-1">CPF inválido</p>
        )}

        {error && <p className="text-puc-red text-xs font-semibold mb-3 mt-2">{error}</p>}

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            onClick={() => onConfirm(nome, cpf.replace(/\D/g, ''))}
            disabled={loading || !canSubmit}
            className="w-full bg-puc-bordeaux text-white rounded-full py-4 text-[14px] font-extrabold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Confirmar meu voto'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full border-2 border-puc-bordeaux text-puc-bordeaux rounded-full py-3.5 text-[13px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            ← Voltar e trocar candidato
          </button>
        </div>
      </div>
    </div>
  )
}
