import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { messageService } from '@/modules/communications/message.service'
import { sendMessageSchema } from '@/modules/communications/schemas'
import { addCorsHeaders, handleCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const validated = sendMessageSchema.parse(body)

    const messageId = await messageService.sendMessage({
      ...validated,
      sentBy: authContext.userId,
    })

    const response = NextResponse.json({ messageId }, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send message'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    const searchParams = request.nextUrl.searchParams
    const recipientType = searchParams.get('recipientType')
    const recipientId = searchParams.get('recipientId')

    // If no recipient filters, return all messages (for admin view)
    if (!recipientType || !recipientId) {
      const filters: any = {}
      if (searchParams.get('channel')) filters.channel = searchParams.get('channel')
      if (searchParams.get('status')) filters.status = searchParams.get('status')
      if (searchParams.get('recipientType')) filters.recipientType = searchParams.get('recipientType')
      if (searchParams.get('limit')) filters.limit = parseInt(searchParams.get('limit') || '100')

      const messages = await messageService.getAllMessages(filters)
      const response = NextResponse.json(messages, { status: 200 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const messages = await messageService.getMessageHistory(recipientType, recipientId)

    const response = NextResponse.json(messages, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch messages'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

