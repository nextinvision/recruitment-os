import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { db } from '@/lib/db'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Get token from cookie or Authorization header
    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)

    const authContext = requireAuth(await getAuthContext(authHeader))

    // Get full user data from database
    const user = await db.user.findUnique({
      where: { id: authContext.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    if (!user) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const response = NextResponse.json(user, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user'
    const response = NextResponse.json({ error: message }, { status: 401 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

