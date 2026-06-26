import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeCpf, isValidCpf } from '@/lib/cpf'
import { lookupRatelimit, getClientIp } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await lookupRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente em instantes.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const cpfRaw = (body as { cpf?: unknown }).cpf
  const cpf = typeof cpfRaw === 'string' ? normalizeCpf(cpfRaw) : ''
  if (!isValidCpf(cpf)) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
  }

  // IDs de pedidos onde o CPF aparece em algum ingresso
  const { data: ingressoMatches } = await supabase
    .from('ingressos')
    .select('pedido_id')
    .eq('cpf', cpf)
  const pedidoIds = Array.from(new Set((ingressoMatches ?? []).map((r) => r.pedido_id)))

  // Pedidos do comprador OU com algum ingresso do CPF
  const orFilter = pedidoIds.length
    ? `comprador_cpf.eq.${cpf},id.in.(${pedidoIds.join(',')})`
    : `comprador_cpf.eq.${cpf}`

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select(
      'codigo, status, valor_total_centavos, quantidade, created_at, lotes(nome), ingressos(nome, status)'
    )
    .or(orFilter)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
  }

  const result = (pedidos ?? []).map((p) => {
    const loteRel = p.lotes as unknown as { nome: string } | { nome: string }[] | null
    const loteNome = Array.isArray(loteRel) ? loteRel[0]?.nome : loteRel?.nome
    return {
      codigo: p.codigo,
      status: p.status,
      valor_total_centavos: p.valor_total_centavos,
      quantidade: p.quantidade,
      lote_nome: loteNome ?? '',
      created_at: p.created_at,
      ingressos: p.ingressos as { nome: string; status: string }[],
    }
  })

  return NextResponse.json({ pedidos: result })
}
