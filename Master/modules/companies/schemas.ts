import { z } from 'zod'
import { CompanySize, ContactRole } from '@prisma/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalises null, undefined, and blank string to undefined for optional string fields. */
const optionalString = z.preprocess(
    (val) => (val == null || (typeof val === 'string' && val.trim() === '') ? undefined : val),
    z.string().optional()
)

/**
 * Optional URL: normalises null/empty to undefined; prepends https:// when no scheme
 * so values like "acme.com" or "linkedin.com/company/x" pass validation.
 */
const optionalUrl = z.preprocess(
    (val) => {
        if (val == null || (typeof val === 'string' && val.trim() === '')) return undefined
        if (typeof val !== 'string') return val
        const trimmed = val.trim()
        if (!trimmed) return undefined
        if (/^https?:\/\/\s*$/i.test(trimmed)) return undefined // scheme only, no host
        if (/^https?:\/\//i.test(trimmed)) return trimmed
        return 'https://' + trimmed
    },
    z.string().url('Must be a valid URL').optional()
)

const optionalEmail = z.preprocess(
    (val) => (val == null || (typeof val === 'string' && val.trim() === '') ? undefined : val),
    z.string().email('Invalid email address').optional()
)

/** Normalises null, undefined, and empty string to undefined for optional enum fields. */
const optionalCompanySize = z.preprocess(
    (val) => (val == null || (typeof val === 'string' && val.trim() === '') ? undefined : val),
    z.nativeEnum(CompanySize).optional()
)

const optionalContactRole = z.preprocess(
    (val) => (val == null || (typeof val === 'string' && val.trim() === '') ? undefined : val),
    z.nativeEnum(ContactRole).optional().default(ContactRole.OTHER)
)

// ─── Company Schemas ──────────────────────────────────────────────────────────

export const createCompanySchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    industry: optionalString,
    website: optionalUrl,
    location: optionalString,
    size: optionalCompanySize,
    description: optionalString,
    linkedinUrl: optionalUrl,
})

export const updateCompanySchema = createCompanySchema.partial().extend({
    id: z.string().min(1),
})

export const companyFiltersSchema = z.object({
    search: z.string().optional(),
    industry: z.string().optional(),
    size: optionalCompanySize,
})

export const companyPaginationSchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
})

// ─── Contact Schemas ──────────────────────────────────────────────────────────

export const createContactSchema = z.object({
    companyId: z.string().min(1),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: optionalContactRole,
    email: optionalEmail,
    phone: z.string().optional(),
    linkedinUrl: optionalUrl,
    notes: z.string().optional(),
})

export const updateContactSchema = createContactSchema.partial().extend({
    id: z.string().min(1),
})

// ─── Note Schemas ─────────────────────────────────────────────────────────────

export const createNoteSchema = z.object({
    companyId: z.string().min(1),
    content: z.string().min(1, 'Note content is required'),
})

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
export type CompanyFilters = z.infer<typeof companyFiltersSchema>
export type CompanyPagination = z.infer<typeof companyPaginationSchema>
export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type CreateNoteInput = z.infer<typeof createNoteSchema>


