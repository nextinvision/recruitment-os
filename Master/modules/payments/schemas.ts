import { z } from 'zod'

export const createPaymentSchema = z.object({
  revenueId: z.string().min(1, 'Revenue ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().datetime('Invalid date format').optional(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export const updatePaymentSchema = createPaymentSchema.partial().extend({
  id: z.string().min(1),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>

