import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AnalyticsService } from '@/modules/analytics/service'
import { v4 as uuidv4 } from 'uuid'
import { getAuthContext, requireAuth } from '@/lib/rbac'
import { buildReportEmailVariables } from '@/modules/communications/report-email-variables'
import { buildEmailLinkAppendSection } from '@/modules/communications/email-appended-content'

// GET /api/clients/[id]/report-snapshot - Get existing snapshot metadata
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clientId } = await params

        const snapshot = await db.reportSnapshot.findUnique({
            where: { clientId }
        })

        return NextResponse.json(snapshot)
    } catch (error: any) {
        console.error('Error fetching report snapshot:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/clients/[id]/report-snapshot - Create or update snapshot
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clientId } = await params
        const body = await req.json().catch(() => ({}))
        const { templateId, sendEmail = false } = body

        const authHeader = req.headers.get('authorization') ||
            (req.cookies.get('token')?.value ? `Bearer ${req.cookies.get('token')?.value}` : null)
        const authContext = requireAuth(await getAuthContext(authHeader))
        const userId = authContext.userId

        const analyticsService = new AnalyticsService()
        const metrics = await analyticsService.getClientMetrics(clientId)

        const snapshot = await db.reportSnapshot.upsert({
            where: { clientId },
            create: {
                clientId,
                data: metrics as any,
                token: uuidv4()
            },
            update: {
                data: metrics as any,
                updatedAt: new Date()
            }
        })

        if (sendEmail && templateId) {
            const client = await db.client.findUnique({
                where: { id: clientId }
            })

            if (client && client.email) {
                const { messageService } = await import('@/modules/communications/message.service')
                const { getTemplateById } = await import('@/modules/communications/template.service')

                const template = await getTemplateById(templateId)
                if (template) {
                    const metricsData = snapshot.data as {
                        funnelPerformance?: Array<{ stage: string; count: number }>
                        activityDistribution?: Array<{ type: string; count: number }>
                    }
                    const metrics = {
                        funnelPerformance: metricsData?.funnelPerformance ?? [],
                        activityDistribution: metricsData?.activityDistribution ?? [],
                    }

                    const variables = buildReportEmailVariables({
                        request: req,
                        client: {
                            firstName: client.firstName,
                            lastName: client.lastName,
                            email: client.email,
                        },
                        snapshotToken: snapshot.token,
                        metrics,
                    })

                    const reportUrl = variables.reportUrl || variables.reportLink || variables.link || ''

                    await messageService.sendMessage({
                        templateId,
                        channel: 'EMAIL',
                        recipientType: 'client',
                        recipientId: clientId,
                        recipientEmail: client.email,
                        subject: template.subject || 'Your report is ready',
                        content: template.content,
                        variables,
                        appendedEmailHtml: buildEmailLinkAppendSection({
                            url: reportUrl,
                            heading: 'View your report',
                            buttonLabel: 'Open report',
                            intro: 'Your report link is below. You do not need to add the URL inside the email template.',
                        }),
                        sentBy: userId,
                    })
                }
            }
        }

        return NextResponse.json(snapshot)
    } catch (error: any) {
        console.error('Error creating/updating report snapshot:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
