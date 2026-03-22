import { z } from 'zod'

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  rate: z.number().min(0, 'Rate must be positive'),
  amount: z.number().min(0, 'Amount must be positive'),
})

export const createRevenueSchema = z.object({
  leadId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID']).default('PENDING'),
  invoiceNumber: z.string().optional().nullable(),
  dueDate: z.string().datetime({ message: 'Invalid date format' }).optional().nullable(),
  description: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).optional().nullable(),
  subTotal: z.number().optional().nullable(),
  taxAmount: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
})

export const updateRevenueSchema = createRevenueSchema.partial().extend({
  id: z.string().min(1),
  paidDate: z.string().datetime({ message: 'Invalid date format' }).optional().nullable(),
})

export type CreateRevenueInput = z.infer<typeof createRevenueSchema>
export type UpdateRevenueInput = z.infer<typeof updateRevenueSchema>

