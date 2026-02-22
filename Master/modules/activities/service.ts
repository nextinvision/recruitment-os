import { db } from '@/lib/db'
import { UserRole, Prisma } from '@prisma/client'
import {
  createActivitySchema,
  updateActivitySchema,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityFilters,
  ActivitySortOptions,
  ActivityPaginationOptions,
  ActivitiesResult,
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
  filters?: ActivityFilters,
  sortOptions?: ActivitySortOptions,
  pagination?: ActivityPaginationOptions
): Promise<ActivitiesResult> {
  const where: Prisma.ActivityWhereInput = {}
  
  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
  } else if (filters?.assignedUserId) {
    where.assignedUserId = filters.assignedUserId
  }
  
  // Search filter
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { lead: { firstName: { contains: filters.search, mode: 'insensitive' } } },
      { lead: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      { lead: { currentCompany: { contains: filters.search, mode: 'insensitive' } } },
      { client: { firstName: { contains: filters.search, mode: 'insensitive' } } },
      { client: { lastName: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }
  
  // Entity filters
  if (filters?.leadId) {
    where.leadId = filters.leadId
  }
  
  if (filters?.clientId) {
    where.clientId = filters.clientId
  }
  
  // Type filter
  if (filters?.type) {
    where.type = filters.type
  }
  
  // Date range filters
  if (filters?.startDate || filters?.endDate) {
    where.occurredAt = {}
    if (filters.startDate) {
      where.occurredAt.gte = new Date(filters.startDate)
    }
    if (filters.endDate) {
      where.occurredAt.lte = new Date(filters.endDate)
    }
  }

  // Sort options
  const { sortBy = 'occurredAt', sortOrder = 'desc' } = sortOptions || {}
  
  // Pagination options
  const { page = 1, pageSize = 25 } = pagination || {}
  const skip = (page - 1) * pageSize

  const [total, activities] = await db.$transaction([
    db.activity.count({ where }),
    db.activity.findMany({
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
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
    }),
  ])

  return {
    activities,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
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

  return activity
}

export async function deleteActivity(activityId: string) {
  await db.activity.delete({
    where: { id: activityId },
  })
}

// Export activities to CSV
export async function exportActivitiesToCSV(
  userId: string,
  userRole: UserRole,
  filters?: ActivityFilters,
  sortOptions?: ActivitySortOptions
): Promise<string> {
  const { activities } = await getActivities(userId, userRole, filters, sortOptions, { page: 1, pageSize: 999999 })

  const headers = [
    'ID', 'Type', 'Title', 'Description', 'Occurred At', 'Assigned User',
    'Lead First Name', 'Lead Last Name', 'Lead Company', 'Client First Name', 'Client Last Name',
    'Created At', 'Updated At'
  ]

  const rows = activities.map(activity => [
    activity.id,
    activity.type,
    activity.title,
    activity.description || '',
    activity.occurredAt.toISOString(),
    `${activity.assignedUser.firstName} ${activity.assignedUser.lastName}`,
    activity.lead?.firstName || '',
    activity.lead?.lastName || '',
    activity.lead?.currentCompany || '',
    activity.client?.firstName || '',
    activity.client?.lastName || '',
    activity.createdAt.toISOString(),
    activity.updatedAt.toISOString(),
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csv
}

