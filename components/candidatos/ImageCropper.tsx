'use client'

import { useRef, useState, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

// Card proportions: 90×110 → 9:11
const ASPECT = 9 / 11
const OUTPUT_W = 360
const OUTPUT_H = Math.round(OUTPUT_W / ASPECT) // 440

interface ImageCropperProps {
  src: string
  onCrop: (blob: Blob) => void
  onCancel: () => void
}

export default function ImageCropper({ src, onCrop, onCancel }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, ASPECT, w, h),
      w, h,
    )
    setCrop(initial)
  }, [])

  const handleUse = () => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas || !completedCrop) return

    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height

    canvas.width = OUTPUT_W
    canvas.height = OUTPUT_H

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      OUTPUT_W, OUTPUT_H,
    )

    canvas.toBlob((blob) => { if (blob) onCrop(blob) }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 flex-shrink-0" style={{ height: 56 }}>
        <button
          onClick={onCancel}
          className="text-white/60 text-[13px] font-bold uppercase tracking-widest px-2 py-2"
        >
          Cancelar
        </button>
        <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest">Ajuste a foto</p>
        <button
          onClick={handleUse}
          disabled={!completedCrop}
          className="bg-puc-bordeaux text-white text-[13px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-full disabled:opacity-40"
        >
          Usar
        </button>
      </div>

      {/* Crop area */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={ASPECT}
          minWidth={80}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="crop"
            onLoad={onImageLoad}
            style={{ maxHeight: 'calc(100vh - 120px)', maxWidth: '100%', display: 'block' }}
          />
        </ReactCrop>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
