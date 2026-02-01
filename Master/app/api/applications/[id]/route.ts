import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
} from '@/modules/applications/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
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

    const response = NextResponse.json(application, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch application'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
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
    const updatedApplication = await updateApplication({ id, ...body })

    const response = NextResponse.json(updatedApplication, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update application'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
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

    await deleteApplication(id)

    const response = NextResponse.json({ message: 'Application deleted successfully' }, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete application'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

