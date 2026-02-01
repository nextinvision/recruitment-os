import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthContext } from './lib/rbac'

// Routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/api/auth/login']

// Admin-only routes
const adminRoutes = ['/admin']

// Manager and Admin routes
const managerRoutes = ['/reports', '/analytics']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow API routes (they handle auth internally)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  // Priority: Authorization header > Cookie > null
  const cookieToken = request.cookies.get('token')?.value
  const authHeader = request.headers.get('authorization') || 
    (cookieToken ? `Bearer ${cookieToken}` : null)

  try {
    const authContext = await getAuthContext(authHeader)

    if (!authContext) {
      // Redirect to login if not authenticated
      // Only redirect if not already on login page to avoid redirect loops
      if (!pathname.startsWith('/login')) {
        const loginUrl = new URL('/login', request.url)
        // Add return URL as query param for redirect after login
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      // If already on login page and not authenticated, allow access
      return NextResponse.next()
    }

    // If authenticated and trying to access login page, redirect to dashboard
    if (pathname.startsWith('/login')) {
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // Check role-based access
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (authContext.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin role required.' },
          { status: 403 }
        )
      }
    }

    if (managerRoutes.some((route) => pathname.startsWith(route))) {
      if (authContext.role !== 'ADMIN' && authContext.role !== 'MANAGER') {
        return NextResponse.json(
          { error: 'Access denied. Manager or Admin role required.' },
          { status: 403 }
        )
      }
    }

    // Add user info to headers for use in pages
    const response = NextResponse.next()
    response.headers.set('x-user-id', authContext.userId)
    response.headers.set('x-user-role', authContext.role)

    return response
  } catch {
    // Redirect to login on auth error (only if not already on login page)
    if (!pathname.startsWith('/login')) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // If already on login page, allow access
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

