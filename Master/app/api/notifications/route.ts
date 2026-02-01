import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { notificationService } from '@/modules/notifications/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const notifications = await notificationService.getUserNotifications(
      authContext.userId,
      unreadOnly
    )

    const response = NextResponse.json(notifications, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

