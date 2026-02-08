import { z } from 'zod'

export const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  address: z.string().optional(),
  industry: z.string().optional(), // Industry they want to work in
  currentJobTitle: z.string().optional(), // Current job title
  experience: z.string().optional(), // Years of experience
  skills: z.array(z.string()).optional(), // Skills/interests
  notes: z.string().optional(),
  leadId: z.string().optional(), // For conversion from lead
})

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>

