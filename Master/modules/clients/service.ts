import { db } from '@/lib/db'
import { UserRole, ClientStatus } from '@prisma/client'
import {
  createClientSchema,
  updateClientSchema,
  CreateClientInput,
  UpdateClientInput,
  ClientFilters,
  ClientSortOptions,
  ClientPaginationOptions,
  ClientsResult,
} from './schemas'

export async function createClient(input: CreateClientInput) {
  const validated = createClientSchema.parse(input)

  const client = await db.client.create({
    data: {
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email || null,
      phone: validated.phone || null,
      address: validated.address || null,
      assignedUserId: validated.assignedUserId,
      leadId: validated.leadId || null,
      industry: validated.industry || null,
      currentJobTitle: validated.currentJobTitle || null,
      experience: validated.experience || null,
      skills: validated.skills || [],
      notes: validated.notes || null,
      // Preparation Pipeline Fields
      serviceType: validated.serviceType || null,
      onboardedDate: validated.onboardedDate ? new Date(validated.onboardedDate) : null,
      reverseRecruiterId: validated.reverseRecruiterId || null,
      whatsappGroupCreated: validated.whatsappGroupCreated || false,
      whatsappGroupId: validated.whatsappGroupId || null,
      whatsappGroupCreatedAt: validated.whatsappGroupCreatedAt ? new Date(validated.whatsappGroupCreatedAt) : null,
      jobSearchStrategyDocId: validated.jobSearchStrategyDocId || null,
      gmailId: validated.gmailId || null,
      gmailCreated: validated.gmailCreated || false,
      gmailCreatedAt: validated.gmailCreatedAt ? new Date(validated.gmailCreatedAt) : null,
      linkedInOptimized: validated.linkedInOptimized || false,
      linkedInOptimizedAt: validated.linkedInOptimizedAt ? new Date(validated.linkedInOptimizedAt) : null,
      jobSearchInitiated: validated.jobSearchInitiated || false,
      jobSearchInitiatedAt: validated.jobSearchInitiatedAt ? new Date(validated.jobSearchInitiatedAt) : null,
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
      reverseRecruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lead: true,
      jobSearchStrategy: true,
      coverLetters: true,
      documents: true,
    },
  })

  // If created from lead, update lead status to QUALIFIED
  if (validated.leadId) {
    await db.lead.update({
      where: { id: validated.leadId },
      data: {
        status: 'QUALIFIED',
        convertedAt: new Date(),
      },
    })
  }

  return client
}

export async function getClientById(clientId: string) {
  return db.client.findUnique({
    where: { id: clientId },
    include: {
      assignedUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      reverseRecruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lead: true,
      jobSearchStrategy: true,
      coverLetters: {
        orderBy: { version: 'desc' },
      },
      documents: {
        orderBy: { version: 'desc' },
      },
      resumeDrafts: {
        orderBy: { updatedAt: 'desc' },
      },
      _count: {
        select: {
          activities: true,
          followUps: true,
          revenues: true,
          payments: true,
          coverLetters: true,
          documents: true,
          resumeDrafts: true,
        },
      },
    },
  })
}

