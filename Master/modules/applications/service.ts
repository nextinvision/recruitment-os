import { db } from '@/lib/db'
import { UserRole, ApplicationStage } from '@prisma/client'
import {
  createApplicationSchema,
  updateApplicationSchema,
  CreateApplicationInput,
  UpdateApplicationInput,
} from './schemas'

export async function createApplication(input: CreateApplicationInput) {
  const validated = createApplicationSchema.parse(input)

  // Check if application already exists
  const existing = await db.application.findUnique({
    where: {
      jobId_candidateId: {
        jobId: validated.jobId,
        candidateId: validated.candidateId,
      },
    },
  })

  if (existing) {
    throw new Error('Application already exists for this job and candidate')
  }

  const application = await db.application.create({
    data: validated,
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
      candidate: {
        include: {
          assignedRecruiter: {
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
  return db.application.findUnique({
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
      candidate: {
        include: {
          assignedRecruiter: {
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
}

export async function getApplications(userId: string, userRole: UserRole) {
  const where =
    userRole === UserRole.ADMIN || userRole === UserRole.MANAGER
      ? {}
      : { recruiterId: userId }

  return db.application.findMany({
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
      candidate: {
        include: {
          assignedRecruiter: {
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
}

export async function getApplicationsByStage(stage: ApplicationStage) {
  return db.application.findMany({
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
      candidate: {
        include: {
          assignedRecruiter: {
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
}

export async function updateApplication(input: UpdateApplicationInput) {
  const { id, ...data } = updateApplicationSchema.parse(input)

  const application = await db.application.update({
    where: { id },
    data,
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
      candidate: {
        include: {
          assignedRecruiter: {
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

export async function deleteApplication(applicationId: string) {
  await db.application.delete({
    where: { id: applicationId },
  })
}

