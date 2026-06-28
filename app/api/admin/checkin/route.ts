import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Janela para ignorar leituras repetidas do mesmo QR (evita contar a mesma entrada 2x).
const DEDUP_MS = 12_000

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
    .select('id, nome, status, pedidos!inner(codigo, status)')
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

  // Entradas já registradas (mais recente primeiro).
  const { data: anteriores } = await supabase
    .from('checkins')
    .select('created_at')
    .eq('ingresso_id', id)
    .order('created_at', { ascending: false })
  const lista = anteriores ?? []
  const ultima = lista[0]?.created_at as string | undefined

  // Leitura repetida do mesmo QR em poucos segundos → não conta de novo.
  if (ultima && Date.now() - new Date(ultima).getTime() < DEDUP_MS) {
    return NextResponse.json({
      resultado: 'duplicado',
      nome: ing.nome,
      entradas: lista.length,
      registrada_em: ultima,
    })
  }

  const agoraIso = new Date().toISOString()
  const { error: insErr } = await supabase.from('checkins').insert({ ingresso_id: id })
  if (insErr) {
    return NextResponse.json({ resultado: 'erro', nome: ing.nome, mensagem: 'Erro ao registrar entrada' })
  }
  // Mantém checkin_em como "última entrada" (conveniência para listagens).
  await supabase.from('ingressos').update({ checkin_em: agoraIso }).eq('id', id)

  return NextResponse.json({
    resultado: 'ok',
    nome: ing.nome,
    codigo: pedido.codigo,
    entradas: lista.length + 1,
    registrada_em: agoraIso,
    entrada_anterior: ultima ?? null,
  })
}
