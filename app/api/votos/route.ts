import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeName } from '@/lib/normalize'
import { votosRatelimit, getClientIp } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIp(request)
  const { success } = await votosRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Check voting window
  const { data: config, error: configError } = await supabase
    .from('config')
    .select('votacao_inicio, votacao_fim')
    .eq('id', 1)
    .single()

  if (configError || !config) {
    return NextResponse.json({ error: 'Voting configuration not found' }, { status: 500 })
  }

  const now = new Date()
  const inicio = new Date(config.votacao_inicio)
  const fim = config.votacao_fim ? new Date(config.votacao_fim) : null

  if (now < inicio) {
    return NextResponse.json({ error: 'Voting has not started yet' }, { status: 403 })
  }

  if (fim && now > fim) {
    return NextResponse.json({ error: 'Voting has ended' }, { status: 403 })
  }

  const body = await request.json()
  const { candidato_id, nome_votante } = body

  if (!candidato_id || !nome_votante) {
    return NextResponse.json({ error: 'Missing required fields: candidato_id, nome_votante' }, { status: 400 })
  }

  const nomeNorm = normalizeName(nome_votante)

  if (nomeNorm.length < 2) {
    return NextResponse.json({ error: 'nome_votante is too short' }, { status: 400 })
  }

  // Verify candidate exists
  const { data: candidato } = await supabase
    .from('candidatos')
    .select('id')
    .eq('id', candidato_id)
    .single()

  if (!candidato) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('votos')
    .insert({ candidato_id, nome_votante: nomeNorm })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You have already voted' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to register vote' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
