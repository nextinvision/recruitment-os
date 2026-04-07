import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'
import { buildReportEmailVariables, type ClientMetricsSnapshot } from '@/modules/communications/report-email-variables'
import { renderMessageTemplate } from '@/modules/communications/render-message-template'

/**
 * Get rendered message for WhatsApp (report notification).
 * Returns message and phone - does not send.
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

    const { id: clientId } = await params
    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    requireAuth(await getAuthContext(authHeader))

    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
    }

    const [client, snapshot, template] = await Promise.all([
      db.client.findUnique({
        where: { id: clientId },
        select: { firstName: true, lastName: true, phone: true, email: true },
      }),
      db.reportSnapshot.findUnique({
        where: { clientId },
        select: { token: true, data: true },
      }),
      db.messageTemplate.findUnique({
        where: { id: templateId },
      }),
    ])

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    if (!client.phone) return NextResponse.json({ error: 'Client does not have a phone number' }, { status: 400 })
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    if (!snapshot) return NextResponse.json({ error: 'Report snapshot not found. Update the report first.' }, { status: 400 })

    const data = snapshot.data as ClientMetricsSnapshot
    const variables = buildReportEmailVariables({
      request,
      client: {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
      },
      snapshotToken: snapshot.token,
      metrics: {
        funnelPerformance: data?.funnelPerformance ?? [],
        activityDistribution: data?.activityDistribution ?? [],
        referralsSentCount: data?.referralsSentCount ?? null,
        connectionRequestsSentCount: data?.connectionRequestsSentCount ?? null,
        applicationPipelineLog: data?.applicationPipelineLog ?? [],
        reportOutreachCustomFields: data?.reportOutreachCustomFields ?? [],
      },
    })

    const message = renderMessageTemplate(template.content, variables)

    return NextResponse.json({ message, phone: client.phone })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to get preview'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
