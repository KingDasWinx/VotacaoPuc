import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

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
  if (status !== 'valido' && status !== 'cancelado') {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }
  const { error } = await supabase.from('ingressos').update({ status }).eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: 'Falha ao atualizar ingresso' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
