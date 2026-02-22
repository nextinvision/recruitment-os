import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { logApplicationAction, getApplicationTimeline } from '@/modules/applications/actions/service'
import { getApplicationById } from '@/modules/applications/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params

    // Verify application exists and user has access
    const application = await getApplicationById(id)
    if (!application) {
      const response = NextResponse.json({ error: 'Application not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Check access
    if (authContext.role !== 'ADMIN' && authContext.role !== 'MANAGER' && application.recruiterId !== authContext.userId) {
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const body = await request.json()
    const action = await logApplicationAction({
      ...body,
      applicationId: id,
      performedById: authContext.userId,
    })

    // Log the mutation
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'CREATE',
      entity: 'ApplicationAction',
      entityId: action.id,
      entityName: `Action: ${action.type} for Application ${id}`,
      newData: action,
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(action, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to log action'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params

    // Verify application exists and user has access
    const application = await getApplicationById(id)
    if (!application) {
      const response = NextResponse.json({ error: 'Application not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Check access
    if (authContext.role !== 'ADMIN' && authContext.role !== 'MANAGER' && application.recruiterId !== authContext.userId) {
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const timeline = await getApplicationTimeline(id)

    const response = NextResponse.json(timeline, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch timeline'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

