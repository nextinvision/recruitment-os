import { z } from 'zod'

export const createFollowUpSchema = z.object({
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scheduledDate: z.string().datetime('Invalid date format'),
  notes: z.string().optional(),
})

export const updateFollowUpSchema = createFollowUpSchema.partial().extend({
  id: z.string().min(1),
  completed: z.boolean().optional(),
})

// Filter schemas
export const followUpFilterSchema = z.object({
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  assignedUserId: z.string().optional(),
  completed: z.boolean().optional(),
  overdue: z.boolean().optional(),
  entityType: z.enum(['lead', 'client', 'all']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
})

// Sort schemas
export const followUpSortSchema = z.object({
  sortBy: z.enum(['scheduledDate', 'title', 'createdAt', 'completed']).default('scheduledDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Pagination schemas
export const followUpPaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
})

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>
export type FollowUpFilters = z.infer<typeof followUpFilterSchema>
export type FollowUpSortOptions = z.infer<typeof followUpSortSchema>
export type FollowUpPaginationOptions = z.infer<typeof followUpPaginationSchema>

export interface FollowUpsResult {
  followUps: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
