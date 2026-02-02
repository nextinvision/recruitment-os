import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getRules, createRule } from '@/modules/rules/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { UserRole } from '@prisma/client'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    // Only Admin and Manager can view rules
    if (authContext.role !== UserRole.ADMIN && authContext.role !== UserRole.MANAGER) {
      const response = NextResponse.json({ error: 'Access denied. Admin or Manager role required.' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const searchParams = request.nextUrl.searchParams
    const filters: any = {}

    if (searchParams.get('entity')) {
      filters.entity = searchParams.get('entity')
    }

    if (searchParams.get('enabled') !== null) {
      filters.enabled = searchParams.get('enabled') === 'true'
    }

    const rules = await getRules(filters)

    const response = NextResponse.json(rules, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rules'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    // Only Admin can create rules
    if (authContext.role !== UserRole.ADMIN) {
      const response = NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const body = await request.json()
    const rule = await createRule({
      ...body,
      createdBy: authContext.userId,
    })

    const response = NextResponse.json(rule, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create rule'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

