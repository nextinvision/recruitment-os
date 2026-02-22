import { db } from '@/lib/db'
import { DocumentType } from '@prisma/client'
import { z } from 'zod'

export const createClientDocumentSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  type: z.nativeEnum(DocumentType),
  fileUrl: z.string().min(1, 'File URL is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().int().min(1, 'File size is required'),
  uploadedBy: z.string().min(1, 'Uploaded by is required'),
  description: z.string().optional(),
})

export const updateClientDocumentSchema = createClientDocumentSchema.partial().extend({
  id: z.string().min(1),
})

export type CreateClientDocumentInput = z.infer<typeof createClientDocumentSchema>
export type UpdateClientDocumentInput = z.infer<typeof updateClientDocumentSchema>

export async function createClientDocument(input: CreateClientDocumentInput) {
  const validated = createClientDocumentSchema.parse(input)

  // Get the latest version for this client and document type
  const latestDocument = await db.clientDocument.findFirst({
    where: {
      clientId: validated.clientId,
      type: validated.type,
    },
    orderBy: { version: 'desc' },
  })

  const nextVersion = latestDocument ? latestDocument.version + 1 : 1

  const document = await db.clientDocument.create({
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

  return document
}

export async function getClientDocumentById(documentId: string) {
  return db.clientDocument.findUnique({
    where: { id: documentId },
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

export async function getClientDocumentsByClient(clientId: string, type?: DocumentType) {
  const where: any = { clientId }
  if (type) {
    where.type = type
  }

  return db.clientDocument.findMany({
    where,
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

export async function getLatestClientDocument(clientId: string, type: DocumentType) {
  return db.clientDocument.findFirst({
    where: {
      clientId,
      type,
    },
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

export async function updateClientDocument(input: UpdateClientDocumentInput) {
  const { id, ...data } = updateClientDocumentSchema.parse(input)

  const document = await db.clientDocument.update({
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

  return document
}

export async function deleteClientDocument(documentId: string) {
  await db.clientDocument.delete({
    where: { id: documentId },
  })
}

