import { z } from 'zod'

export const createLeadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  source: z.string().optional(),
  industry: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  notes: z.string().optional(),
})

export const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST']).optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

