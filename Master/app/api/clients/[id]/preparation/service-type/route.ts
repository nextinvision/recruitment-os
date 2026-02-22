import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { getClientById, updateClient } from '@/modules/clients/service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'
import { z } from 'zod'
import { ServiceType } from '@prisma/client'

const updateServiceTypeSchema = z.object({
  serviceType: z.nativeEnum(ServiceType),
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
    const validated = updateServiceTypeSchema.parse(body)

    const oldClient = await getClientById(id)
    if (!oldClient) {
      const response = NextResponse.json({ error: 'Client not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const client = await updateClient({
      id,
      serviceType: validated.serviceType,
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
      metadata: { clientId: id, action: 'UPDATE_SERVICE_TYPE' },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(client, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update service type'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

