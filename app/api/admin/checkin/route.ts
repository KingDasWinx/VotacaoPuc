import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  if (!isRequestAdmin(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const idRaw = (body as { ingressoId?: unknown }).ingressoId
  const id = typeof idRaw === 'string' ? idRaw.trim() : ''
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ resultado: 'invalido', mensagem: 'QR Code não reconhecido' })
  }

  const { data: ing } = await supabase
    .from('ingressos')
    .select('id, nome, status, checkin_em, pedidos!inner(codigo, status)')
    .eq('id', id)
    .maybeSingle()

  if (!ing) {
    return NextResponse.json({ resultado: 'nao_encontrado', mensagem: 'Ingresso não encontrado' })
  }

  const pedido = (Array.isArray(ing.pedidos) ? ing.pedidos[0] : ing.pedidos) as
    | { codigo: string; status: string }
    | undefined

  if (ing.status === 'cancelado' || pedido?.status !== 'pago') {
    return NextResponse.json({
      resultado: 'invalido',
      nome: ing.nome,
      mensagem: ing.status === 'cancelado' ? 'Ingresso cancelado' : 'Pagamento não confirmado',
    })
  }

  if (ing.checkin_em) {
    return NextResponse.json({ resultado: 'ja_usado', nome: ing.nome, checkin_em: ing.checkin_em })
  }

  // Check-in atômico: só grava se ainda estiver null (evita corrida em scans simultâneos).
  const agora = new Date().toISOString()
  const { data: updated } = await supabase
    .from('ingressos')
    .update({ checkin_em: agora })
    .eq('id', id)
    .is('checkin_em', null)
    .select('id')

  if (!updated || updated.length === 0) {
    const { data: again } = await supabase
      .from('ingressos')
      .select('checkin_em')
      .eq('id', id)
      .maybeSingle()
    return NextResponse.json({ resultado: 'ja_usado', nome: ing.nome, checkin_em: again?.checkin_em ?? agora })
  }

  return NextResponse.json({ resultado: 'ok', nome: ing.nome, checkin_em: agora, codigo: pedido.codigo })
}
