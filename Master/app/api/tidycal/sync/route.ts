import { NextRequest, NextResponse } from 'next/server'
import { TidyCalService } from '@/lib/tidycal'

export async function POST(request: NextRequest) {
    try {
        // Trigger the sync
        const result = await TidyCalService.syncBookings()

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${result.count} bookings from TidyCal`,
            count: result.count
        })

    } catch (error) {
        console.error('TidyCal sync error:', error)

        const errorMessage = error instanceof Error ? error.message : 'Failed to sync TidyCal bookings'
        let status = 500

        if (errorMessage.includes('not configured') || errorMessage.includes('authentication failed')) {
            status = 400 // Bad Request (Configuration issue)
        }

        return NextResponse.json({
            error: errorMessage
        }, { status })
    }
}
