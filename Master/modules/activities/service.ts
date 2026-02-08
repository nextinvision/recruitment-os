import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'TASK' | 'FOLLOW_UP'
import {
  createActivitySchema,
  updateActivitySchema,
  CreateActivityInput,
  UpdateActivityInput,
} from './schemas'

export async function createActivity(input: CreateActivityInput) {
  const validated = createActivitySchema.parse(input)

  const activity = await db.activity.create({
    data: {
      ...validated,
      occurredAt: validated.occurredAt ? new Date(validated.occurredAt) : new Date(),
      leadId: validated.leadId || null,
      clientId: validated.clientId || null,
    },
    include: {
      assignedUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lead: {
        select: {
          id: true,
          companyName: true,
          contactName: true,
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
  })

  return activity
}

export async function getActivityById(activityId: string) {
  return db.activity.findUnique({
    where: { id: activityId },
    include: {
      assignedUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lead: true,
      client: true,
    },
  })
}

export async function getActivities(
  userId: string,
  userRole: UserRole,
  filters?: {
    leadId?: string
    clientId?: string
    type?: string
    startDate?: Date
    endDate?: Date
  }
) {
  const where: any = {}
  
  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
  }
  
  // Additional filters
  if (filters?.leadId) {
    where.leadId = filters.leadId
  }
  
  if (filters?.clientId) {
    where.clientId = filters.clientId
  }
  
  if (filters?.type) {
    where.type = filters.type
  }
  
  if (filters?.startDate || filters?.endDate) {
    where.occurredAt = {}
    if (filters.startDate) {
      where.occurredAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.occurredAt.lte = filters.endDate
    }
  }

  return db.activity.findMany({
    where,
    include: {
      assignedUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lead: {
        select: {
          id: true,
          companyName: true,
          contactName: true,
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
    orderBy: { occurredAt: 'desc' },
  })
}

export async function updateActivity(input: UpdateActivityInput) {
  const { id, ...data } = updateActivitySchema.parse(input)

  const updateData: any = { ...data }
  
  if (updateData.occurredAt) {
    updateData.occurredAt = new Date(updateData.occurredAt)
  }

  const activity = await db.activity.update({
    where: { id },
    data: updateData,
    include: {
      assignedUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lead: {
        select: {
          id: true,
          companyName: true,
          contactName: true,
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
  })

  return activity
}

export async function deleteActivity(activityId: string) {
  await db.activity.delete({
    where: { id: activityId },
  })
}

