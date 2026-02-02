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

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>

