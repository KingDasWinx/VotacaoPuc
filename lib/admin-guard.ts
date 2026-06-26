import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('Missing ADMIN_SESSION_SECRET env var')
  return secret
}

/** Verificação completa do cookie a partir de um NextRequest (route handlers). */
export function isRequestAdmin(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifySession(token, getSecret())
}

/** Verificação completa via cookies() — para Server Components. */
export function isCookieAdmin(): boolean {
  const token = cookies().get(SESSION_COOKIE)?.value
  if (!token) return false
  return verifySession(token, getSecret())
}
