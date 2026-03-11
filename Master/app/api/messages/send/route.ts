import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { db } from '@/lib/db'
import { messageService } from '@/modules/communications/message.service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { MessageChannel } from '@prisma/client'

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
        const { channel, clientId, templateId, context } = body

        if (!clientId || !templateId) {
            throw new Error('Missing clientId or templateId')
        }

        // Fetch client
        const client = await db.client.findUnique({
            where: { id: clientId },
            select: { firstName: true, lastName: true, email: true }
        })

        if (!client || !client.email) {
            throw new Error('Client or client email not found')
        }

        // Fetch template
        const template = await db.messageTemplate.findUnique({
            where: { id: templateId }
        })

        if (!template) {
            throw new Error('Template not found')
        }

        // Fetch resume draft if ID is provided
        let resumeDraft = null
        if (context?.resumeDraftId) {
            resumeDraft = await db.resumeDraft.findUnique({
                where: { id: context.resumeDraftId }
            })
        }

        // Prepare variables for rendering
        const variables = {
            clientName: `${client.firstName} ${client.lastName}`,
            atsScore: context?.atsScore || resumeDraft?.atsScore || 'N/A',
            templateName: resumeDraft?.template || 'Tailored Resume',
            ...(context || {})
        }

        // Use messageService to send the message
        const messageId = await messageService.sendMessage({
            channel: channel as MessageChannel || MessageChannel.EMAIL,
            recipientType: 'client',
            recipientId: clientId,
            recipientEmail: client.email,
            templateId: templateId,
            subject: template.subject || 'Your Tailored Resume',
            content: template.content, // messageService will handle rendering if variables are passed
            variables,
            sentBy: authContext.userId,
        })

        const response = NextResponse.json({ success: true, messageId }, { status: 201 })
        const origin = request.headers.get('origin')
        return addCorsHeaders(response, origin)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send resume'
        console.error('API /api/messages/send error:', error)
        const response = NextResponse.json({ error: message }, { status: 400 })
        const origin = request.headers.get('origin')
        return addCorsHeaders(response, origin)
    }
}
