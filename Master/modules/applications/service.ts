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

// Stage lifecycle definition - allowed transitions (with explicit
// allowance for moving into PENDING_CLIENT_APPROVAL when sending jobs to client)
const STAGE_LIFECYCLE: Record<string, ApplicationStage[]> = {
  PENDING_CLIENT_APPROVAL: [ApplicationStage.IDENTIFIED, ApplicationStage.REJECTED],
  IDENTIFIED: [ApplicationStage.PENDING_CLIENT_APPROVAL, ApplicationStage.RESUME_UPDATED, ApplicationStage.COLD_MESSAGE_SENT],
  RESUME_UPDATED: [ApplicationStage.COLD_MESSAGE_SENT],
  COLD_MESSAGE_SENT: [ApplicationStage.CONNECTION_ACCEPTED, ApplicationStage.APPLIED],
  CONNECTION_ACCEPTED: [ApplicationStage.APPLIED, 'INTERVIEW_PREPARATION' as ApplicationStage],
  APPLIED: [
    'FOLLOW_UP_1' as ApplicationStage,
    'INTERVIEW_PREPARATION' as ApplicationStage,
    ApplicationStage.INTERVIEW_SCHEDULED,
    'NO_RESPONSE' as ApplicationStage,
    ApplicationStage.REJECTED,
    ApplicationStage.CLOSED,
  ],
  FOLLOW_UP_1: [
    'FOLLOW_UP_2' as ApplicationStage,
    ApplicationStage.APPLIED,
    'NO_RESPONSE' as ApplicationStage,
    ApplicationStage.REJECTED,
    ApplicationStage.CLOSED,
  ],
  FOLLOW_UP_2: [
    'FINAL_FOLLOW_UP' as ApplicationStage,
    ApplicationStage.APPLIED,
    'NO_RESPONSE' as ApplicationStage,
    ApplicationStage.REJECTED,
    ApplicationStage.CLOSED,
  ],
  FINAL_FOLLOW_UP: [
    ApplicationStage.APPLIED,
    'NO_RESPONSE' as ApplicationStage,
    ApplicationStage.REJECTED,
    ApplicationStage.CLOSED,
  ],
  NO_RESPONSE: [
    ApplicationStage.APPLIED,
    'FOLLOW_UP_1' as ApplicationStage,
    ApplicationStage.REJECTED,
    ApplicationStage.CLOSED,
  ],
  INTERVIEW_PREPARATION: [
    ApplicationStage.INTERVIEW_SCHEDULED,
    ApplicationStage.APPLIED,
    ApplicationStage.REJECTED,
    ApplicationStage.CLOSED,
  ],
  INTERVIEW_SCHEDULED: [ApplicationStage.OFFER, ApplicationStage.REJECTED, ApplicationStage.CLOSED],
  OFFER: [ApplicationStage.REJECTED, ApplicationStage.CLOSED],
  REJECTED: [ApplicationStage.CLOSED],
  CLOSED: [],
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

  const jobIds = validated.jobIds && validated.jobIds.length > 0
    ? validated.jobIds
    : (validated.jobId ? [validated.jobId] : [])
  // NOTE: jobIds may be empty – applications are allowed without jobs.

  // When jobs are selected, check for duplicate (same job + client) via ApplicationJob join
  if (jobIds.length > 0) {
    const existingForClient = await (db as any).applicationJob.findFirst({
      where: {
        application: {
          clientId: validated.clientId,
        },
        jobId: { in: jobIds },
      },
    })
    if (existingForClient) {
      throw new Error('Application already exists for one or more selected jobs for this client')
    }

    // Validate jobs exist when provided; client is always required
    const jobs = await db.job.findMany({
      where: { id: { in: jobIds } },
    })
    if (jobs.length !== jobIds.length) {
      throw new Error('One or more selected jobs were not found')
    }
  }

  const client = await db.client.findUnique({ where: { id: validated.clientId } })
  if (!client) throw new Error('Client not found')

  const createData: Prisma.ApplicationUncheckedCreateInput = {
    jobId: jobIds[0] ?? null, // Primary job for backwards compatibility (can be null)
    clientId: validated.clientId,
    recruiterId: validated.recruiterId,
    stage: validated.stage as ApplicationStage,
    notes: validated.notes,
    followUpDate: validated.followUpDate ? new Date(validated.followUpDate) : null,
    stageChangedAt: new Date(),
  }

  // Generate approval token if in PENDING_CLIENT_APPROVAL stage
  if (validated.stage === ApplicationStage.PENDING_CLIENT_APPROVAL) {
    const { randomBytes } = await import('crypto')
    ;(createData as any).approvalToken = randomBytes(32).toString('hex')
  }

  const application = await db.application.create({
    data: (
      jobIds.length > 0
        ? {
            ...createData,
            applicationJobs: {
              create: jobIds.map((jobId) => ({
                jobId,
              })),
            },
          }
        : createData
    ) as any,
    include: {
      job: {
        include: {
          companyRecord: { include: { contacts: true } },
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
      applicationJobs: {
        include: {
          job: true,
        },
      },
    },
  })

  // Trigger Notifications if in PENDING_CLIENT_APPROVAL
  if (application.stage === ApplicationStage.PENDING_CLIENT_APPROVAL && application.approvalToken) {
    try {
      const { messageService } = await import('@/modules/communications/message.service')
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careeristpro.cloud'
      const approvalLink = `${baseUrl}/public/approvals/${application.approvalToken}`

      const appAny: any = application
      const jobList = (appAny.applicationJobs || []).map((aj: any) => aj.job).filter((j: any) => !!j)
      const primaryJob = jobList[0] || appAny.job
      const jobTitle = primaryJob?.title || 'Sourced Job'

      const jobsHtml = jobList.length
        ? `<ul>${jobList
            .map(
              (job: any) =>
                `<li><strong>${job.title}</strong> at ${job.company}</li>`
            )
            .join('')}</ul>`
        : `<p><strong>${primaryJob?.title}</strong> at ${primaryJob?.company || 'Confidential'}</p>`

      // Send Email
      if (appAny.client?.email) {
        await messageService.sendMessage({
          channel: 'EMAIL',
          recipientType: 'client',
          recipientId: appAny.clientId!,
          recipientEmail: appAny.client.email,
          subject:
            jobList.length > 1
              ? `Review Required: ${jobList.length} New Job Opportunities`
              : `Review Required: New Job Opportunity - ${jobTitle}`,
          content: `
            <div style="font-family: sans-serif; color: #1F3A5F; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1F3A5F; border-bottom: 2px solid #F4B400; padding-bottom: 10px;">New Job Opportunit${jobList.length > 1 ? 'ies' : 'y'}</h2>
              <p>Hi ${appAny.client.firstName},</p>
              <p>Our Job Search Specialist has sourced the following opportunity/ies that match your profile:</p>
              <div style="background: #F8FAFC; padding: 15px; border-radius: 8px; margin: 20px 0;">
                ${jobsHtml}
              </div>
              <p>Please review the details and let us know if you'd like to proceed:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${approvalLink}" style="background: #1F3A5F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review and Approve Jobs</a>
              </div>
              <p style="font-size: 0.9em; color: #64748B;">This magic link is unique to you and expires once the jobs are actioned.</p>
              <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
              <p style="font-size: 0.8em; color: #94A3B8;">Best regards,<br/>Recruitment OS Team</p>
            </div>
          `,
          sentBy: appAny.recruiterId,
        })
      }

      // Send WhatsApp (Placeholder for log or actual service)
      if (appAny.client?.phone) {
        const jobsText = jobList.length
          ? jobList.map((job: any) => `${job.title} at ${job.company}`).join('; ')
          : `${primaryJob?.title} at ${primaryJob?.company || 'Confidential'}`
        await messageService.sendMessage({
          channel: 'WHATSAPP',
          recipientType: 'client',
          recipientId: appAny.clientId!,
          recipientPhone: appAny.client.phone,
          content: `Hi ${appAny.client.firstName}, we found new job opportunity/ies: *${jobsText}*. Please review and approve here: ${approvalLink}`,
          sentBy: appAny.recruiterId,
        })
      }
    } catch (err) {
      console.error('Failed to trigger approval notifications:', err)
    }
  }

  return application
}

export async function getApplicationById(applicationId: string) {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    // @ts-ignore - extended include with applicationJobs uses updated Prisma schema
    include: {
      job: {
        include: {
          companyRecord: { include: { contacts: true } },
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
      // applicationJobs relation is available in updated Prisma schema; ignore in older generated types
      // @ts-ignore
      applicationJobs: {
        include: {
          job: true,
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

  // @ts-ignore - extended include with applicationJobs uses updated Prisma schema
  const applications = await db.application.findMany({
    where,
    include: {
      job: {
        include: {
          companyRecord: { include: { contacts: true } },
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
      // applicationJobs relation is available in updated Prisma schema; ignore in older generated types
      // @ts-ignore
      applicationJobs: {
        include: {
          job: true,
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
          companyRecord: { include: { contacts: true } },
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
      applicationJobs: {
        include: {
          job: true,
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
    select: { stage: true, approvalToken: true },
  })

  if (!currentApplication) {
    throw new Error('Application not found')
  }

  // Allow any stage change to a valid stage (already validated by schema).
  // Update stageChangedAt when stage changes. Strict lifecycle is not enforced so
  // recruiters can correct data, skip steps, or follow their process flexibly.
  const updateData: any = { ...data }
  if (updateData.stage && updateData.stage !== currentApplication.stage) {
    updateData.stageChangedAt = new Date()
  }

  const application = await db.application.update({
    where: { id },
    data: updateData,
    include: {
      applicationJobs: {
        include: {
          job: true,
        },
      },
      job: {
        include: {
          companyRecord: { include: { contacts: true } },
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

  // If stage moved into PENDING_CLIENT_APPROVAL and there is no active token,
  // generate a fresh approval token and trigger notifications with all jobs.
  if (
    updateData.stage === ApplicationStage.PENDING_CLIENT_APPROVAL &&
    currentApplication.stage !== ApplicationStage.PENDING_CLIENT_APPROVAL &&
    !application.approvalToken
  ) {
    try {
      const { randomBytes } = await import('crypto')
      const newToken = randomBytes(32).toString('hex')

      const refreshed: any = await (db.application as any).update({
        where: { id },
        data: {
          approvalToken: newToken,
        },
        include: {
          job: {
            include: {
              companyRecord: { include: { contacts: true } },
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
          // @ts-ignore - applicationJobs relation added in updated Prisma schema
          applicationJobs: {
            include: {
              job: true,
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

      const { messageService } = await import('@/modules/communications/message.service')
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careeristpro.cloud'
      const approvalLink = `${baseUrl}/public/approvals/${refreshed.approvalToken}`

      const jobList = (refreshed.applicationJobs || []).map((aj: any) => aj.job).filter(Boolean) as any[]
      const primaryJob = jobList[0] || refreshed.job
      const jobTitle = primaryJob?.title || 'Sourced Job'

      const jobsHtml = jobList.length
        ? `<ul>${jobList
            .map(
              (job: any) =>
                `<li><strong>${job.title}</strong> at ${job.company}</li>`
            )
            .join('')}</ul>`
        : `<p><strong>${primaryJob?.title}</strong> at ${primaryJob?.company || 'Confidential'}</p>`

      if (refreshed.client?.email) {
        await messageService.sendMessage({
          channel: 'EMAIL',
          recipientType: 'client',
          recipientId: refreshed.clientId!,
          recipientEmail: refreshed.client.email,
          subject:
            jobList.length > 1
              ? `Review Required: ${jobList.length} New Job Opportunities`
              : `Review Required: New Job Opportunity - ${jobTitle}`,
          content: `
            <div style="font-family: sans-serif; color: #1F3A5F; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E5E7EB; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1F3A5F; border-bottom: 2px solid #F4B400; padding-bottom: 10px;">New Job Opportunit${jobList.length > 1 ? 'ies' : 'y'}</h2>
              <p>Hi ${refreshed.client.firstName},</p>
              <p>Our Job Search Specialist has sourced the following opportunity/ies that match your profile:</p>
              <div style="background: #F8FAFC; padding: 15px; border-radius: 8px; margin: 20px 0;">
                ${jobsHtml}
              </div>
              <p>Please review the details and let us know if you'd like to proceed:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${approvalLink}" style="background: #1F3A5F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review and Approve Jobs</a>
              </div>
              <p style="font-size: 0.9em; color: #64748B;">This magic link is unique to you and expires once the jobs are actioned.</p>
              <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
              <p style="font-size: 0.8em; color: #94A3B8;">Best regards,<br/>Recruitment OS Team</p>
            </div>
          `,
          sentBy: refreshed.recruiterId,
        })
      }

      if (refreshed.client?.phone) {
        const jobsText = jobList.length
          ? jobList.map((job) => `${job.title} at ${job.company}`).join('; ')
          : `${primaryJob?.title} at ${primaryJob?.company || 'Confidential'}`
        await messageService.sendMessage({
          channel: 'WHATSAPP',
          recipientType: 'client',
          recipientId: refreshed.clientId!,
          recipientPhone: refreshed.client.phone,
          content: `Hi ${refreshed.client.firstName}, we found new job opportunity/ies: *${jobsText}*. Please review and approve here: ${approvalLink}`,
          sentBy: refreshed.recruiterId,
        })
      }
    } catch (err) {
      console.error('Failed to trigger approval notifications on stage change:', err)
    }
  }

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
