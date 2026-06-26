import { createHmac, timingSafeEqual } from 'crypto'

export const SESSION_COOKIE = 'simp_admin'
const DEFAULT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7 // 7 dias

/** Comparação de strings em tempo constante. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

function hmac(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data).digest('hex')
}

/** Cria um token de sessão "<issuedAtMs>.<hmac>". */
export function signSession(secret: string, issuedAtMs: number = Date.now()): string {
  const issued = String(issuedAtMs)
  return `${issued}.${hmac(secret, issued)}`
}

/** Verifica assinatura e validade do token. */
export function verifySession(
  token: string,
  secret: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): boolean {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [issued, sig] = parts
  const expected = hmac(secret, issued)
  if (!safeEqual(sig, expected)) return false
  const issuedMs = Number(issued)
  if (!Number.isFinite(issuedMs)) return false
  if (Date.now() - issuedMs > maxAgeMs) return false
  return true
}
