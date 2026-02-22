import { db } from '@/lib/db'
import { Prisma, UserRole, ApplicationStage } from '@prisma/client'
import {
  createApplicationSchema,
  updateApplicationSchema,
  CreateApplicationInput,
  UpdateApplicationInput,
  ApplicationFilters,
  ApplicationSortOptions,
  ApplicationPaginationOptions,
  ApplicationsResult,
} from './schemas'

// Stage lifecycle definition - only forward transitions allowed
const STAGE_LIFECYCLE: Record<ApplicationStage, ApplicationStage[]> = {
  IDENTIFIED: [ApplicationStage.RESUME_UPDATED, ApplicationStage.COLD_MESSAGE_SENT],
  RESUME_UPDATED: [ApplicationStage.COLD_MESSAGE_SENT],
  COLD_MESSAGE_SENT: [ApplicationStage.CONNECTION_ACCEPTED, ApplicationStage.APPLIED],
  CONNECTION_ACCEPTED: [ApplicationStage.APPLIED],
  APPLIED: [ApplicationStage.INTERVIEW_SCHEDULED, ApplicationStage.REJECTED, ApplicationStage.CLOSED],
  INTERVIEW_SCHEDULED: [ApplicationStage.OFFER, ApplicationStage.REJECTED, ApplicationStage.CLOSED],
  OFFER: [ApplicationStage.REJECTED, ApplicationStage.CLOSED],
  REJECTED: [ApplicationStage.CLOSED],
  CLOSED: [], // Terminal state
}

// Validate stage transition
function validateStageTransition(currentStage: ApplicationStage, newStage: ApplicationStage): boolean {
  // Allow staying in same stage
  if (currentStage === newStage) {
    return true
  }

  // Check if transition is allowed
  const allowedTransitions = STAGE_LIFECYCLE[currentStage] || []
  return allowedTransitions.includes(newStage)
}

