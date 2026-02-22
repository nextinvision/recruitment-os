import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getClientById, updateClient } from '@/modules/clients/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'
import { z } from 'zod'

const updateReverseRecruiterSchema = z.object({
  reverseRecruiterId: z.string().min(1, 'Reverse recruiter ID is required'),
})

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

    const { id } = await params
    const body = await request.json()
    const validated = updateReverseRecruiterSchema.parse(body)

    const oldClient = await getClientById(id)
    if (!oldClient) {
      const response = NextResponse.json({ error: 'Client not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const client = await updateClient({
      id,
      reverseRecruiterId: validated.reverseRecruiterId,
    })

    await logMutation({
      request,
      userId: authContext.userId,
      action: 'UPDATE',
      entity: 'Client',
      entityId: id,
      entityName: `${client.firstName} ${client.lastName}`,
      oldData: oldClient,
      newData: client,
      metadata: { clientId: id, action: 'UPDATE_REVERSE_RECRUITER' },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(client, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update reverse recruiter'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

