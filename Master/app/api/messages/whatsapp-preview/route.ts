import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { renderMessageTemplate } from '@/modules/communications/render-message-template'

/**
 * Get rendered message for WhatsApp (resume send).
 * Creates resume link, returns message and phone - does not send.
 */
export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const { clientId, templateId, resumeDraftId } = body

    if (!clientId || !templateId) {
      return NextResponse.json({ error: 'clientId and templateId are required' }, { status: 400 })
    }

    const client = await db.client.findUnique({
      where: { id: clientId },
      select: { firstName: true, lastName: true, phone: true },
    })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    if (!client.phone) return NextResponse.json({ error: 'Client does not have a phone number' }, { status: 400 })

    const template = await db.messageTemplate.findUnique({ where: { id: templateId } })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '').replace(/\/$/, '') || 'https://careeristpro.cloud'
    let resumeViewUrl = ''
    let resumeDraft: { id: string; clientId: string | null; template: string | null; atsScore: number | null } | null = null

    if (resumeDraftId) {
      resumeDraft = await db.resumeDraft.findUnique({
        where: { id: resumeDraftId },
        select: { id: true, clientId: true, template: true, atsScore: true },
      })
      if (resumeDraft && resumeDraft.clientId === clientId) {
        const token = randomUUID()
        resumeViewUrl = `${baseUrl}/public/resume/${token}`
        await (db as any).resumeLink.create({
          data: { token, resumeDraftId: resumeDraft.id, clientId },
        })
      }
    }

    const fullName = `${client.firstName} ${client.lastName}`.trim()
    const variables: Record<string, unknown> = {
      firstName: client.firstName,
      lastName: client.lastName,
      fullName,
      clientName: fullName,
      resumeViewUrl,
      atsScore: resumeDraft?.atsScore ?? 'N/A',
      templateName: resumeDraft?.template || 'Tailored Resume',
    }

    let message = template.content
    if (resumeViewUrl && !message.includes('{{resumeViewUrl}}')) {
      message += `\n\nView and download your resume: ${resumeViewUrl}`
    }
    message = renderMessageTemplate(message, variables)

    return NextResponse.json({ message, phone: client.phone })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get preview'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
