import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

type ClientStatus = 'ACTIVE' | 'INACTIVE'
import {
  createClientSchema,
  updateClientSchema,
  CreateClientInput,
  UpdateClientInput,
} from './schemas'

export async function createClient(input: CreateClientInput) {
  const validated = createClientSchema.parse(input)

  const client = await db.client.create({
    data: {
      ...validated,
      email: validated.email || null,
      skills: validated.skills || [],
      leadId: validated.leadId || null,
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
      lead: true,
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
      lead: true,
      _count: {
        select: {
          activities: true,
          followUps: true,
          revenues: true,
          payments: true,
        },
      },
    },
  })
}

export async function getClients(userId: string, userRole: UserRole, status?: ClientStatus) {
  const where: any = {}
  
  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
  }
  
  // Status filtering
  if (status) {
    where.status = status
  }

  return db.client.findMany({
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
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateClient(input: UpdateClientInput) {
  const { id, ...data } = updateClientSchema.parse(input)

  const updateData: any = { ...data }
  
  if (updateData.email === '') {
    updateData.email = null
  }
  
  if (updateData.skills === undefined) {
    updateData.skills = []
  }

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
      lead: true,
    },
  })

  return client
}

export async function deleteClient(clientId: string) {
  await db.client.delete({
    where: { id: clientId },
  })
}

