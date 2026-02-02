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

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>

