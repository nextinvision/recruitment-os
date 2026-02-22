import { db } from '@/lib/db'
import { UserRole, JobSource, JobStatus } from '@prisma/client'
import {
  createJobSchema,
  updateJobSchema,
  bulkCreateJobsSchema,
  CreateJobInput,
  UpdateJobInput,
  BulkCreateJobsInput,
} from './schemas'

// Normalize job data
function normalizeJobData(data: any): any {
  const normalized: any = {}
  
  if (data.title) normalized.title = data.title.trim()
  if (data.company) normalized.company = data.company.trim()
  if (data.location) normalized.location = data.location.trim()
  if (data.description) normalized.description = data.description.trim()
  if (data.sourceUrl) normalized.sourceUrl = data.sourceUrl.trim()
  if (data.experienceRequired) normalized.experienceRequired = data.experienceRequired.trim()
  if (data.salaryRange) normalized.salaryRange = data.salaryRange.trim()
  if (data.notes) normalized.notes = data.notes.trim()
  if (data.skills && Array.isArray(data.skills)) {
    normalized.skills = data.skills.map((s: string) => s.trim()).filter((s: string) => s.length > 0)
  }
  
  // Copy other fields
  Object.keys(data).forEach(key => {
    if (!normalized.hasOwnProperty(key)) {
      normalized[key] = data[key]
    }
  })
  
  return normalized
}

// Calculate similarity score between two jobs (0-100)
function calculateSimilarity(job1: any, job2: any): number {
  let score = 0
  let factors = 0

  // Title similarity (40% weight)
  if (job1.title && job2.title) {
    const title1 = job1.title.toLowerCase().trim()
    const title2 = job2.title.toLowerCase().trim()
    if (title1 === title2) {
      score += 40
    } else if (title1.includes(title2) || title2.includes(title1)) {
      score += 30
    } else {
      // Simple word overlap
      const words1 = title1.split(/\s+/)
      const words2 = title2.split(/\s+/)
      const commonWords = words1.filter((w: string) => words2.includes(w))
      if (commonWords.length > 0) {
        score += (commonWords.length / Math.max(words1.length, words2.length)) * 40
      }
    }
    factors++
  }

  // Company similarity (30% weight)
  if (job1.company && job2.company) {
    const company1 = job1.company.toLowerCase().trim()
    const company2 = job2.company.toLowerCase().trim()
    if (company1 === company2) {
      score += 30
    } else if (company1.includes(company2) || company2.includes(company1)) {
      score += 25
    }
    factors++
  }

  // Location similarity (15% weight)
  if (job1.location && job2.location) {
    const loc1 = job1.location.toLowerCase().trim()
    const loc2 = job2.location.toLowerCase().trim()
    if (loc1 === loc2) {
      score += 15
    } else if (loc1.includes(loc2) || loc2.includes(loc1)) {
      score += 10
    }
    factors++
  }

  // Source URL similarity (15% weight)
  if (job1.sourceUrl && job2.sourceUrl) {
    if (job1.sourceUrl === job2.sourceUrl) {
      score += 15
    }
    factors++
  }

  return Math.min(100, Math.round(score))
}

// Detect duplicates for a job
async function detectDuplicates(jobData: any): Promise<{ jobId: string; similarityScore: number }[]> {
  const duplicates: { jobId: string; similarityScore: number }[] = []
  
  // Get all active jobs (excluding the current job if updating)
  const existingJobs = await db.job.findMany({
    where: {
      id: jobData.id ? { not: jobData.id } : undefined,
      isDuplicate: false, // Only check against non-duplicate jobs
    },
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      sourceUrl: true,
    },
  })

  for (const existingJob of existingJobs) {
    const similarity = calculateSimilarity(jobData, existingJob)
    if (similarity >= 90) {
      duplicates.push({
        jobId: existingJob.id,
        similarityScore: similarity,
      })
    }
  }

  return duplicates
}

export interface JobFilters {
  source?: JobSource
  status?: JobStatus
  recruiterId?: string
  startDate?: Date
  endDate?: Date
  search?: string
  isDuplicate?: boolean
}

