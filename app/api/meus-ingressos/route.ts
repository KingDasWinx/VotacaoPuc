import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

  const codigosRaw = (body as { codigos?: unknown }).codigos
  const codigos = Array.isArray(codigosRaw)
    ? codigosRaw.filter((c): c is string => typeof c === 'string').slice(0, 100)
    : []

  if (codigos.length === 0) {
    return NextResponse.json({ pedidos: [] })
  }

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select(
      'codigo, status, valor_total_centavos, quantidade, created_at, lotes(nome), ingressos(nome, status)'
    )
    .in('codigo', codigos)
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
