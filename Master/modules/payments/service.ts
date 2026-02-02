import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import {
  createPaymentSchema,
  updatePaymentSchema,
  CreatePaymentInput,
  UpdatePaymentInput,
} from './schemas'
import { updateRevenueStatusFromPayments } from '../revenues/service'

export async function createPayment(input: CreatePaymentInput) {
  const validated = createPaymentSchema.parse(input)

  const payment = await db.payment.create({
    data: {
      ...validated,
      amount: validated.amount.toString(),
      paymentDate: validated.paymentDate ? new Date(validated.paymentDate) : new Date(),
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
      revenue: true,
      client: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
  })

  // Update revenue status based on payments
  await updateRevenueStatusFromPayments(validated.revenueId)

  return payment
}

export async function getPaymentById(paymentId: string) {
  return db.payment.findUnique({
    where: { id: paymentId },
    include: {
      assignedUser: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      revenue: true,
      client: true,
    },
  })
}

export async function getPayments(
  userId: string,
  userRole: UserRole,
  filters?: {
    revenueId?: string
    clientId?: string
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
  if (filters?.revenueId) {
    where.revenueId = filters.revenueId
  }
  
  if (filters?.clientId) {
    where.clientId = filters.clientId
  }
  
  if (filters?.startDate || filters?.endDate) {
    where.paymentDate = {}
    if (filters.startDate) {
      where.paymentDate.gte = filters.startDate
    }
    if (filters.endDate) {
      where.paymentDate.lte = filters.endDate
    }
  }

  return db.payment.findMany({
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
      revenue: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
      client: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
    orderBy: { paymentDate: 'desc' },
  })
}

export async function updatePayment(input: UpdatePaymentInput) {
  const { id, ...data } = updatePaymentSchema.parse(input)

  const updateData: any = { ...data }
  
  if (updateData.amount !== undefined) {
    updateData.amount = updateData.amount.toString()
  }
  
  if (updateData.paymentDate) {
    updateData.paymentDate = new Date(updateData.paymentDate)
  }

  const payment = await db.payment.update({
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
      revenue: true,
      client: true,
    },
  })

  // Update revenue status based on payments
  if (payment.revenueId) {
    await updateRevenueStatusFromPayments(payment.revenueId)
  }

  return payment
}

export async function deletePayment(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { revenueId: true },
  })

  await db.payment.delete({
    where: { id: paymentId },
  })

  // Update revenue status after payment deletion
  if (payment?.revenueId) {
    await updateRevenueStatusFromPayments(payment.revenueId)
  }
}

