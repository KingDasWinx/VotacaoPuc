import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeName } from '@/lib/normalize'
import { candidatosRatelimit, getClientIp } from '@/lib/ratelimit'

const CANDIDATO_SECRET = process.env.CANDIDATO_SECRET!
const MAX_CANDIDATOS = 20

export async function GET() {
  const { data, error } = await supabase
    .from('candidatos')
    .select('id, nome, frase, foto_url, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIp(request)
  const { success } = await candidatosRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Secret check
  const secret = request.nextUrl.searchParams.get('secret')
  if (!secret || secret !== CANDIDATO_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { nome, frase, foto_url } = body

  if (!nome || !frase || !foto_url) {
    return NextResponse.json({ error: 'Missing required fields: nome, frase, foto_url' }, { status: 400 })
  }

  if (frase.length > 80) {
    return NextResponse.json({ error: 'frase must be 80 characters or less' }, { status: 400 })
  }

  const nomeNorm = normalizeName(nome)

  // Check max candidates
  const { count } = await supabase
    .from('candidatos')
    .select('id', { count: 'exact', head: true })

  if ((count ?? 0) >= MAX_CANDIDATOS) {
    return NextResponse.json({ error: 'Maximum number of candidates reached' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('candidatos')
    .insert({ nome: nomeNorm, frase, foto_url })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A candidate with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
