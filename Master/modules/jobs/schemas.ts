import { z } from 'zod'
import { JobSource, JobStatus } from '@prisma/client'

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(1, 'Description is required'),
  source: z.nativeEnum(JobSource),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  skills: z.array(z.string()).optional().default([]),
  experienceRequired: z.string().optional(),
  salaryRange: z.string().optional(),
  status: z.nativeEnum(JobStatus).optional().default('ACTIVE'),
  recruiterId: z.string().min(1, 'Recruiter ID is required'),
  notes: z.string().optional(),
})

export const updateJobSchema = createJobSchema.partial().extend({
  id: z.string().min(1),
})

export const bulkCreateJobsSchema = z.object({
  jobs: z.array(createJobSchema).min(1, 'At least one job is required'),
})

export const jobFiltersSchema = z.object({
  source: z.nativeEnum(JobSource).optional(),
  status: z.nativeEnum(JobStatus).optional(),
  recruiterId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  isDuplicate: z.boolean().optional(),
})

export const jobSortSchema = z.object({
  sortBy: z.enum(['title', 'company', 'createdAt', 'source', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export const jobPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
})

export const assignJobSchema = z.object({
  jobId: z.string().min(1),
  candidateId: z.string().min(1),
})

export const bulkAssignJobSchema = z.object({
  jobId: z.string().min(1),
  candidateIds: z.array(z.string().min(1)).min(1),
})

export const resolveDuplicateSchema = z.object({
  duplicateId: z.string().min(1),
  originalId: z.string().min(1),
  action: z.enum(['merge', 'delete']),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
export type UpdateJobInput = z.infer<typeof updateJobSchema>
export type BulkCreateJobsInput = z.infer<typeof bulkCreateJobsSchema>
export type JobFiltersInput = z.infer<typeof jobFiltersSchema>
export type JobSortInput = z.infer<typeof jobSortSchema>
export type JobPaginationInput = z.infer<typeof jobPaginationSchema>
export type AssignJobInput = z.infer<typeof assignJobSchema>
export type BulkAssignJobInput = z.infer<typeof bulkAssignJobSchema>
export type ResolveDuplicateInput = z.infer<typeof resolveDuplicateSchema>
