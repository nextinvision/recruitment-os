import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'
import { getTemplateById } from '@/modules/communications/template.service'
import { renderMessageTemplate } from '@/modules/communications/render-message-template'

/**
 * Get rendered message for WhatsApp (onboarding form).
 * Does not send - returns message and phone for client to open wa.me
 */
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
    requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const { formId, templateId } = body

    if (!formId || !templateId) {
      return NextResponse.json({ error: 'formId and templateId are required' }, { status: 400 })
    }

    const lead = await db.lead.findUnique({ where: { id: leadId } })
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    if (!lead.phone) return NextResponse.json({ error: 'Lead does not have a phone number' }, { status: 400 })

    const template = await getTemplateById(templateId)
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
    const formLink = `${origin}/onboarding/${formId}?leadId=${leadId}`

    const fullName = `${lead.firstName} ${lead.lastName}`.trim()
    const variables: Record<string, unknown> = {
      firstName: lead.firstName,
      lastName: lead.lastName,
      fullName,
      clientName: fullName,
      email: lead.email || '',
      onboardingLink: formLink,
      formLink,
    }

    const message = renderMessageTemplate(template.content, variables)

    return NextResponse.json({ message, phone: lead.phone })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get preview'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
