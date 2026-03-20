import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadRatelimit, getClientIp } from '@/lib/ratelimit'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIp(request)
  const { success } = await uploadRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Must be an image (JPEG, PNG, WebP, GIF).' },
      { status: 400 }
    )
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 5 MB.' },
      { status: 400 }
    )
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('candidatos-fotos')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from('candidatos-fotos')
    .getPublicUrl(filename)

  return NextResponse.json({ url: urlData.publicUrl })
}
