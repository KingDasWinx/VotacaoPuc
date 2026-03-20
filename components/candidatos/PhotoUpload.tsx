'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface PhotoUploadProps {
  onUpload: (url: string) => void
  disabled: boolean
}

export default function PhotoUpload({ onUpload, disabled }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erro no upload. Tente novamente.')
      setPreview(null)
      setUploading(false)
      return
    }
    const { url } = await res.json()
    onUpload(url)
    setUploading(false)
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="w-full h-44 bg-pink-50 border-2 border-dashed border-puc-bordeaux rounded flex flex-col items-center justify-center cursor-pointer disabled:opacity-50 relative overflow-hidden"
      >
        {preview ? (
          <Image src={preview} alt="Preview" fill className="object-cover" />
        ) : (
          <>
            <span className="text-4xl mb-2">{uploading ? '⏳' : '📷'}</span>
            <p className="text-puc-bordeaux text-[13px] font-bold uppercase tracking-wide">
              {uploading ? 'Enviando...' : 'Adicionar foto'}
            </p>
            <p className="text-gray-400 text-[11px] mt-1">Câmera ou galeria do celular</p>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-puc-red text-xs font-semibold mt-1.5">{error}</p>}
    </div>
  )
}
