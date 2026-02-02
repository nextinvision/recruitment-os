import { z } from 'zod'

export const createClientSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  address: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
  leadId: z.string().optional(), // For conversion from lead
})

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>

