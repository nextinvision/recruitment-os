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
      currentCompany: validated.currentCompany || null,
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

  const leads = await db.lead.findMany({
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
      client: { select: { id: true } },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })

  if (!Array.isArray(leads) || leads.length === 0) return leads

  // For NEW-stage prioritization: compute each lead's nearest upcoming MEETING.
  const now = new Date()
  const leadIds = leads.map((l) => l.id)
  const upcomingMeetings = await db.activity.findMany({
    where: {
      leadId: { in: leadIds },
      type: 'MEETING',
      occurredAt: { gte: now },
    },
    select: {
      leadId: true,
      occurredAt: true,
    },
    orderBy: [{ occurredAt: 'asc' }],
  })

  const nextMeetingByLead = new Map<string, Date>()
  for (const m of upcomingMeetings) {
    if (!m.leadId) continue
    if (!nextMeetingByLead.has(m.leadId)) {
      nextMeetingByLead.set(m.leadId, m.occurredAt)
    }
  }

  const enriched = leads.map((lead: any) => ({
    ...lead,
    nextMeetingAt: nextMeetingByLead.get(lead.id) || null,
  }))

  // Root-level ordering rule:
  // 1) NEW leads with upcoming calls first (nearest first),
  // 2) then all other leads by existing order (createdAt desc, id desc).
  enriched.sort((a: any, b: any) => {
    const aIsNew = a.status === 'NEW'
    const bIsNew = b.status === 'NEW'
    const aNext = a.nextMeetingAt ? new Date(a.nextMeetingAt).getTime() : null
    const bNext = b.nextMeetingAt ? new Date(b.nextMeetingAt).getTime() : null

    if (aIsNew && bIsNew) {
      if (aNext != null && bNext != null) return aNext - bNext
      if (aNext != null) return -1
      if (bNext != null) return 1
    }

    const aCreated = new Date(a.createdAt).getTime()
    const bCreated = new Date(b.createdAt).getTime()
    if (aCreated !== bCreated) return bCreated - aCreated
    return String(b.id).localeCompare(String(a.id))
  })

  return enriched
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
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
  if (updateData.currentCompany === '') {
    updateData.currentCompany = null
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

