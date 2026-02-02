import { db } from '@/lib/db'
import { UserRole, RevenueStatus } from '@prisma/client'
import {
  createRevenueSchema,
  updateRevenueSchema,
  CreateRevenueInput,
  UpdateRevenueInput,
} from './schemas'

// Use string literals for enum values (Prisma accepts these as valid enum values)
const RevenueStatusValues = {
  PENDING: 'PENDING' as RevenueStatus,
  PARTIAL: 'PARTIAL' as RevenueStatus,
  PAID: 'PAID' as RevenueStatus,
}

export async function createRevenue(input: CreateRevenueInput) {
  const validated = createRevenueSchema.parse(input)

  const revenue = await db.revenue.create({
    data: {
      ...validated,
      amount: validated.amount.toString(),
      leadId: validated.leadId || null,
      clientId: validated.clientId || null,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
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
        },
      },
      client: {
        select: {
          id: true,
          companyName: true,
        },
      },
      _count: {
        select: {
          payments: true,
        },
      },
    },
  })

  return revenue
}

export async function getRevenueById(revenueId: string) {
  return db.revenue.findUnique({
    where: { id: revenueId },
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
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  })
}

export async function getRevenues(
  userId: string,
  userRole: UserRole,
  filters?: {
    leadId?: string
    clientId?: string
    status?: RevenueStatus
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
  
  if (filters?.status) {
    where.status = filters.status
  }
  
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  return db.revenue.findMany({
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
        },
      },
      client: {
        select: {
          id: true,
          companyName: true,
        },
      },
      _count: {
        select: {
          payments: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateRevenue(input: UpdateRevenueInput) {
  const { id, ...data } = updateRevenueSchema.parse(input)

  const updateData: any = { ...data }
  
  if (updateData.amount !== undefined) {
    updateData.amount = updateData.amount.toString()
  }
  
  if (updateData.dueDate) {
    updateData.dueDate = new Date(updateData.dueDate)
  }
  
  if (updateData.paidDate) {
    updateData.paidDate = new Date(updateData.paidDate)
    // Auto-update status to PAID if paidDate is set
    if (!updateData.status) {
      updateData.status = RevenueStatusValues.PAID
    }
  }
  
  // Auto-update status based on payments
  if (updateData.status === 'PAID' && !updateData.paidDate) {
    updateData.paidDate = new Date()
  }

  const revenue = await db.revenue.update({
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
      client: true,
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  })

  return revenue
}

export async function deleteRevenue(revenueId: string) {
  await db.revenue.delete({
    where: { id: revenueId },
  })
}

// Calculate total paid amount for a revenue
export async function getRevenuePaidAmount(revenueId: string): Promise<number> {
  const payments = await db.payment.findMany({
    where: { revenueId },
    select: { amount: true },
  })

  return payments.reduce((sum, payment) => {
    return sum + parseFloat(payment.amount.toString())
  }, 0)
}

// Update revenue status based on payments
export async function updateRevenueStatusFromPayments(revenueId: string) {
  const revenue = await db.revenue.findUnique({
    where: { id: revenueId },
    include: { payments: true },
  })

  if (!revenue) return

  const totalPaid = await getRevenuePaidAmount(revenueId)
  const revenueAmount = parseFloat(revenue.amount.toString())

  let newStatus: RevenueStatus
  if (totalPaid >= revenueAmount) {
    newStatus = RevenueStatusValues.PAID
  } else if (totalPaid > 0) {
    newStatus = RevenueStatusValues.PARTIAL
  } else {
    newStatus = RevenueStatusValues.PENDING
  }

  await db.revenue.update({
    where: { id: revenueId },
    data: {
      status: newStatus,
      paidDate: newStatus === RevenueStatusValues.PAID ? new Date() : null,
    },
  })
}

