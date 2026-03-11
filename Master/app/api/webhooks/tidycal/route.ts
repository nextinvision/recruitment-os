import { NextRequest, NextResponse } from 'next/server'
import { TidyCalService } from '@/lib/tidycal'

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        // Security check
        if (!token || token !== process.env.TIDYCAL_WEBHOOK_TOKEN) {
            console.warn('Unauthorized TidyCal webhook attempt')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const payload = await request.json()

        // Process booking using the centralized service
        const lead = await TidyCalService.processBooking(payload)

        return NextResponse.json({
            success: true,
            data: { leadId: lead.id }
        }, { status: 201 })

    } catch (error) {
        console.error('TidyCal webhook error:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to process booking'
        }, { status: 500 })
    }
}
