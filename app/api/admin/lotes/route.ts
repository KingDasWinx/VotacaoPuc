import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

function guard(request: NextRequest) {
  return isRequestAdmin(request)
}

export async function GET(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { data, error } = await supabase
    .from('lotes')
    .select('id, nome, preco_centavos, data_inicio, data_fim, ativo, created_at')
    .order('data_inicio', { ascending: true })
  if (error) return NextResponse.json({ error: 'Erro ao listar lotes' }, { status: 500 })
  return NextResponse.json({ lotes: data })
}

function parseLote(body: Record<string, unknown>) {
  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  const preco = Number(body.preco_centavos)
  const dataInicio = typeof body.data_inicio === 'string' ? body.data_inicio : ''
  const dataFim = typeof body.data_fim === 'string' ? body.data_fim : ''
  if (nome.length < 2) return { error: 'Nome do lote inválido' as const }
  if (!Number.isInteger(preco) || preco < 0) return { error: 'Preço inválido (use centavos)' as const }
  if (!dataInicio || !dataFim) return { error: 'Datas obrigatórias' as const }
  if (new Date(dataFim).getTime() < new Date(dataInicio).getTime()) {
    return { error: 'Data fim antes da data início' as const }
  }
  return { value: { nome, preco_centavos: preco, data_inicio: dataInicio, data_fim: dataFim } }
}

export async function POST(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const parsed = parseLote(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { data, error } = await supabase.from('lotes').insert({ ...parsed.value, ativo: true }).select().single()
  if (error) return NextResponse.json({ error: 'Erro ao criar lote' }, { status: 500 })
  return NextResponse.json({ lote: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const parsed = parseLote(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const update: Record<string, unknown> = { ...parsed.value }
  if (typeof body.ativo === 'boolean') update.ativo = body.ativo
  const { error } = await supabase.from('lotes').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'Erro ao editar lote' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await supabase.from('lotes').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Lote tem pedidos vinculados. Desative em vez de excluir.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao excluir lote' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
