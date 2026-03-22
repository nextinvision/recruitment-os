import { z } from 'zod'

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  currentCompany: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  source: z.string().optional(),
  industry: z.string().optional(),
  estimatedValue: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return undefined
      const num = typeof val === 'string' ? parseFloat(val) : val
      if (Number.isNaN(num)) return undefined
      if (num <= 0) return undefined
      if (num > 9999999999.99) throw new Error('Estimated value cannot exceed 99,99,99,999.99 INR')
      return num
    }),
  notes: z.string().optional(),
})

export const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST']).optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

