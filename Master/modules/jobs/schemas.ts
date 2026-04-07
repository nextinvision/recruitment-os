import { z } from 'zod'
import { JobSource, JobStatus, JobType } from '@prisma/client'

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
  jobType: z.nativeEnum(JobType).optional().default('ONSITE'),
  recruiterId: z.string().min(1, 'Recruiter ID is required'),
  companyId: z.string().optional(),
  notes: z.string().optional(),
})

export const updateJobSchema = createJobSchema.partial().extend({
  id: z.string().min(1),
})

/**
 * Stored when the browser extension (or other bulk importers) sends jobs from listing cards
 * where a full description is often unavailable. Matches Prisma `Job.description` (required String).
 */
export const BULK_IMPORT_MISSING_DESCRIPTION_PLACEHOLDER =
  'No description was captured from the job listing. Open the source URL or edit the job in the dashboard to add details.'

/**
 * Same fields as manual job creation, but description may be omitted or blank from scrapers.
 * Empty values are normalized to {@link BULK_IMPORT_MISSING_DESCRIPTION_PLACEHOLDER} before insert.
 */
export const bulkCreateJobItemSchema = createJobSchema.omit({ description: true }).extend({
  description: z
    .string()
    .optional()
    .transform((raw) => {
      const trimmed = (raw ?? '').trim()
      return trimmed.length > 0 ? trimmed : BULK_IMPORT_MISSING_DESCRIPTION_PLACEHOLDER
    }),
})

export const bulkCreateJobsSchema = z.object({
  jobs: z.array(bulkCreateJobItemSchema).min(1, 'At least one job is required'),
})

export const jobFiltersSchema = z.object({
  source: z.nativeEnum(JobSource).optional(),
  status: z.nativeEnum(JobStatus).optional(),
  jobType: z.nativeEnum(JobType).optional(),
  recruiterId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  isDuplicate: z.boolean().optional(),
  // New granular filters
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  skills: z.string().optional(), // Comma-separated or single skill
  ctcRange: z.string().optional(),
  yearsOfExperience: z.string().optional(),
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

export const bulkAssignJobsToCandidateSchema = z.object({
  jobIds: z.array(z.string().min(1)).min(1),
  candidateId: z.string().min(1),
})

export const resolveDuplicateSchema = z.object({
  duplicateId: z.string().min(1),
  originalId: z.string().min(1),
  action: z.enum(['merge', 'delete']),
})

export const bulkDeleteJobsSchema = z.object({
  jobIds: z.array(z.string().min(1, 'Job ID is required')).min(1, 'At least one job ID is required'),
})

export type CreateJobInput = z.input<typeof createJobSchema>
export type UpdateJobInput = z.input<typeof updateJobSchema>
export type BulkCreateJobsInput = z.input<typeof bulkCreateJobsSchema>
export type JobFiltersInput = z.input<typeof jobFiltersSchema>
export type JobSortInput = z.input<typeof jobSortSchema>
export type JobPaginationInput = z.input<typeof jobPaginationSchema>
export type AssignJobInput = z.infer<typeof assignJobSchema>
export type BulkAssignJobInput = z.infer<typeof bulkAssignJobSchema>
export type BulkAssignJobsToCandidateInput = z.infer<typeof bulkAssignJobsToCandidateSchema>
export type BulkDeleteJobsInput = z.infer<typeof bulkDeleteJobsSchema>
export type ResolveDuplicateInput = z.infer<typeof resolveDuplicateSchema>
