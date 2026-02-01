import { z } from 'zod'
import { ApplicationStage } from '@prisma/client'

export const createApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  candidateId: z.string().min(1, 'Candidate ID is required'),
  recruiterId: z.string().min(1, 'Recruiter ID is required'),
  stage: z.nativeEnum(ApplicationStage).default(ApplicationStage.IDENTIFIED),
})

export const updateApplicationSchema = z.object({
  id: z.string().min(1),
  stage: z.nativeEnum(ApplicationStage).optional(),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>

