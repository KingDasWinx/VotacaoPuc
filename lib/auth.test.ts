import { describe, it, expect } from 'vitest'
import { safeEqual, signSession, verifySession, SESSION_COOKIE } from '@/lib/auth'

describe('safeEqual', () => {
  it('true para iguais, false para diferentes', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
})

describe('session HMAC', () => {
  const secret = 'super-secret-value'

  it('assina e verifica um token válido', () => {
    const token = signSession(secret, Date.now())
    expect(verifySession(token, secret)).toBe(true)
  })

  it('rejeita token com secret errado', () => {
    const token = signSession(secret, Date.now())
    expect(verifySession(token, 'outro-secret')).toBe(false)
  })

  it('rejeita token adulterado', () => {
    const token = signSession(secret, Date.now())
    expect(verifySession(token + 'x', secret)).toBe(false)
    expect(verifySession('lixo', secret)).toBe(false)
  })

  it('rejeita token expirado', () => {
    const old = Date.now() - 1000 * 60 * 60 * 24 * 8 // 8 dias atrás
    const token = signSession(secret, old)
    expect(verifySession(token, secret, 1000 * 60 * 60 * 24 * 7)).toBe(false)
  })

  it('expõe o nome do cookie', () => {
    expect(SESSION_COOKIE).toBe('simp_admin')
  })
})