export interface JobSortOptions {
  sortBy?: 'title' | 'company' | 'createdAt' | 'source' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface JobPaginationOptions {
  page?: number
  pageSize?: number
}

export interface JobsResult {
  jobs: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function createJob(input: CreateJobInput) {
  const validated = createJobSchema.parse(input)
  const normalized = normalizeJobData(validated)

  // Detect duplicates before creating
  const duplicates = await detectDuplicates(normalized)
  const isDuplicate = duplicates.length > 0
  const duplicateOf = isDuplicate ? duplicates[0].jobId : null
  const similarityScore = isDuplicate ? duplicates[0].similarityScore : null

  const job = await db.job.create({
    data: {
      ...normalized,
      isDuplicate,
      duplicateOf,
      similarityScore,
    },
    include: {
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      applications: {
        select: {
          id: true,
        },
      },
    },
  })

  return job
}

export async function getJobById(jobId: string) {
  return db.job.findUnique({
    where: { id: jobId },
    include: {
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      applications: {
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  })
}

export async function getJobs(
  userId: string,
  userRole: UserRole,
  filters?: JobFilters,
  sortOptions?: JobSortOptions,
  pagination?: JobPaginationOptions
): Promise<JobsResult> {
  const where: any = {}
  
  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.recruiterId = userId
  }

  // Apply filters
  if (filters) {
    if (filters.source) {
      where.source = filters.source
    }
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.recruiterId) {
      where.recruiterId = filters.recruiterId
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }
    if (filters.isDuplicate !== undefined) {
      where.isDuplicate = filters.isDuplicate
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
  }

  // Get total count
  const total = await db.job.count({ where })

  // Determine sort order
  const sortBy = sortOptions?.sortBy || 'createdAt'
  const sortOrder = sortOptions?.sortOrder || 'desc'
  const orderBy: any = {}
  
  switch (sortBy) {
    case 'title':
      orderBy.title = sortOrder
      break
    case 'company':
      orderBy.company = sortOrder
      break
    case 'source':
      orderBy.source = sortOrder
      break
    case 'status':
      orderBy.status = sortOrder
      break
    case 'createdAt':
    default:
      orderBy.createdAt = sortOrder
      break
  }

  // Pagination
  const page = pagination?.page || 1
  const pageSize = pagination?.pageSize || 25
  const skip = (page - 1) * pageSize

  const jobs = await db.job.findMany({
    where,
    include: {
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      applications: {
        select: {
          id: true,
        },
      },
    },
    orderBy,
    skip,
    take: pageSize,
  })

  const totalPages = Math.ceil(total / pageSize)

  return {
    jobs,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function updateJob(input: UpdateJobInput) {
  const { id, ...data } = updateJobSchema.parse(input)
  const normalized = normalizeJobData(data)

  // Re-detect duplicates if key fields changed
  const existingJob = await db.job.findUnique({ where: { id } })
  if (existingJob) {
    const checkFields = ['title', 'company', 'location', 'sourceUrl']
    const shouldCheckDuplicates = checkFields.some(field => normalized[field] !== undefined)
    
    if (shouldCheckDuplicates) {
      const jobData = { ...existingJob, ...normalized }
      const duplicates = await detectDuplicates(jobData)
      const isDuplicate = duplicates.length > 0
      const duplicateOf = isDuplicate ? duplicates[0].jobId : null
      const similarityScore = isDuplicate ? duplicates[0].similarityScore : null
      
      normalized.isDuplicate = isDuplicate
      normalized.duplicateOf = duplicateOf
      normalized.similarityScore = similarityScore
    }
  }

  const job = await db.job.update({
    where: { id },
    data: normalized,
    include: {
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      applications: {
        select: {
          id: true,
        },
      },
    },
  })

  return job
}

export async function deleteJob(jobId: string) {
  await db.job.delete({
    where: { id: jobId },
  })
}

export async function bulkCreateJobs(input: BulkCreateJobsInput) {
  const validated = bulkCreateJobsSchema.parse(input)
  
  // Normalize all jobs
  const normalizedJobs = validated.jobs.map(job => normalizeJobData(job))
  
  // Use transaction for bulk create
  const result = await db.$transaction(async (tx) => {
    const createdJobs = []
    
    for (const jobData of normalizedJobs) {
      // Detect duplicates
      const duplicates = await detectDuplicates(jobData)
      const isDuplicate = duplicates.length > 0
      const duplicateOf = isDuplicate ? duplicates[0].jobId : null
      const similarityScore = isDuplicate ? duplicates[0].similarityScore : null
      
      try {
        const job = await tx.job.create({
          data: {
            ...jobData,
            isDuplicate,
            duplicateOf,
            similarityScore,
          },
        })
        createdJobs.push(job)
      } catch (error) {
        // Skip duplicates or errors, continue with next job
        console.error('Failed to create job:', error)
      }
    }
    
    return {
      count: createdJobs.length,
      jobs: createdJobs,
    }
  })

  return result
}

// Assign job to candidate (creates application)
export async function assignJobToCandidate(
  jobId: string,
  candidateId: string,
  recruiterId: string
) {
  // Validate job exists
  const job = await db.job.findUnique({ where: { id: jobId } })
  if (!job) {
    throw new Error('Job not found')
  }

  // Validate candidate exists
  const candidate = await db.candidate.findUnique({ where: { id: candidateId } })
  if (!candidate) {
    throw new Error('Candidate not found')
  }

  // Check if application already exists
  const existingApplication = await db.application.findFirst({
    where: {
      jobId,
      clientId: candidateId, // Note: This function should be deprecated in favor of assignJobToClient
    },
  })

  if (existingApplication) {
    throw new Error('Application already exists for this job and client')
  }

  // Create application
  const application = await db.application.create({
    data: {
      jobId,
      clientId: candidateId, // Note: This function should be deprecated in favor of assignJobToClient
      recruiterId,
      stage: 'IDENTIFIED',
    },
    include: {
      job: true,
      client: true,
      recruiter: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return application
}

// Bulk assign job to multiple candidates
export async function bulkAssignJobToCandidates(
  jobId: string,
  candidateIds: string[],
  recruiterId: string
) {
  // Validate job exists
  const job = await db.job.findUnique({ where: { id: jobId } })
  if (!job) {
    throw new Error('Job not found')
  }

  // Validate all candidates exist
  const candidates = await db.candidate.findMany({
    where: {
      id: { in: candidateIds },
    },
  })

  if (candidates.length !== candidateIds.length) {
    throw new Error('One or more candidates not found')
  }

  // Create applications in transaction
  const result = await db.$transaction(async (tx) => {
    const createdApplications = []
    
    for (const candidateId of candidateIds) {
      // Check if application already exists
      const existing = await tx.application.findFirst({
        where: {
          jobId,
          clientId: candidateId, // Note: This function should be deprecated in favor of bulkAssignJobToClients
        },
      })

      if (!existing) {
        const application = await tx.application.create({
          data: {
            jobId,
            clientId: candidateId, // Note: This function should be deprecated in favor of bulkAssignJobToClients
            recruiterId,
            stage: 'IDENTIFIED',
          },
        })
        createdApplications.push(application)
      }
    }
    
    return {
      count: createdApplications.length,
      applications: createdApplications,
    }
  })

  return result
}

// Get duplicate jobs
export async function getDuplicateJobs(userId: string, userRole: UserRole) {
  const where: any = {
    isDuplicate: true,
  }

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.recruiterId = userId
  }

  const duplicates = await db.job.findMany({
    where,
    include: {
      recruiter: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      applications: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group duplicates
  const duplicateGroups: Map<string, any[]> = new Map()
  
  for (const job of duplicates) {
    const key = job.duplicateOf || job.id
    if (!duplicateGroups.has(key)) {
      // Get the original job
      const original = await db.job.findUnique({
        where: { id: key },
        include: {
          recruiter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          applications: {
            select: {
              id: true,
            },
          },
        },
      })
      if (original) {
        duplicateGroups.set(key, [original])
      }
    }
    if (job.id !== key) {
      duplicateGroups.get(key)?.push(job)
    }
  }

  return Array.from(duplicateGroups.values())
}

// Resolve duplicate (merge or delete)
export async function resolveDuplicate(
  duplicateId: string,
  originalId: string,
  action: 'merge' | 'delete'
) {
  const duplicate = await db.job.findUnique({ where: { id: duplicateId } })
  const original = await db.job.findUnique({ where: { id: originalId } })

  if (!duplicate || !original) {
    throw new Error('Job not found')
  }

  if (action === 'merge') {
    // Merge: Transfer applications from duplicate to original, then delete duplicate
    await db.$transaction(async (tx) => {
      // Update applications to point to original job
      await tx.application.updateMany({
        where: { jobId: duplicateId },
        data: { jobId: originalId },
      })

      // Delete duplicate
      await tx.job.delete({
        where: { id: duplicateId },
      })
    })
  } else {
    // Delete: Just delete the duplicate
    await db.job.delete({
      where: { id: duplicateId },
    })
  }

  return { success: true }
}

// Export jobs to CSV
export async function exportJobsToCSV(
  userId: string,
  userRole: UserRole,
  filters?: JobFilters
): Promise<string> {
  const where: any = {}
  
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.recruiterId = userId
  }

  if (filters) {
    if (filters.source) where.source = filters.source
    if (filters.status) where.status = filters.status
    if (filters.recruiterId) where.recruiterId = filters.recruiterId
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
  }

  const jobs = await db.job.findMany({
    where,
    include: {
      recruiter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      applications: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Generate CSV
  const headers = [
    'ID',
    'Title',
    'Company',
    'Location',
    'Source',
    'Status',
    'Skills',
    'Experience Required',
    'Salary Range',
    'Recruiter',
    'Applications Count',
    'Created At',
    'Is Duplicate',
  ]

  const rows = jobs.map(job => [
    job.id,
    job.title,
    job.company,
    job.location,
    job.source,
    job.status,
    job.skills.join('; '),
    job.experienceRequired || '',
    job.salaryRange || '',
    `${job.recruiter.firstName} ${job.recruiter.lastName}`,
    job.applications.length.toString(),
    job.createdAt.toISOString(),
    job.isDuplicate ? 'Yes' : 'No',
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csv
}
