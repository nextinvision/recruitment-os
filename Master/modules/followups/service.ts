import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import {
  createFollowUpSchema,
  updateFollowUpSchema,
  CreateFollowUpInput,
  UpdateFollowUpInput,
} from './schemas'

export async function createFollowUp(input: CreateFollowUpInput) {
  const validated = createFollowUpSchema.parse(input)

  const followUp = await db.followUp.create({
    data: {
      ...validated,
      scheduledDate: new Date(validated.scheduledDate),
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
          companyName: true,
          contactName: true,
        },
      },
    },
  })

  return followUp
}

export async function getFollowUpById(followUpId: string) {
  return db.followUp.findUnique({
    where: { id: followUpId },
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

export async function getFollowUps(
  userId: string,
  userRole: UserRole,
  filters?: {
    leadId?: string
    clientId?: string
    completed?: boolean
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
  
  if (filters?.completed !== undefined) {
    where.completed = filters.completed
  }
  
  if (filters?.startDate || filters?.endDate) {
    where.scheduledDate = {}
    if (filters.startDate) {
      where.scheduledDate.gte = filters.startDate
    }
    if (filters.endDate) {
      where.scheduledDate.lte = filters.endDate
    }
  }

  return db.followUp.findMany({
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
          companyName: true,
          contactName: true,
        },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  })
}

export async function updateFollowUp(input: UpdateFollowUpInput) {
  const { id, ...data } = updateFollowUpSchema.parse(input)

  const updateData: any = { ...data }
  
  if (updateData.scheduledDate) {
    updateData.scheduledDate = new Date(updateData.scheduledDate)
  }
  
  // If marking as completed, set completedAt
  if (updateData.completed === true) {
    updateData.completedAt = new Date()
  } else if (updateData.completed === false) {
    updateData.completedAt = null
  }

  const followUp = await db.followUp.update({
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
          companyName: true,
          contactName: true,
        },
      },
    },
  })

  return followUp
}

export async function deleteFollowUp(followUpId: string) {
  await db.followUp.delete({
    where: { id: followUpId },
  })
}

