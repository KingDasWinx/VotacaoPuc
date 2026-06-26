import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value)

  // Permite a tela de login e o endpoint de login sem cookie (evita chicken-and-egg)
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  if (!hasCookie) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (pathname.startsWith('/admin')) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
