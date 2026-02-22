import { db } from '@/lib/db'
import { storageService } from '@/lib/storage'

export interface UploadLeadDocumentInput {
  leadId: string
  buffer: Buffer
  originalFileName: string
  contentType: string
  uploadedBy: string
}

export async function uploadLeadDocument(input: UploadLeadDocumentInput) {
  const { leadId, buffer, originalFileName, contentType, uploadedBy } = input
  const name = originalFileName?.trim() || 'document'

  const result = await storageService.uploadFile(
    buffer,
    name,
    'DOCUMENT',
    contentType || 'application/octet-stream'
  )

  const doc = await db.leadDocument.create({
    data: {
      leadId,
      fileName: result.fileName,
      fileUrl: result.fileUrl,
      originalFileName: name,
      fileSize: result.fileSize,
      mimeType: contentType || null,
      uploadedBy,
    },
    include: {
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return doc
}

export async function getLeadDocumentsByLeadId(leadId: string) {
  return db.leadDocument.findMany({
    where: { leadId },
    orderBy: { uploadedAt: 'desc' },
    include: {
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })
}

export async function getLeadDocumentById(id: string) {
  return db.leadDocument.findUnique({
    where: { id },
    include: {
      lead: true,
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })
}

export async function deleteLeadDocument(id: string): Promise<void> {
  const doc = await db.leadDocument.findUnique({
    where: { id },
  })
  if (!doc) {
    throw new Error('Lead document not found')
  }
  try {
    await storageService.deleteFile(doc.fileName, 'DOCUMENT')
  } catch (err) {
    console.error('Failed to delete file from storage:', err)
  }
  await db.leadDocument.delete({
    where: { id },
  })
}
