import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { createClientFromSubmission } from '@/modules/onboarding-forms/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const { submissionId } = await params
    const client = await createClientFromSubmission(submissionId, authContext.userId)

    await logMutation({
      request,
      userId: authContext.userId,
      action: 'CREATE',
      entity: 'Client',
      entityId: client.id,
      entityName: `${client.firstName} ${client.lastName}`,
      newData: client,
      metadata: { clientId: client.id, fromSubmission: submissionId },
    }).catch(() => {})

    const response = NextResponse.json(client, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create client'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}
