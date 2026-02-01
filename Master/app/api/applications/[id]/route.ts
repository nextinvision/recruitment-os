import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, canAccessResource } from '@/lib/rbac'
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
} from '@/modules/applications/service'
import { createApiResponse, createApiError, handleApiRequest } from '@/lib/api-response'

export async function OPTIONS(request: NextRequest) {
  return handleApiRequest(request) || new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleApiRequest(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const application = await getApplicationById(id)

    if (!application) {
      return createApiError(request, 'Application not found', 404)
    }

    if (!canAccessResource(authContext, application.recruiterId)) {
      return createApiError(request, 'Forbidden', 403)
    }

    return createApiResponse(request, application, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch application'
    return createApiError(request, message, 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleApiRequest(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const application = await getApplicationById(id)

    if (!application) {
      return createApiError(request, 'Application not found', 404)
    }

    if (!canAccessResource(authContext, application.recruiterId)) {
      return createApiError(request, 'Forbidden', 403)
    }

    const body = await request.json()
    const updatedApplication = await updateApplication({ id, ...body })

    return createApiResponse(request, updatedApplication, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update application'
    return createApiError(request, message, 400)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleApiRequest(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization')
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { id } = await params
    const application = await getApplicationById(id)

    if (!application) {
      return createApiError(request, 'Application not found', 404)
    }

    if (!canAccessResource(authContext, application.recruiterId)) {
      return createApiError(request, 'Forbidden', 403)
    }

    await deleteApplication(id)

    return createApiResponse(request, { message: 'Application deleted successfully' }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete application'
    return createApiError(request, message, 500)
  }
}

