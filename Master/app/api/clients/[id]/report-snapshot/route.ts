import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AnalyticsService } from '@/modules/analytics/service'
import { v4 as uuidv4 } from 'uuid'
import { getAuthContext, requireAuth } from '@/lib/rbac'

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
                    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
                    const reportLink = `${origin}/public/reports/${snapshot.token}`

                    const variables = {
                        firstName: client.firstName,
                        lastName: client.lastName,
                        fullName: `${client.firstName} ${client.lastName}`,
                        reportLink,
                    }

                    // Extract userId from auth context if possible, or use a system ID
                    // Using a placeholder for now if userId isn't easily accessible here
                    const actualUserId = userId || 'system'

                    await messageService.sendMessage({
                        templateId,
                        channel: 'EMAIL',
                        recipientType: 'client',
                        recipientId: clientId,
                        recipientEmail: client.email,
                        subject: template.subject || 'Updated Report',
                        content: template.content,
                        variables,
                        sentBy: actualUserId,
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
