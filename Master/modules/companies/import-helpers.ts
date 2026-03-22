import { ContactRole, ContactStatus } from '@prisma/client'
import type { ImportCompanyRow } from './schemas'

/** Split "John Doe" → first/last; single word → lastName "—"; empty with contact data → Unknown / Contact */
export function parseContactNameForImport(contactName?: string): { firstName: string; lastName: string } {
    const raw = (contactName ?? '').trim()
    if (!raw) {
        return { firstName: 'Unknown', lastName: 'Contact' }
    }
    const parts = raw.split(/\s+/).filter(Boolean)
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: 'N/A' }
    }
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    }
}

export function mapDesignationToContactRole(designation?: string): ContactRole {
    const s = (designation ?? '').trim().toLowerCase()
    if (!s) return ContactRole.OTHER
    if (/\bhr\b|human resources/.test(s)) return ContactRole.HR
    if (/\bcto\b|chief technology/.test(s)) return ContactRole.CTO
    if (/\bceo\b|chief executive/.test(s)) return ContactRole.CEO
    if (/\bdirector\b/.test(s)) return ContactRole.DIRECTOR
    if (/\bmanager\b/.test(s)) return ContactRole.MANAGER
    if (/\bdeveloper\b|engineer\b/.test(s)) return ContactRole.DEVELOPER
    if (/\brecruiter\b|talent\b/.test(s)) return ContactRole.RECRUITER
    return ContactRole.OTHER
}

const OUTREACH_ALIASES: Record<string, ContactStatus> = {
    pending: ContactStatus.PENDING,
    'initial contact sent': ContactStatus.INITIAL_CONTACT_SENT,
    initial_contact_sent: ContactStatus.INITIAL_CONTACT_SENT,
    'initial contact': ContactStatus.INITIAL_CONTACT_SENT,
    following_up: ContactStatus.FOLLOWING_UP,
    'following up': ContactStatus.FOLLOWING_UP,
    replied: ContactStatus.REPLIED,
    'not interested': ContactStatus.NOT_INTERESTED,
    not_interested: ContactStatus.NOT_INTERESTED,
}

export function mapOutreachToContactStatus(raw?: string): ContactStatus | undefined {
    const trimmed = (raw ?? '').trim()
    if (!trimmed) return undefined
    const lower = trimmed.toLowerCase()
    if (OUTREACH_ALIASES[lower]) return OUTREACH_ALIASES[lower]
    const snake = lower.replace(/\s+/g, '_')
    if (OUTREACH_ALIASES[snake]) return OUTREACH_ALIASES[snake]
    const upperSnake = trimmed.toUpperCase().replace(/\s+/g, '_')
    const values = Object.values(ContactStatus) as string[]
    if (values.includes(upperSnake)) return upperSnake as ContactStatus
    return undefined
}

export function hasContactImportData(row: ImportCompanyRow): boolean {
    return !!(
        (row.contactName && row.contactName.trim()) ||
        (row.phoneNumber && row.phoneNumber.trim()) ||
        (row.emailId && String(row.emailId).trim()) ||
        (row.linkedInProfileLink && String(row.linkedInProfileLink).trim()) ||
        (row.designation && row.designation.trim()) ||
        (row.outreachStatus && row.outreachStatus.trim()) ||
        (row.comments && row.comments.trim())
    )
}
