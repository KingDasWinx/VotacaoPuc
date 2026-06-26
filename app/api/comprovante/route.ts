import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { comprovanteRatelimit, getClientIp } from '@/lib/ratelimit'

const MAX_SIZE_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await comprovanteRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente em instantes.' }, { status: 429 })
  }

  const form = await request.formData()
  const codigo = form.get('codigo')
  const file = form.get('file') as File | null

  if (typeof codigo !== 'string' || !codigo) {
    return NextResponse.json({ error: 'Código do pedido ausente' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo inválido. Envie imagem ou PDF.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx. 8 MB)' }, { status: 400 })
  }

  // Pedido precisa existir e não estar cancelado
  const { data: pedido, error: pedidoErr } = await supabase
    .from('pedidos')
    .select('id, status')
    .eq('codigo', codigo)
    .single()
  if (pedidoErr || !pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }
  if (pedido.status === 'cancelado') {
    return NextResponse.json({ error: 'Pedido cancelado' }, { status: 409 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${codigo}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('comprovantes')
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (uploadErr) {
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 })
  }

  const { error: updateErr } = await supabase
    .from('pedidos')
    .update({ comprovante_path: path, metodo_comprovante: 'upload' })
    .eq('id', pedido.id)
  if (updateErr) {
    return NextResponse.json({ error: 'Falha ao anexar comprovante' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
