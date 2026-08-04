import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'
import { isCategoriaInscricao } from '@/lib/types'

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
  const categoria = (body as { categoria?: unknown }).categoria
  if (!isCategoriaInscricao(categoria)) {
    return NextResponse.json({ error: 'Categoria inválida' }, { status: 400 })
  }
  const { error } = await supabase.from('ingressos').update({ categoria }).eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: 'Falha ao atualizar categoria' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
