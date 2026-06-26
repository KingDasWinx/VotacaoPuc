import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Upstash é opcional: só liga o rate limit se as env vars existirem.
const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

interface Limiter {
  limit: (id: string) => Promise<{ success: boolean }>
}

// ponytail: sem Upstash configurado, o limiter deixa tudo passar (no-op).
// Ceiling: em produção serverless (Vercel), rate limit real exige o Redis externo —
// um contador em memória não funciona entre instâncias. Configure UPSTASH_* para ativar.
function makeLimiter(tokens: number, window: Duration, prefix: string): Limiter {
  if (!redis) return { limit: async () => ({ success: true }) }
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window), prefix })
}

// 5 inscrições por minuto por IP
export const inscricaoRatelimit = makeLimiter(5, '1 m', 'rl:inscricao')

// 5 uploads de comprovante por minuto por IP
export const comprovanteRatelimit = makeLimiter(5, '1 m', 'rl:comprovante')

// 20 buscas "meus ingressos" por minuto por IP
export const lookupRatelimit = makeLimiter(20, '1 m', 'rl:lookup')

// 5 tentativas de login admin por minuto por IP
export const adminLoginRatelimit = makeLimiter(5, '1 m', 'rl:admin-login')

/**
 * Extracts client IP from Next.js request headers.
 * Falls back to 'anonymous' if not available.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'anonymous'
}
