import { db } from './db'

export interface TidyCalBooking {
    id: number
    first_name: string
    last_name: string
    email: string
    phone: string | null
    questions: any[]
    booking_type: {
        id: number
        name: string
        description: string
    }
    start_at: string
    end_at: string
    cancelled_at: string | null
    created_at: string
}

export class TidyCalService {
    private static readonly API_BASE_URL = 'https://tidycal.com/api'

    /**
     * Normalize different TidyCal payload shapes into a booking object.
     * Supports:
     * - direct booking object
     * - { data: booking }
     * - { data: { booking: booking } }
     * - { booking: booking }
     */
    private static extractBookingPayload(payload: any): any {
        if (!payload || typeof payload !== 'object') {
            throw new Error('Invalid TidyCal payload')
        }

        if (payload.id != null && (payload.contact || payload.email || payload.starts_at || payload.start_at)) {
            return payload
        }
        if (payload.booking && typeof payload.booking === 'object') {
            return payload.booking
        }
        if (payload.data && typeof payload.data === 'object') {
            if (payload.data.id != null) return payload.data
            if (payload.data.booking && typeof payload.data.booking === 'object') return payload.data.booking
        }

        // Last fallback for unknown webhook wrappers
        if (payload.event_data && typeof payload.event_data === 'object') {
            if (payload.event_data.booking) return payload.event_data.booking
            if (payload.event_data.id != null) return payload.event_data
        }

        throw new Error('Could not locate booking object in TidyCal payload')
    }

    private static extractBookingsArray(data: any): any[] {
        if (Array.isArray(data)) return data
        if (Array.isArray(data?.data)) return data.data
        if (Array.isArray(data?.bookings)) return data.bookings
        if (Array.isArray(data?.data?.bookings)) return data.data.bookings
        if (Array.isArray(data?.results)) return data.results
        return []
    }

    private static getHeaders() {
        const token = process.env.TIDYCAL_PERSONAL_ACCESS_TOKEN
        if (!token || token.trim() === '') {
            throw new Error('TidyCal Personal Access Token is not configured. Please add TIDYCAL_PERSONAL_ACCESS_TOKEN to your .env file.')
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    }

    /**
     * Fetch one page of bookings from TidyCal.
     * @param params.page - 1-based page number (omit for first page).
     * @returns Bookings for that page; empty array when no more results.
     */
    static async fetchBookings(params: { page?: number } = {}): Promise<TidyCalBooking[]> {
        const queryParams = new URLSearchParams()
        if (params.page != null && params.page >= 1) {
            queryParams.append('page', params.page.toString())
        }

        const response = await fetch(`${this.API_BASE_URL}/bookings?${queryParams.toString()}`, {
            headers: this.getHeaders(),
        })

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('TidyCal API authentication failed. Please check your TidyCal Personal Access Token in the .env file.')
            }
            const errorText = await response.text()
            console.error('TidyCal API error:', errorText)
            throw new Error(`TidyCal API error (${response.status}): ${response.statusText}`)
        }

