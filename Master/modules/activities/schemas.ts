import { z } from 'zod'

export const createActivitySchema = z.object({
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'FOLLOW_UP']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  occurredAt: z.string().datetime('Invalid date format').optional(),
})

export const updateActivitySchema = createActivitySchema.partial().extend({
  id: z.string().min(1),
})

// Filter schemas
export const activityFilterSchema = z.object({
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  assignedUserId: z.string().optional(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'FOLLOW_UP']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
})

// Sort schemas
export const activitySortSchema = z.object({
  sortBy: z.enum(['occurredAt', 'title', 'type', 'createdAt']).default('occurredAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Pagination schemas
export const activityPaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
})

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>
export type ActivityFilters = z.infer<typeof activityFilterSchema>
export type ActivitySortOptions = z.infer<typeof activitySortSchema>
export type ActivityPaginationOptions = z.infer<typeof activityPaginationSchema>

export interface ActivitiesResult {
  activities: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

