import { db } from '@/lib/db'
import { AttachmentType } from '@prisma/client'
import { z } from 'zod'

const createAttachmentSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  type: z.nativeEnum(AttachmentType),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  linkUrl: z.string().url().optional(),
  linkTitle: z.string().optional(),
  textContent: z.string().optional(),
  description: z.string().optional(),
  uploadedBy: z.string().min(1, 'Uploader ID is required'),
}).refine(
  (data) => {
    if (data.type === 'FILE') {
      return !!(data.fileUrl && data.fileName && data.fileSize)
    }
    if (data.type === 'LINK') {
      return !!(data.linkUrl && data.linkTitle)
    }
    if (data.type === 'TEXT') {
      return !!data.textContent
    }
    return false
  },
  {
    message: 'Invalid attachment data for the specified type',
  }
)

const updateAttachmentSchema = z.object({
  id: z.string().min(1),
  linkTitle: z.string().optional(),
  textContent: z.string().optional(),
  description: z.string().optional(),
})

export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>
export type UpdateAttachmentInput = z.infer<typeof updateAttachmentSchema>

export async function createAttachment(input: CreateAttachmentInput) {
  const validated = createAttachmentSchema.parse(input)

  // Validate application exists
  const application = await db.application.findUnique({
    where: { id: validated.applicationId },
  })

  if (!application) {
    throw new Error('Application not found')
  }

  const attachment = await db.applicationAttachment.create({
    data: {
      applicationId: validated.applicationId,
      type: validated.type,
      fileUrl: validated.fileUrl || null,
      fileName: validated.fileName || null,
      fileSize: validated.fileSize || null,
      linkUrl: validated.linkUrl || null,
      linkTitle: validated.linkTitle || null,
      textContent: validated.textContent || null,
      description: validated.description || null,
      uploadedBy: validated.uploadedBy,
    },
    include: {
      application: {
        select: {
          id: true,
          job: {
            select: {
              title: true,
              company: true,
            },
          },
        },
      },
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

  return attachment
}

export async function getAttachmentById(attachmentId: string) {
  return db.applicationAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      application: {
        select: {
          id: true,
          job: {
            select: {
              title: true,
              company: true,
            },
          },
        },
      },
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

export async function getAttachmentsByApplication(applicationId: string) {
  return db.applicationAttachment.findMany({
    where: { applicationId },
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
    orderBy: { uploadedAt: 'desc' },
  })
}

export async function updateAttachment(input: UpdateAttachmentInput) {
  const { id, ...data } = updateAttachmentSchema.parse(input)

  const attachment = await db.applicationAttachment.findUnique({
    where: { id },
  })

  if (!attachment) {
    throw new Error('Attachment not found')
  }

  // Only allow updating certain fields based on type
  const updateData: any = {}
  if (attachment.type === 'LINK' && data.linkTitle !== undefined) {
    updateData.linkTitle = data.linkTitle
  }
  if (attachment.type === 'TEXT' && data.textContent !== undefined) {
    updateData.textContent = data.textContent
  }
  if (data.description !== undefined) {
    updateData.description = data.description
  }

  return db.applicationAttachment.update({
    where: { id },
    data: updateData,
    include: {
      application: {
        select: {
          id: true,
          job: {
            select: {
              title: true,
              company: true,
            },
          },
        },
      },
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

export async function deleteAttachment(attachmentId: string) {
  await db.applicationAttachment.delete({
    where: { id: attachmentId },
  })
}


