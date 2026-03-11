import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'
import { messageService } from '@/modules/communications/message.service'
import { getTemplateById } from '@/modules/communications/template.service'
import { MessageChannel } from '@prisma/client'

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

        const { id: leadId } = await params
        const authHeader = request.headers.get('authorization') ||
            (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
        const authContext = requireAuth(await getAuthContext(authHeader))

        const body = await request.json()
        const { formId, templateId } = body

        if (!formId || !templateId) {
            return NextResponse.json({ error: 'formId and templateId are required' }, { status: 400 })
        }

        // 1. Get Lead details
        const lead = await db.lead.findUnique({
            where: { id: leadId },
        })

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        if (!lead.email) {
            return NextResponse.json({ error: 'Lead does not have an email address' }, { status: 400 })
        }

        // 2. Get Template details
        const template = await getTemplateById(templateId)
        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        // 3. Prepare variables
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
        const formLink = `${origin}/onboarding/${formId}?leadId=${leadId}`
        const variables = {
            firstName: lead.firstName,
            lastName: lead.lastName,
            fullName: `${lead.firstName} ${lead.lastName}`,
            onboardingLink: formLink,
            formLink, // Alias
        }

        // 4. Send message via MessageService
        await messageService.sendMessage({
            templateId,
            channel: MessageChannel.EMAIL,
            recipientType: 'client', // Since lead is potential client
            recipientId: leadId,
            recipientEmail: lead.email,
            subject: template.subject || 'Onboarding Form',
            content: template.content,
            variables,
            sentBy: authContext.userId,
        })

        // 5. Update lead status to CONTACTED if it was NEW
        if (lead.status === 'NEW') {
            await db.lead.update({
                where: { id: leadId },
                data: { status: 'CONTACTED' },
            })
        }

        const response = NextResponse.json({ message: 'Onboarding form sent successfully' })
        return addCorsHeaders(response, request.headers.get('origin'))
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send onboarding form'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
