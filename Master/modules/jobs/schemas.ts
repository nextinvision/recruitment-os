import { z } from 'zod'
import { JobSource } from '@prisma/client'

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  source: z.nativeEnum(JobSource),
  recruiterId: z.string().min(1, 'Recruiter ID is required'),
})

export const updateJobSchema = createJobSchema.partial().extend({
  id: z.string().min(1),
})

export const bulkCreateJobsSchema = z.object({
  jobs: z.array(createJobSchema).min(1, 'At least one job is required'),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
export type BulkCreateJobsInput = z.infer<typeof bulkCreateJobsSchema>