// Calculate days in current stage
export function calculateDaysInCurrentStage(application: any): number {
  if (!application.stageChangedAt) {
    // If stageChangedAt is not set, use createdAt as fallback
    const stageStartDate = new Date(application.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - stageStartDate.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const stageStartDate = new Date(application.stageChangedAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - stageStartDate.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Calculate total days since creation
export function calculateDaysSinceCreation(application: any): number {
  const createdDate = new Date(application.createdAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - createdDate.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export async function createApplication(input: CreateApplicationInput) {
  const validated = createApplicationSchema.parse(input)

  // When job is selected, check for duplicate (same job + client)
  if (validated.jobId) {
    const existing = await db.application.findFirst({
      where: {
        jobId: validated.jobId,
        clientId: validated.clientId,
      },
    })
    if (existing) {
      throw new Error('Application already exists for this job and client')
    }
  }

  // Validate job exists when provided; client is always required
  if (validated.jobId) {
    const job = await db.job.findUnique({ where: { id: validated.jobId } })
    if (!job) throw new Error('Job not found')
  }
  const client = await db.client.findUnique({ where: { id: validated.clientId } })
  if (!client) throw new Error('Client not found')

  const createData = {
    jobId: (validated.jobId && validated.jobId.trim()) || null,
    clientId: validated.clientId,
    recruiterId: validated.recruiterId,
    stage: validated.stage,
    notes: validated.notes,
    followUpDate: validated.followUpDate ? new Date(validated.followUpDate) : null,
    stageChangedAt: new Date(),
  }

  const application = await db.application.create({
    data: createData as Prisma.ApplicationUncheckedCreateInput,
    include: {
      job: {
        include: {
          recruiter: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      client: {
        include: {
          assignedUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return application
}

export async function getApplicationById(applicationId: string) {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          recruiter: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      client: {
        include: {
          assignedUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      actions: {
        include: {
          performedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { performedAt: 'desc' },
      },
    },
  })

  if (application) {
    // Add calculated fields
    return {
      ...application,
      daysInCurrentStage: calculateDaysInCurrentStage(application),
      daysSinceCreation: calculateDaysSinceCreation(application),
    }
  }

  return application
}

export async function getApplications(
  userId: string,
  userRole: UserRole,
  filters?: ApplicationFilters,
  sortOptions?: ApplicationSortOptions,
  pagination?: ApplicationPaginationOptions
): Promise<ApplicationsResult> {
  const where: any = {}

  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.recruiterId = userId
  }

  // Apply filters
  if (filters) {
    if (filters.stage) {
      where.stage = filters.stage
    }
    if (filters.recruiterId) {
      where.recruiterId = filters.recruiterId
    }
    if (filters.jobId) {
      where.jobId = filters.jobId
    }
    if (filters.clientId) {
      where.clientId = filters.clientId
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
    if (filters.search) {
      where.OR = [
        { job: { title: { contains: filters.search, mode: 'insensitive' } } },
        { job: { company: { contains: filters.search, mode: 'insensitive' } } },
        { client: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { client: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { client: { email: { contains: filters.search, mode: 'insensitive' } } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    if (filters.hasFollowUp !== undefined) {
      if (filters.hasFollowUp) {
        where.followUpDate = { not: null }
      } else {
        where.followUpDate = null
      }
    }
    if (filters.overdueFollowUps) {
      where.followUpDate = {
        lt: new Date(),
      }
    }
  }

  // Get total count
  const total = await db.application.count({ where })

  // Determine sort order
  const sortBy = sortOptions?.sortBy || 'createdAt'
  const sortOrder = sortOptions?.sortOrder || 'desc'
  const orderBy: any = {}

  switch (sortBy) {
    case 'stage':
      orderBy.stage = sortOrder
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

  const applications = await db.application.findMany({
    where,
    include: {
      job: {
        include: {
          recruiter: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      client: {
        include: {
          assignedUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy,
    skip,
    take: pageSize,
  })

  // Add calculated fields
  const applicationsWithMetrics = applications.map((app) => ({
    ...app,
    daysInCurrentStage: calculateDaysInCurrentStage(app),
    daysSinceCreation: calculateDaysSinceCreation(app),
  }))

  const totalPages = Math.ceil(total / pageSize)

  return {
    applications: applicationsWithMetrics,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getApplicationsByStage(stage: ApplicationStage) {
  const applications = await db.application.findMany({
    where: { stage },
    include: {
      job: {
        include: {
          recruiter: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      client: {
        include: {
          assignedUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Add calculated fields
  return applications.map((app) => ({
    ...app,
    daysInCurrentStage: calculateDaysInCurrentStage(app),
    daysSinceCreation: calculateDaysSinceCreation(app),
  }))
}

export async function updateApplication(input: UpdateApplicationInput) {
  const { id, ...data } = updateApplicationSchema.parse(input)

  // Get current application to check stage transition
  const currentApplication = await db.application.findUnique({
    where: { id },
    select: { stage: true },
  })

  if (!currentApplication) {
    throw new Error('Application not found')
  }

  // Validate stage transition if stage is being changed
  const updateData: any = { ...data }
  if (updateData.stage && updateData.stage !== currentApplication.stage) {
    if (!validateStageTransition(currentApplication.stage, updateData.stage)) {
      throw new Error(
        `Invalid stage transition from ${currentApplication.stage} to ${updateData.stage}. Allowed transitions: ${STAGE_LIFECYCLE[currentApplication.stage]?.join(', ') || 'none'}`
      )
    }
    // Update stageChangedAt when stage changes
    updateData.stageChangedAt = new Date()
  }

  const application = await db.application.update({
    where: { id },
    data: updateData,
    include: {
      job: {
        include: {
          recruiter: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      client: {
        include: {
          assignedUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      actions: {
        include: {
          performedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { performedAt: 'desc' },
      },
    },
  })

  // Add calculated fields
  return {
    ...application,
    daysInCurrentStage: calculateDaysInCurrentStage(application),
    daysSinceCreation: calculateDaysSinceCreation(application),
  }
}

export async function deleteApplication(applicationId: string) {
  await db.application.delete({
    where: { id: applicationId },
  })
}

// Get upcoming follow-ups
export async function getUpcomingFollowUps(userId: string, userRole: UserRole, daysAhead: number = 1) {
  const where: any = {
    followUpDate: {
      gte: new Date(),
      lte: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
    },
  }

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.recruiterId = userId
  }

  return db.application.findMany({
    where,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { followUpDate: 'asc' },
  })
}

// Get overdue follow-ups
export async function getOverdueFollowUps(userId: string, userRole: UserRole) {
  const where: any = {
    followUpDate: {
      lt: new Date(),
    },
  }

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.recruiterId = userId
  }

  return db.application.findMany({
    where,
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      recruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { followUpDate: 'asc' },
  })
}

// Export applications to CSV
export async function exportApplicationsToCSV(
  userId: string,
  userRole: UserRole,
  filters?: ApplicationFilters
): Promise<string> {
  const where: any = {}

  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.recruiterId = userId
  }

  // Apply filters (same as getApplications)
  if (filters) {
    if (filters.stage) {
      where.stage = filters.stage
    }
    if (filters.recruiterId) {
      where.recruiterId = filters.recruiterId
    }
    if (filters.jobId) {
      where.jobId = filters.jobId
    }
    if (filters.clientId) {
      where.clientId = filters.clientId
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
    if (filters.search) {
      where.OR = [
        { job: { title: { contains: filters.search, mode: 'insensitive' } } },
        { job: { company: { contains: filters.search, mode: 'insensitive' } } },
        { client: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { client: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { client: { email: { contains: filters.search, mode: 'insensitive' } } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
  }

  const applications = await db.application.findMany({
    where,
    include: {
      job: {
        select: {
          title: true,
          company: true,
          location: true,
        },
      },
      client: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      recruiter: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Generate CSV
  const headers = [
    'ID',
    'Client Name',
    'Client Email',
    'Job Title',
    'Company',
    'Location',
    'Stage',
    'Recruiter',
    'Follow-up Date',
    'Days in Stage',
    'Days Since Creation',
    'Created At',
    'Notes',
  ]

  const rows = applications.map((app) => {
    const daysInStage = calculateDaysInCurrentStage(app)
    const daysSince = calculateDaysSinceCreation(app)
    return [
      app.id,
      `"${app.client ? `${app.client.firstName} ${app.client.lastName}` : 'Unknown Client'}"`,
      `"${app.client?.email || ''}"`,
      `"${app.job?.title ?? ''}"`,
      `"${app.job?.company ?? ''}"`,
      `"${app.job?.location || ''}"`,
      app.stage,
      `"${app.recruiter.firstName} ${app.recruiter.lastName}"`,
      app.followUpDate ? new Date(app.followUpDate).toISOString().split('T')[0] : '',
      daysInStage.toString(),
      daysSince.toString(),
      new Date(app.createdAt).toISOString(),
      `"${(app.notes || '').replace(/"/g, '""')}"`,
    ]
  })

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  return csv
}
