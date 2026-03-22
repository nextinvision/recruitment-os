import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { importClients } from '@/modules/clients/service'
import { importClientsBodySchema } from '@/modules/clients/schemas'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader =
      request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const validated = importClientsBodySchema.parse(body)
    const assignedUserId = validated.assignedUserId ?? authContext.userId

    const result = await importClients(validated.clients, assignedUserId)

    for (const client of result.created) {
      await logMutation({
        request,
        userId: authContext.userId,
        action: 'CREATE',
        entity: 'Client',
        entityId: client.id,
        entityName: `${client.firstName} ${client.lastName}`,
        newData: client,
        metadata: { clientId: client.id, source: 'import' },
      }).catch((err) => {
        console.error('Failed to log mutation:', err)
      })
    }

    const response = NextResponse.json(
      { created: result.created.length, errors: result.errors, clients: result.created },
      { status: 200 }
    )
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}
