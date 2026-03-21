'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import ImageCropper from './ImageCropper'

interface PhotoUploadProps {
  onUpload: (url: string) => void
  disabled: boolean
}

export default function PhotoUpload({ onUpload, disabled }: PhotoUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [rawSrc, setRawSrc] = useState<string | null>(null)   // before crop
  const [preview, setPreview] = useState<string | null>(null) // after crop
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => setRawSrc(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleCrop(blob: Blob) {
    setRawSrc(null)
    const objectUrl = URL.createObjectURL(blob)
    setPreview(objectUrl)
    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', blob, 'foto.jpg')
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
      {/* Cropper overlay */}
      {rawSrc && (
        <ImageCropper
          src={rawSrc}
          onCrop={handleCrop}
          onCancel={() => setRawSrc(null)}
        />
      )}

      {/* Hidden inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />

      {preview ? (
        /* Preview + change button */
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0 bg-puc-bordeaux">
            <Image src={preview} alt="Foto" fill className="object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-gray-800 mb-2">{uploading ? 'Enviando...' : 'Foto adicionada'}</p>
            {!uploading && (
              <div className="flex gap-2">
                <button type="button" disabled={disabled}
                  onClick={() => cameraRef.current?.click()}
                  className="text-[11px] font-bold uppercase tracking-wide text-puc-bordeaux border border-puc-bordeaux rounded-full px-3 py-1 disabled:opacity-40">
                  Câmera
                </button>
                <button type="button" disabled={disabled}
                  onClick={() => galleryRef.current?.click()}
                  className="text-[11px] font-bold uppercase tracking-wide text-puc-bordeaux border border-puc-bordeaux rounded-full px-3 py-1 disabled:opacity-40">
                  Galeria
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Initial state — two buttons */
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={disabled}
            className="h-36 bg-pink-50 border-2 border-dashed border-puc-bordeaux rounded flex flex-col items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-puc-bordeaux"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/></svg>
            <span className="text-puc-bordeaux text-[12px] font-bold uppercase tracking-wide">Tirar foto</span>
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={disabled}
            className="h-36 bg-pink-50 border-2 border-dashed border-puc-bordeaux rounded flex flex-col items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-puc-bordeaux"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span className="text-puc-bordeaux text-[12px] font-bold uppercase tracking-wide">Da galeria</span>
          </button>
        </div>
      )}

      {error && <p className="text-puc-red text-xs font-semibold mt-2">{error}</p>}
    </div>
  )
}
