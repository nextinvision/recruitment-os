import { db } from '@/lib/db'
import { ApplicationActionType } from '@prisma/client'
import {
  createApplicationActionSchema,
  CreateApplicationActionInput,
} from './schemas'

export async function logApplicationAction(input: CreateApplicationActionInput) {
  const validated = createApplicationActionSchema.parse(input)

  const action = await db.applicationAction.create({
    data: {
      applicationId: validated.applicationId,
      type: validated.type,
      description: validated.description,
      performedById: validated.performedById,
      performedAt: validated.performedAt ? new Date(validated.performedAt) : new Date(),
    },
    include: {
      performedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      application: {
        select: {
          id: true,
          job: {
            select: {
              id: true,
              title: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  })

  return action
}

export async function getApplicationTimeline(applicationId: string) {
  const actions = await db.applicationAction.findMany({
    where: { applicationId },
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
  })

  return actions
}

export async function getApplicationActions(applicationId: string) {
  return getApplicationTimeline(applicationId)
}

