import { z } from 'zod'

export const createRevenueSchema = z.object({
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  amount: z.number().positive('Amount must be positive'),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID']).default('PENDING'),
  invoiceNumber: z.string().optional(),
  dueDate: z.string().datetime('Invalid date format').optional(),
  description: z.string().optional(),
})

export const updateRevenueSchema = createRevenueSchema.partial().extend({
  id: z.string().min(1),
  paidDate: z.string().datetime('Invalid date format').optional(),
})

export type CreateRevenueInput = z.infer<typeof createRevenueSchema>
export type UpdateRevenueInput = z.infer<typeof updateRevenueSchema>