export async function getClients(
  userId: string,
  userRole: UserRole,
  filters?: ClientFilters,
  sortOptions?: ClientSortOptions,
  pagination?: ClientPaginationOptions
): Promise<ClientsResult> {
  const where: any = {}

  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
  }

  // Apply filters
  if (filters) {
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.assignedUserId) {
      where.assignedUserId = filters.assignedUserId
    }
    if (filters.reverseRecruiterId) {
      where.reverseRecruiterId = filters.reverseRecruiterId
    }
    if (filters.industry) {
      where.industry = { contains: filters.industry, mode: 'insensitive' }
    }
    if (filters.serviceType) {
      where.serviceType = filters.serviceType
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
    if (filters.hasSkills !== undefined) {
      if (filters.hasSkills) {
        where.skills = { isEmpty: false }
      } else {
        where.skills = { isEmpty: true }
      }
    }
    if (filters.jobSearchInitiated !== undefined) {
      where.jobSearchInitiated = filters.jobSearchInitiated
    }
    if (filters.linkedInOptimized !== undefined) {
      where.linkedInOptimized = filters.linkedInOptimized
    }
    if (filters.whatsappGroupCreated !== undefined) {
      where.whatsappGroupCreated = filters.whatsappGroupCreated
    }
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { industry: { contains: filters.search, mode: 'insensitive' } },
        { currentJobTitle: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { skills: { hasSome: [filters.search] } },
        { gmailId: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
  }

  // Get total count
  const total = await db.client.count({ where })

  // Determine sort order
  const sortBy = sortOptions?.sortBy || 'createdAt'
  const sortOrder = sortOptions?.sortOrder || 'desc'
  const orderBy: any = {}

  switch (sortBy) {
    case 'firstName':
      orderBy.firstName = sortOrder
      break
    case 'lastName':
      orderBy.lastName = sortOrder
      break
    case 'email':
      orderBy.email = sortOrder
      break
    case 'status':
      orderBy.status = sortOrder
      break
    case 'onboardedDate':
      orderBy.onboardedDate = sortOrder
      break
    case 'jobSearchInitiatedAt':
      orderBy.jobSearchInitiatedAt = sortOrder
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

  const clients = await db.client.findMany({
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
      reverseRecruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      _count: {
        select: {
          activities: true,
          followUps: true,
          revenues: true,
          payments: true,
          coverLetters: true,
          documents: true,
        },
      },
    },
    orderBy,
    skip,
    take: pageSize,
  })

  const totalPages = Math.ceil(total / pageSize)

  return {
    clients,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function updateClient(input: UpdateClientInput) {
  const { id, ...data } = updateClientSchema.parse(input)

  const updateData: any = { ...data }

  if (updateData.email === '') {
    updateData.email = null
  }

  if (updateData.skills === undefined) {
    delete updateData.skills
  }

  // Convert date strings to Date objects
  if (updateData.onboardedDate) {
    updateData.onboardedDate = new Date(updateData.onboardedDate)
  }
  if (updateData.whatsappGroupCreatedAt) {
    updateData.whatsappGroupCreatedAt = new Date(updateData.whatsappGroupCreatedAt)
  }
  if (updateData.gmailCreatedAt) {
    updateData.gmailCreatedAt = new Date(updateData.gmailCreatedAt)
  }
  if (updateData.linkedInOptimizedAt) {
    updateData.linkedInOptimizedAt = new Date(updateData.linkedInOptimizedAt)
  }
  if (updateData.jobSearchInitiatedAt) {
    updateData.jobSearchInitiatedAt = new Date(updateData.jobSearchInitiatedAt)
  }

  // Handle null values for optional fields
  if (updateData.onboardedDate === '') updateData.onboardedDate = null
  if (updateData.whatsappGroupCreatedAt === '') updateData.whatsappGroupCreatedAt = null
  if (updateData.gmailCreatedAt === '') updateData.gmailCreatedAt = null
  if (updateData.linkedInOptimizedAt === '') updateData.linkedInOptimizedAt = null
  if (updateData.jobSearchInitiatedAt === '') updateData.jobSearchInitiatedAt = null

  const client = await db.client.update({
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
      reverseRecruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lead: true,
      jobSearchStrategy: true,
      coverLetters: {
        orderBy: { version: 'desc' },
      },
      documents: {
        orderBy: { version: 'desc' },
      },
      _count: {
        select: {
          activities: true,
          followUps: true,
          revenues: true,
          payments: true,
          coverLetters: true,
          documents: true,
        },
      },
    },
  })

  return client
}

export async function deleteClient(clientId: string) {
  await db.client.delete({
    where: { id: clientId },
  })
}

// Export clients to CSV
export async function exportClientsToCSV(
  userId: string,
  userRole: UserRole,
  filters?: ClientFilters
): Promise<string> {
  const where: any = {}

  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
  }

  // Apply filters (same as getClients)
  if (filters) {
    if (filters.status) {
      where.status = filters.status
    }
    if (filters.assignedUserId) {
      where.assignedUserId = filters.assignedUserId
    }
    if (filters.industry) {
      where.industry = { contains: filters.industry, mode: 'insensitive' }
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
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { industry: { contains: filters.search, mode: 'insensitive' } },
        { currentJobTitle: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        { skills: { hasSome: [filters.search] } },
      ]
    }
  }

  const clients = await db.client.findMany({
    where,
    include: {
      assignedUser: {
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
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Industry',
    'Current Job Title',
    'Experience',
    'Skills',
    'Address',
    'Status',
    'Assigned To',
    'Created At',
    'Notes',
  ]

  const rows = clients.map((client) => [
    client.id,
    `"${client.firstName}"`,
    `"${client.lastName}"`,
    `"${client.email || ''}"`,
    `"${client.phone || ''}"`,
    `"${client.industry || ''}"`,
    `"${client.currentJobTitle || ''}"`,
    `"${client.experience || ''}"`,
    `"${(client.skills || []).join(', ')}"`,
    `"${(client.address || '').replace(/"/g, '""')}"`,
    client.status,
    `"${client.assignedUser.firstName} ${client.assignedUser.lastName}"`,
    new Date(client.createdAt).toISOString(),
    `"${(client.notes || '').replace(/"/g, '""')}"`,
  ])

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  return csv
}
