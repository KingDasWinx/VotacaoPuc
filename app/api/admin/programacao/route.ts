import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'
import { PROGRAMACAO_TIPOS } from '@/lib/types'

function guard(request: NextRequest) {
  return isRequestAdmin(request)
}

function parseItem(body: Record<string, unknown>) {
  const dia = typeof body.dia === 'string' ? body.dia : ''
  const hora_inicio = typeof body.hora_inicio === 'string' ? body.hora_inicio : ''
  const hora_fim = typeof body.hora_fim === 'string' && body.hora_fim ? body.hora_fim : null
  const titulo = typeof body.titulo === 'string' ? body.titulo.trim() : ''
  const palestrante = typeof body.palestrante === 'string' ? body.palestrante.trim() || null : null
  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() || null : null
  const local_sala = typeof body.local_sala === 'string' ? body.local_sala.trim() || null : null
  const tipo = typeof body.tipo === 'string' ? body.tipo : 'palestra'
  const ordem = Number(body.ordem)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return { error: 'Data inválida' as const }
  if (!/^\d{2}:\d{2}/.test(hora_inicio)) return { error: 'Hora de início inválida' as const }
  if (hora_fim && !/^\d{2}:\d{2}/.test(hora_fim)) return { error: 'Hora de fim inválida' as const }
  if (titulo.length < 2) return { error: 'Título obrigatório' as const }
  if (!PROGRAMACAO_TIPOS.includes(tipo as (typeof PROGRAMACAO_TIPOS)[number])) {
    return { error: 'Tipo inválido' as const }
  }

  return {
    value: {
      dia,
      hora_inicio: hora_inicio.slice(0, 5),
      hora_fim: hora_fim ? hora_fim.slice(0, 5) : null,
      titulo,
      palestrante,
      descricao,
      local_sala,
      tipo,
      ordem: Number.isFinite(ordem) ? ordem : 0,
    },
  }
}

export async function GET(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { data, error } = await supabase
    .from('programacao')
    .select('*')
    .order('dia')
    .order('ordem')
    .order('hora_inicio')
  if (error) return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 })
  return NextResponse.json({ itens: data })
}

export async function POST(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const parsed = parseItem(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { data, error } = await supabase.from('programacao').insert(parsed.value).select().single()
  if (error) return NextResponse.json({ error: 'Erro ao criar' }, { status: 500 })
  return NextResponse.json({ item: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const parsed = parseItem(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { error } = await supabase.from('programacao').update(parsed.value).eq('id', id)
  if (error) return NextResponse.json({ error: 'Erro ao editar' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  if (!guard(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await supabase.from('programacao').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
