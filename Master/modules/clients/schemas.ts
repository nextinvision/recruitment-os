import { z } from 'zod'
import { ServiceType } from '@prisma/client'

// Normalize email: accept any string from leads/forms; store only valid email or undefined (avoids 400 on convert)
const emailSchema = z
  .union([z.string(), z.literal(''), z.null(), z.undefined()])
  .optional()
  .transform((val) => {
    if (val == null || typeof val !== 'string') return undefined
    const trimmed = val.trim()
    if (!trimmed) return undefined
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(trimmed) ? trimmed : undefined
  })

// Optional string from API/leads: manual and Tydical-synced leads often send null for missing fields; accept null and normalize to undefined
const optionalString = z
  .union([z.string(), z.literal(''), z.null(), z.undefined()])
  .optional()
  .transform((v) => (v == null || (typeof v === 'string' && v.trim() === '') ? undefined : v))

export const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phone: optionalString,
  assignedUserId: z.string().min(1, 'Assigned user ID is required').optional(),
  address: optionalString,
  industry: optionalString, // Industry they want to work in (manual + Tydical leads)
  currentJobTitle: optionalString,
  experience: optionalString,
  skills: z.array(z.string()).optional(),
  notes: optionalString,
  leadId: z.string().optional(), // For conversion from lead

  // Preparation Pipeline Fields
  serviceType: z.nativeEnum(ServiceType).optional(),
  onboardedDate: z.string().datetime().optional(),
  reverseRecruiterId: optionalString,
  whatsappGroupCreated: z.boolean().optional(),
  whatsappGroupId: optionalString,
  whatsappGroupCreatedAt: z.string().datetime().optional(),
  jobSearchStrategyDocId: optionalString,
  gmailId: optionalString,
  gmailCreated: z.boolean().optional(),
  gmailCreatedAt: z.string().datetime().optional(),
  linkedInOptimized: z.boolean().optional(),
  linkedInOptimizedAt: z.string().datetime().optional(),
  jobSearchInitiated: z.boolean().optional(),
  jobSearchInitiatedAt: z.string().datetime().optional(),
})

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// Filter schemas
export const clientFilterSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  assignedUserId: z.string().optional(),
  reverseRecruiterId: z.string().optional(),
  industry: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  hasSkills: z.boolean().optional(),
  jobSearchInitiated: z.boolean().optional(),
  linkedInOptimized: z.boolean().optional(),
  whatsappGroupCreated: z.boolean().optional(),
})

// Sort schemas
export const clientSortSchema = z.object({
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'status', 'onboardedDate', 'jobSearchInitiatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Pagination schemas - max 500 to support picker/dropdown use cases (e.g. job assign, application form)
export const clientPaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(500).default(25),
})

// Input type: what callers pass to parse() / createClient() (partial objects allowed; onboarding/API don't send every key)
export type CreateClientInput = z.input<typeof createClientSchema>
export type UpdateClientInput = z.input<typeof updateClientSchema>
export type ClientFilters = z.infer<typeof clientFilterSchema>
export type ClientSortOptions = z.infer<typeof clientSortSchema>
export type ClientPaginationOptions = z.infer<typeof clientPaginationSchema>

export interface ClientsResult {
  clients: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
