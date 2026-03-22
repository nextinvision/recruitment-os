import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getRevenues, createRevenue } from '@/modules/revenues/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

type RevenueStatus = 'PENDING' | 'PARTIAL' | 'PAID'

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

    const searchParams = request.nextUrl.searchParams

    if (searchParams.get('summary') === 'true') {
      const { getRevenueClientsSummary } = await import('@/modules/revenues/service')
      const summary = await getRevenueClientsSummary()
      const response = NextResponse.json(summary, { status: 200 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const filters: any = {}

    if (searchParams.get('leadId')) {
      filters.leadId = searchParams.get('leadId')
    }
    if (searchParams.get('clientId')) {
      filters.clientId = searchParams.get('clientId')
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as RevenueStatus
    }
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }

    const revenues = await getRevenues(authContext.userId, authContext.role, filters)

    const response = NextResponse.json(revenues, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch revenues'
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

    const body = await request.json()
    // Set assignedUserId from auth context if not provided
    if (!body.assignedUserId) {
      body.assignedUserId = authContext.userId
    }

    const revenue = await createRevenue(body)

    const response = NextResponse.json(revenue, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create revenue'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

