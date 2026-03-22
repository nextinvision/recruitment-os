import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { db } from '@/lib/db'
import { messageService } from '@/modules/communications/message.service'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { MessageChannel } from '@prisma/client'
import { randomUUID } from 'crypto'
import { buildEmailLinkAppendSection } from '@/modules/communications/email-appended-content'

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

        // Resolve public app URL once (env is reliable for emails; origin can be missing in some environments)
        const rawBase =
            process.env.NEXT_PUBLIC_APP_URL ||
            request.headers.get('origin') ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
        const baseUrl = (rawBase || 'https://careeristpro.cloud').replace(/\/$/, '')

        // Fetch resume draft if ID is provided; create a shareable link and add URL to email
        let resumeDraft = null
        let resumeViewUrl: string | null = null
        if (context?.resumeDraftId) {
            resumeDraft = await db.resumeDraft.findUnique({
                where: { id: context.resumeDraftId },
                select: { id: true, clientId: true, template: true, atsScore: true }
            })
            if (resumeDraft && resumeDraft.clientId === clientId) {
                const token = randomUUID()
                resumeViewUrl = `${baseUrl}/public/resume/${token}`
                await (db as any).resumeLink.create({
                    data: {
                        token,
                        resumeDraftId: resumeDraft.id,
                        clientId: clientId,
                    }
                })
            }
        }

        // Prepare variables — merge context first, then core client fields (so clientName always wins)
        const fullName = `${client.firstName} ${client.lastName}`.trim()
        const variables = {
            ...(context || {}),
            firstName: client.firstName,
            lastName: client.lastName,
            fullName,
            clientName: fullName,
            email: client.email || '',
            atsScore: context?.atsScore ?? resumeDraft?.atsScore ?? 'N/A',
            templateName: resumeDraft?.template || 'Tailored Resume',
            resumeViewUrl: resumeViewUrl || '',
        }

        const resolvedChannel = (channel as MessageChannel) || MessageChannel.EMAIL
        const appendedEmailHtml =
            resumeViewUrl && resolvedChannel === MessageChannel.EMAIL
                ? buildEmailLinkAppendSection({
                    url: resumeViewUrl,
                    heading: 'Your resume',
                    buttonLabel: 'View and respond',
                    intro: 'View and download your resume, and accept or reject it. This link is added automatically for every send.',
                  })
                : undefined

        // Use messageService to send the message
        const messageId = await messageService.sendMessage({
            channel: channel as MessageChannel || MessageChannel.EMAIL,
            recipientType: 'client',
            recipientId: clientId,
            recipientEmail: client.email,
            templateId: templateId,
            subject: template.subject || 'Your Tailored Resume',
            content: template.content,
            variables,
            ...(appendedEmailHtml ? { appendedEmailHtml } : {}),
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
