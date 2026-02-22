import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthContext } from './lib/rbac'
import { getApplicableRoles, PAGE_ACCESS_DEFAULTS } from './lib/page-access'
import type { PageAccessRules } from './lib/page-access'

const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/api/auth/login']
const CACHE_TTL_MS = 60_000

let pageRulesCache: { rules: PageAccessRules; ts: number } = {
  rules: PAGE_ACCESS_DEFAULTS,
  ts: 0,
}

async function getPageRules(origin: string): Promise<PageAccessRules> {
  if (Date.now() - pageRulesCache.ts < CACHE_TTL_MS) {
    return pageRulesCache.rules
  }
  try {
    const res = await fetch(`${origin}/api/access/page-rules`, {
      headers: { 'Accept': 'application/json' },
    })
    if (res.ok) {
      const data = await res.json()
      const rules = (data.rules ?? PAGE_ACCESS_DEFAULTS) as PageAccessRules
      pageRulesCache = { rules, ts: Date.now() }
      return rules
    }
  } catch {
    // use existing cache or defaults
  }
  return pageRulesCache.rules
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/') {
    const cookieToken = request.cookies.get('token')?.value
    const authHeader =
      request.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : null)
    try {
      const authContext = await getAuthContext(authHeader)
      if (authContext) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/login', request.url))
    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const cookieToken = request.cookies.get('token')?.value
  const authHeader =
    request.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : null)

  try {
    const authContext = await getAuthContext(authHeader)

    if (!authContext) {
      if (!pathname.startsWith('/login')) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      return NextResponse.next()
    }

    if (pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const rules = await getPageRules(request.nextUrl.origin)
    const allowedRoles = getApplicableRoles(pathname, rules)
    if (allowedRoles.length > 0 && !allowedRoles.includes(authContext.role)) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to access this page.' },
        { status: 403 }
      )
    }

    const response = NextResponse.next()
    response.headers.set('x-user-id', authContext.userId)
    response.headers.set('x-user-role', authContext.role)
    return response
  } catch {
    if (!pathname.startsWith('/login')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

