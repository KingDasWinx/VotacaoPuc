import { NextRequest, NextResponse } from 'next/server'
import { safeEqual, signSession, SESSION_COOKIE } from '@/lib/auth'
import { adminLoginRatelimit, getClientIp } from '@/lib/ratelimit'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 dias

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await adminLoginRatelimit.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!adminPassword || !secret) {
    return NextResponse.json({ error: 'Servidor não configurado' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const password = (body as { password?: unknown }).password
  if (typeof password !== 'string' || !safeEqual(password, adminPassword)) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const token = signSession(secret)
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
  return res
}
