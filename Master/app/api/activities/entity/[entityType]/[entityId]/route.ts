import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getActivities } from '@/modules/activities/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

/**
 * Get activities for a specific entity (Lead, Client, etc.)
 * Returns timeline-style activity feed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { entityType, entityId } = await params

    // Map entity type to filter
    const filters: any = {}
    if (entityType.toLowerCase() === 'lead') {
      filters.leadId = entityId
    } else if (entityType.toLowerCase() === 'client') {
      filters.clientId = entityId
    } else {
      const response = NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const activities = await getActivities(authContext.userId, authContext.role, filters)

    const response = NextResponse.json(activities, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activities'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

