import { z } from 'zod'

export const createCandidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  assignedRecruiterId: z.string().min(1, 'Assigned recruiter ID is required'),
})

export const updateCandidateSchema = createCandidateSchema.partial().extend({
  id: z.string().min(1),
})

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>

