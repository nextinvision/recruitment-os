import { z } from 'zod'

// Explicit list of application stages (must match Prisma ApplicationStage enum).
// Used for Zod validation so PATCH/GET/filters accept all stages regardless of Prisma client version.
const APPLICATION_STAGE_VALUES = [
  'PENDING_CLIENT_APPROVAL',
  'IDENTIFIED',
  'RESUME_UPDATED',
  'COLD_MESSAGE_SENT',
  'CONNECTION_ACCEPTED',
  'APPLIED',
  'FOLLOW_UP_1',
  'FOLLOW_UP_2',
  'FINAL_FOLLOW_UP',
  'NO_RESPONSE',
  'INTERVIEW_PREPARATION',
  'INTERVIEW_SCHEDULED',
  'OFFER',
  'REJECTED',
  'CLOSED',
] as const

export type ApplicationStageValue = (typeof APPLICATION_STAGE_VALUES)[number]

const applicationStageSchema = z.enum(APPLICATION_STAGE_VALUES)

export const createApplicationSchema = z.object({
  jobId: z.string().min(1).optional().or(z.literal('')),
  jobIds: z.array(z.string().min(1)).optional(),
  clientId: z.string().min(1, 'Client ID is required'),
  recruiterId: z.string().min(1, 'Recruiter ID is required'),
  stage: applicationStageSchema.default('IDENTIFIED'),
  notes: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
}).transform((data) => ({
  ...data,
  jobId: data.jobId && data.jobId.trim() ? data.jobId.trim() : undefined,
  jobIds: Array.isArray(data.jobIds)
    ? Array.from(new Set(data.jobIds.map((id) => id.trim()).filter((id) => !!id)))
    : undefined,
}))

export const updateApplicationSchema = z.object({
  id: z.string().min(1),
  stage: applicationStageSchema.optional(),
  notes: z.string().optional(),
  followUpDate: z.string().datetime().optional().nullable(),
})

// Filter schemas
export const applicationFilterSchema = z.object({
  stage: applicationStageSchema.optional(),
  recruiterId: z.string().optional(),
  jobId: z.string().optional(),
  clientId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  hasFollowUp: z.boolean().optional(),
  overdueFollowUps: z.boolean().optional(),
})

// Sort schemas
export const applicationSortSchema = z.object({
  sortBy: z.enum(['stage', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Pagination schemas
export const applicationPaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
export type ApplicationFilters = z.infer<typeof applicationFilterSchema>
export type ApplicationSortOptions = z.infer<typeof applicationSortSchema>
export type ApplicationPaginationOptions = z.infer<typeof applicationPaginationSchema>

export interface ApplicationsResult {
  applications: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
