import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { toggleRule } from '@/modules/rules/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { UserRole } from '@prisma/client'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    // Only Admin and Manager can toggle rules
    if (authContext.role !== UserRole.ADMIN && authContext.role !== UserRole.MANAGER) {
      const response = NextResponse.json({ error: 'Access denied. Admin or Manager role required.' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const { id } = await params
    const body = await request.json()
    const enabled = body.enabled === true

    const rule = await toggleRule(id, enabled)

    const response = NextResponse.json(rule, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle rule'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

