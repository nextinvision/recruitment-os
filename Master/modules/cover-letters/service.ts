import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

export const createCoverLetterSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().min(1, 'File size is required'),
  uploadedBy: z.string().min(1, 'Uploaded by is required'),
})

export const updateCoverLetterSchema = createCoverLetterSchema.partial().extend({
  id: z.string().min(1),
})

export type CreateCoverLetterInput = z.infer<typeof createCoverLetterSchema>
export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>

export async function createCoverLetter(input: CreateCoverLetterInput) {
  const validated = createCoverLetterSchema.parse(input)

  // Get the latest version for this client
  const latestCoverLetter = await db.coverLetter.findFirst({
    where: { clientId: validated.clientId },
    orderBy: { version: 'desc' },
  })

  const nextVersion = latestCoverLetter ? latestCoverLetter.version + 1 : 1

  const coverLetter = await db.coverLetter.create({
    data: {
      ...validated,
      version: nextVersion,
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return coverLetter
}

export async function getCoverLetterById(coverLetterId: string) {
  return db.coverLetter.findUnique({
    where: { id: coverLetterId },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

export async function getCoverLettersByClient(clientId: string) {
  return db.coverLetter.findMany({
    where: { clientId },
    orderBy: { version: 'desc' },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

export async function getLatestCoverLetter(clientId: string) {
  return db.coverLetter.findFirst({
    where: { clientId },
    orderBy: { version: 'desc' },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

export async function updateCoverLetter(input: UpdateCoverLetterInput) {
  const { id, ...data } = updateCoverLetterSchema.parse(input)

  const coverLetter = await db.coverLetter.update({
    where: { id },
    data,
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return coverLetter
}

export async function deleteCoverLetter(coverLetterId: string) {
  await db.coverLetter.delete({
    where: { id: coverLetterId },
  })
}

