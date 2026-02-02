import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST'
import {
  createLeadSchema,
  updateLeadSchema,
  CreateLeadInput,
  UpdateLeadInput,
} from './schemas'

export async function createLead(input: CreateLeadInput) {
  const validated = createLeadSchema.parse(input)

  const lead = await db.lead.create({
    data: {
      ...validated,
      email: validated.email || null,
      estimatedValue: validated.estimatedValue ? validated.estimatedValue.toString() : null,
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
    },
  })

  return lead
}

export async function getLeadById(leadId: string) {
  return db.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      client: true,
      _count: {
        select: {
          activities: true,
          followUps: true,
          revenues: true,
        },
      },
    },
  })
}

export async function getLeads(userId: string, userRole: UserRole, status?: LeadStatus) {
  const where: any = {}
  
  // Role-based filtering
  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    where.assignedUserId = userId
  }
  
  // Status filtering
  if (status) {
    where.status = status
  }

  return db.lead.findMany({
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

export async function getLeadsByStatus(status: LeadStatus) {
  return db.lead.findMany({
    where: { status },
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

export async function updateLead(input: UpdateLeadInput) {
  const { id, ...data } = updateLeadSchema.parse(input)

  const updateData: any = { ...data }
  
  if (updateData.estimatedValue !== undefined) {
    updateData.estimatedValue = updateData.estimatedValue ? updateData.estimatedValue.toString() : null
  }
  
  if (updateData.email === '') {
    updateData.email = null
  }
  
      // If status changes to QUALIFIED, set convertedAt
      if (updateData.status === 'QUALIFIED') {
        const currentLead = await db.lead.findUnique({ where: { id } })
        if (currentLead && currentLead.status !== 'QUALIFIED') {
          updateData.convertedAt = new Date()
        }
      }

  const lead = await db.lead.update({
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
    },
  })

  return lead
}

export async function deleteLead(leadId: string) {
  await db.lead.delete({
    where: { id: leadId },
  })
}

