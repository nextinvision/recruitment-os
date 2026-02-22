import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import {
  createFollowUpSchema,
  updateFollowUpSchema,
  CreateFollowUpInput,
  UpdateFollowUpInput,
  FollowUpFilters,
  FollowUpSortOptions,
  FollowUpPaginationOptions,
  FollowUpsResult,
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
          firstName: true,
          lastName: true,
          currentCompany: true,
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
  filters?: FollowUpFilters,
  sortOptions?: FollowUpSortOptions,
  pagination?: FollowUpPaginationOptions
): Promise<FollowUpsResult> {
  const where: any = {}

  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
  }

  // Apply filters
  if (filters) {
    if (filters.leadId) {
      where.leadId = filters.leadId
    }
    if (filters.clientId) {
      where.clientId = filters.clientId
    }
    if (filters.assignedUserId) {
      where.assignedUserId = filters.assignedUserId
    }
    if (filters.completed !== undefined) {
      where.completed = filters.completed
    }
    if (filters.overdue) {
      where.completed = false
      where.scheduledDate = {
        lt: new Date(),
      }
    }
    if (filters.entityType) {
      if (filters.entityType === 'lead') {
        where.leadId = { not: null }
        where.clientId = null
      } else if (filters.entityType === 'client') {
        where.clientId = { not: null }
        where.leadId = null
      }
      // 'all' means no filter
    }
    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {}
      if (filters.startDate) {
        where.scheduledDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.scheduledDate.lte = filters.endDate
      }
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { lead: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { lead: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { lead: { currentCompany: { contains: filters.search, mode: 'insensitive' } } },
        { client: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { client: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }
  }

  // Get total count
  const total = await db.followUp.count({ where })

  // Determine sort order
  const sortBy = sortOptions?.sortBy || 'scheduledDate'
  const sortOrder = sortOptions?.sortOrder || 'asc'
  const orderBy: any = {}

  switch (sortBy) {
    case 'title':
      orderBy.title = sortOrder
      break
    case 'createdAt':
      orderBy.createdAt = sortOrder
      break
    case 'completed':
      orderBy.completed = sortOrder
      break
    case 'scheduledDate':
    default:
      orderBy.scheduledDate = sortOrder
      break
  }

  // Pagination
  const page = pagination?.page || 1
  const pageSize = pagination?.pageSize || 25
  const skip = (page - 1) * pageSize

  const followUps = await db.followUp.findMany({
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
          firstName: true,
          lastName: true,
          currentCompany: true,
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
    orderBy,
    skip,
    take: pageSize,
  })

  const totalPages = Math.ceil(total / pageSize)

  return {
    followUps,
    total,
    page,
    pageSize,
    totalPages,
  }
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
          firstName: true,
          lastName: true,
          currentCompany: true,
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

  return followUp
}

export async function deleteFollowUp(followUpId: string) {
  await db.followUp.delete({
    where: { id: followUpId },
  })
}

// Helper functions for dashboard/widgets
export async function getPendingFollowUps(userId: string, userRole: UserRole) {
  const where: any = {
    completed: false,
    scheduledDate: {
      gte: new Date(),
    },
  }

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
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
          firstName: true,
          lastName: true,
          currentCompany: true,
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
    orderBy: { scheduledDate: 'asc' },
    take: 10,
  })
}

export async function getOverdueFollowUps(userId: string, userRole: UserRole) {
  const where: any = {
    completed: false,
    scheduledDate: {
      lt: new Date(),
    },
  }

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
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
          firstName: true,
          lastName: true,
          currentCompany: true,
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
    orderBy: { scheduledDate: 'asc' },
  })
}

export async function getTodayFollowUps(userId: string, userRole: UserRole) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const where: any = {
    completed: false,
    scheduledDate: {
      gte: today,
      lt: tomorrow,
    },
  }

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
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
          firstName: true,
          lastName: true,
          currentCompany: true,
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
    orderBy: { scheduledDate: 'asc' },
  })
}

// Export follow-ups to CSV
export async function exportFollowUpsToCSV(
  userId: string,
  userRole: UserRole,
  filters?: FollowUpFilters
): Promise<string> {
  const where: any = {}

  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
  }

  // Apply filters (same as getFollowUps)
  if (filters) {
    if (filters.leadId) {
      where.leadId = filters.leadId
    }
    if (filters.clientId) {
      where.clientId = filters.clientId
    }
    if (filters.assignedUserId) {
      where.assignedUserId = filters.assignedUserId
    }
    if (filters.completed !== undefined) {
      where.completed = filters.completed
    }
    if (filters.overdue) {
      where.completed = false
      where.scheduledDate = {
        lt: new Date(),
      }
    }
    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {}
      if (filters.startDate) {
        where.scheduledDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.scheduledDate.lte = filters.endDate
      }
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
  }

  const followUps = await db.followUp.findMany({
    where,
    include: {
      assignedUser: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      lead: {
        select: {
          firstName: true,
          lastName: true,
          currentCompany: true,
        },
      },
      client: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { scheduledDate: 'asc' },
  })

  // Generate CSV
  const headers = [
    'ID',
    'Title',
    'Description',
    'Scheduled Date',
    'Completed',
    'Completed At',
    'Assigned To',
    'Lead',
    'Client',
    'Notes',
    'Created At',
  ]

  const rows = followUps.map((fu) => [
    fu.id,
    `"${fu.title}"`,
    `"${(fu.description || '').replace(/"/g, '""')}"`,
    new Date(fu.scheduledDate).toISOString(),
    fu.completed ? 'Yes' : 'No',
    fu.completedAt ? new Date(fu.completedAt).toISOString() : '',
    `"${fu.assignedUser.firstName} ${fu.assignedUser.lastName}"`,
    fu.lead ? `"${fu.lead.firstName} ${fu.lead.lastName}"` : '',
    fu.client ? `"${fu.client.firstName} ${fu.client.lastName}"` : '',
    `"${(fu.notes || '').replace(/"/g, '""')}"`,
    new Date(fu.createdAt).toISOString(),
  ])

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  return csv
}
