import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import {
  createCandidateSchema,
  updateCandidateSchema,
  CreateCandidateInput,
  UpdateCandidateInput,
} from './schemas'

export async function createCandidate(input: CreateCandidateInput) {
  const validated = createCandidateSchema.parse(input)

  const candidate = await db.candidate.create({
    data: validated,
    include: {
      assignedRecruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return candidate
}

export async function getCandidateById(candidateId: string) {
  return db.candidate.findUnique({
    where: { id: candidateId },
    include: {
      assignedRecruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

export async function getCandidates(userId: string, userRole: UserRole) {
  const where =
    userRole === UserRole.ADMIN || userRole === UserRole.MANAGER
      ? {}
      : { assignedRecruiterId: userId }

  return db.candidate.findMany({
    where,
    include: {
      assignedRecruiter: {
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

export async function updateCandidate(input: UpdateCandidateInput) {
  const { id, ...data } = updateCandidateSchema.parse(input)

  const candidate = await db.candidate.update({
    where: { id },
    data,
    include: {
      assignedRecruiter: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return candidate
}

export async function deleteCandidate(candidateId: string) {
  await db.candidate.delete({
    where: { id: candidateId },
  })
}

