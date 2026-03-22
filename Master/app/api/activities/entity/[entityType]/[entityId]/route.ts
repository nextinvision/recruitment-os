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

    const result = await getActivities(
      authContext.userId,
      authContext.role,
      filters,
      undefined,
      { page: 1, pageSize: 500 }
    )

    // Sort for timeline: today's meetings first, then upcoming (soonest first), then past (most recent first)
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const sortedActivities = [...result.activities].sort((a, b) => {
      const dateA = new Date(a.occurredAt).getTime()
      const dateB = new Date(b.occurredAt).getTime()
      const aIsToday = dateA >= startOfToday.getTime() && dateA <= endOfToday.getTime()
      const bIsToday = dateB >= startOfToday.getTime() && dateB <= endOfToday.getTime()
      const aIsUpcoming = dateA > endOfToday.getTime()
      const bIsUpcoming = dateB > endOfToday.getTime()
      const aIsPast = dateA < startOfToday.getTime()
      const bIsPast = dateB < startOfToday.getTime()

      if (aIsToday && !bIsToday) return -1
      if (!aIsToday && bIsToday) return 1
      if (aIsToday && bIsToday) return dateA - dateB
      if (aIsUpcoming && bIsUpcoming) return dateA - dateB
      if (aIsUpcoming && !bIsUpcoming) return -1
      if (!aIsUpcoming && bIsUpcoming) return 1
      if (aIsPast && bIsPast) return dateB - dateA
      return 0
    })

    const response = NextResponse.json(
      { ...result, activities: sortedActivities },
      { status: 200 }
    )
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch activities'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

