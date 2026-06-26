import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isRequestAdmin } from '@/lib/admin-guard'

const EDITABLE = [
  'nome', 'subtitulo', 'data_inicio', 'data_fim', 'local', 'tags',
  'banner_url', 'pix_chave', 'pix_nome_recebedor', 'pix_cidade',
  'whatsapp_numero', 'capacidade', 'inscricoes_abertas',
] as const

export async function GET(request: NextRequest) {
  if (!isRequestAdmin(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { data, error } = await supabase.from('event_config').select('*').eq('id', 1).single()
  if (error) return NextResponse.json({ error: 'Erro ao ler config' }, { status: 500 })
  return NextResponse.json({ config: data })
}

export async function PATCH(request: NextRequest) {
  if (!isRequestAdmin(request)) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of EDITABLE) {
    if (key in body) {
      if (key === 'capacidade') {
        const n = Number(body[key])
        if (!Number.isInteger(n) || n < 0) {
          return NextResponse.json({ error: 'Capacidade inválida' }, { status: 400 })
        }
        update[key] = n
      } else if (key === 'inscricoes_abertas') {
        update[key] = Boolean(body[key])
      } else {
        update[key] = body[key]
      }
    }
  }
  const { error } = await supabase.from('event_config').update(update).eq('id', 1)
  if (error) return NextResponse.json({ error: 'Erro ao salvar config' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
