import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import {
  createJobSchema,
  updateJobSchema,
  bulkCreateJobsSchema,
  CreateJobInput,
  UpdateJobInput,
  BulkCreateJobsInput,
} from './schemas'

export async function createJob(input: CreateJobInput) {
  const validated = createJobSchema.parse(input)

  const job = await db.job.create({
    data: validated,
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
    },
  })
}

export async function getJobs(userId: string, userRole: UserRole) {
  const where =
    userRole === UserRole.ADMIN || userRole === UserRole.MANAGER
      ? {}
      : { recruiterId: userId }

  return db.job.findMany({
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
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateJob(input: UpdateJobInput) {
  const { id, ...data } = updateJobSchema.parse(input)

  const job = await db.job.update({
    where: { id },
    data,
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

  const jobs = await db.job.createMany({
    data: validated.jobs,
    skipDuplicates: true,
  })

  return {
    count: jobs.count,
  }
}

