import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

const VALID = ['pendente', 'pago', 'cancelado'] as const

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const status = (body as { status?: unknown }).status
  const observacao = (body as { observacao?: unknown }).observacao
  if (typeof status !== 'string' || !VALID.includes(status as (typeof VALID)[number])) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const update: Record<string, unknown> = {
    status,
    pago_em: status === 'pago' ? new Date().toISOString() : null,
  }
  if (typeof observacao === 'string') update.observacao_admin = observacao

  const { error } = await supabase.from('pedidos').update(update).eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: 'Falha ao atualizar pedido' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