        const data = await response.json()
        // Be lenient with response shape across API versions.
        return this.extractBookingsArray(data) as TidyCalBooking[]
    }

    /**
     * Process a single TidyCal booking into Lead and Activity
     */
    static async processBooking(payload: any) {
        const booking = this.extractBookingPayload(payload)
        // TidyCal API nesting: contact info is under 'contact', time is under 'starts_at'
        const id = booking.id
        if (id == null) {
            throw new Error('TidyCal booking is missing id')
        }
        const contact = booking.contact || {}
        const name = contact.name || booking.first_name || 'TidyCal'
        const email = contact.email || booking.email
        const phone = booking.phone || null // Sometimes root, sometimes in questions
        const questions = booking.questions || []
        const booking_type = booking.booking_type || {}
        const starts_at = booking.starts_at || booking.start_at

        // Extract phone from questions if not in root
        let extractedPhone = phone
        if (!extractedPhone && questions.length > 0) {
            const phoneQ = questions.find((q: any) =>
                (q.label || q.question || '').toLowerCase().includes('phone')
            )
            if (phoneQ) extractedPhone = phoneQ.answer
        }

        // Determine names
        const nameParts = name.trim().split(' ')
        const firstName = nameParts[0] || 'TidyCal'
        const lastName = nameParts.slice(1).join(' ') || 'Booking'

        // Determine default assignee (from env or first admin)
        let assignedUserId = process.env.TIDYCAL_DEFAULT_ASSIGNEE_ID

        // If it looks like an email, find user by email
        if (assignedUserId && assignedUserId.includes('@')) {
            const user = await db.user.findFirst({
                where: { email: assignedUserId },
                select: { id: true }
            })
            assignedUserId = user?.id || undefined
        }

        if (!assignedUserId || assignedUserId.trim() === '') {
            const admin = await db.user.findFirst({
                where: { role: 'ADMIN' },
                select: { id: true }
            })
            assignedUserId = admin?.id
        }

        if (!assignedUserId) {
            throw new Error('No default assignee found for TidyCal booking')
        }

        // Process questions into notes
        let notes = `Booking: ${booking_type?.title || booking_type?.name || 'Appointment'}\n`
        if (questions && Array.isArray(questions)) {
            questions.forEach((q: any) => {
                const label = q.label || q.question
                const answer = q.answer
                if (label && answer) {
                    notes += `\n${label}: ${answer}`
                }
            })
        }

        // 1. Create or Update Lead
        // We try to find a lead by externalId or email
        let lead = await db.lead.findFirst({
            where: {
                OR: [
                    { externalId: String(id), externalSource: 'TidyCal' },
                    ...(email ? [{ email: email }] : [])
                ]
            }
        })

        if (lead) {
            lead = await db.lead.update({
                where: { id: lead.id },
                data: {
                    firstName: firstName || lead.firstName,
                    lastName: lastName || lead.lastName,
                    phone: String(extractedPhone || lead.phone || ''),
                    externalId: String(id),
                    externalSource: 'TidyCal',
                    notes: notes.trim()
                }
            })
        } else {
            lead = await db.lead.create({
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email || null,
                    phone: extractedPhone ? String(extractedPhone) : null,
                    status: 'NEW',
                    source: 'TidyCal',
                    assignedUserId,
                    externalId: String(id),
                    externalSource: 'TidyCal',
                    notes: notes.trim()
                }
            })
        }

        // 2. Create or Update Meeting Activity
        // Check if activity already exists for this TidyCal ID
        const existingActivity = await db.activity.findFirst({
            where: {
                externalId: String(id),
                externalSource: 'TidyCal'
            }
        })

        const occurredAt = starts_at ? new Date(starts_at) : new Date()
        const isCancelled = !!booking.cancelled_at
        const bookingTitle = booking_type?.title || booking_type?.name || 'Meeting'
        const baseTitle = `TidyCal: ${bookingTitle} with ${firstName} ${lastName}`
        const finalTitle = isCancelled ? `[CANCELLED] ${baseTitle}` : baseTitle

        if (existingActivity) {
            // Update existing activity (e.g. if it was rescheduled or cancelled)
            await db.activity.update({
                where: { id: existingActivity.id },
                data: {
                    title: finalTitle,
                    description: isCancelled ? `CANCELLED: ${notes.trim()}` : notes.trim(),
                    occurredAt: isNaN(occurredAt.getTime()) ? existingActivity.occurredAt : occurredAt,
                }
            })
        } else {
            // Create new activity
            await db.activity.create({
                data: {
                    type: 'MEETING',
                    title: finalTitle,
                    description: isCancelled ? `CANCELLED: ${notes.trim()}` : notes.trim(),
                    occurredAt: isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
                    assignedUserId,
                    leadId: lead.id,
                    externalId: String(id),
                    externalSource: 'TidyCal'
                }
            })
        }

        return lead
    }

    /** Max pages to fetch in one sync (safety limit; ~50k bookings at 100/page). */
    private static readonly SYNC_MAX_PAGES = 500

    /**
     * Sync all bookings from TidyCal by paginating until no more results.
     * Fetches page 1, 2, 3, ... until a page returns zero bookings, then processes every booking.
     */
    static async syncBookings() {
        console.log('[TidyCal] Starting manual sync (full pagination)...')
        const allBookings: TidyCalBooking[] = []
        let page = 1

        try {
            while (page <= this.SYNC_MAX_PAGES) {
                const pageBookings = await this.fetchBookings({ page })
                if (pageBookings.length === 0) {
                    console.log(`[TidyCal] Page ${page} empty, no more results`)
                    break
                }
                allBookings.push(...pageBookings)
                console.log(`[TidyCal] Fetched page ${page}: ${pageBookings.length} bookings (total so far: ${allBookings.length})`)
                page++
            }

            if (page > this.SYNC_MAX_PAGES) {
                console.warn(`[TidyCal] Reached max pages (${this.SYNC_MAX_PAGES}); more bookings may exist.`)
            }

            for (const booking of allBookings) {
                await this.processBooking(booking)
            }

            return {
                success: true,
                count: allBookings.length
            }
        } catch (error) {
            console.error('[TidyCal] Sync error:', error)
            throw error
        }
    }
}
