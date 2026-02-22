import { z } from 'zod'
import { ApplicationActionType } from '@prisma/client'

export const createApplicationActionSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  type: z.nativeEnum(ApplicationActionType),
  description: z.string().optional(),
  performedById: z.string().min(1, 'Performed by ID is required'),
  performedAt: z.string().datetime().optional(),
})

export type CreateApplicationActionInput = z.infer<typeof createApplicationActionSchema>

