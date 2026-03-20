import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('config')
    .select('votacao_inicio, votacao_fim')
    .eq('id', 1)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Config not found' }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=30',
    },
  })
}
