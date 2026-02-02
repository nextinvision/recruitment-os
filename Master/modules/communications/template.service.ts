/**
 * Message Template Service
 */

import { db } from '@/lib/db'
import { MessageTemplateType, MessageChannel } from '@prisma/client'
import { createTemplateSchema, updateTemplateSchema, CreateTemplateInput, UpdateTemplateInput } from './schemas'

export async function createTemplate(input: CreateTemplateInput & { createdBy: string }) {
  const validated = createTemplateSchema.parse(input)

  const template = await db.messageTemplate.create({
    data: {
      name: validated.name,
      type: validated.type,
      channel: validated.channel,
      subject: validated.subject || null,
      content: validated.content,
      variables: validated.variables ? JSON.stringify(validated.variables) : null,
      enabled: validated.enabled,
      createdBy: input.createdBy,
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return {
    ...template,
    variables: template.variables ? JSON.parse(template.variables) : [],
  }
}

export async function getTemplateById(templateId: string) {
  const template = await db.messageTemplate.findUnique({
    where: { id: templateId },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!template) {
    return null
  }

  return {
    ...template,
    variables: template.variables ? JSON.parse(template.variables) : [],
  }
}

export async function getTemplates(filters?: {
  type?: MessageTemplateType
  channel?: MessageChannel
  enabled?: boolean
}) {
  const templates = await db.messageTemplate.findMany({
    where: {
      ...(filters?.type && { type: filters.type }),
      ...(filters?.channel && { channel: filters.channel }),
      ...(filters?.enabled !== undefined && { enabled: filters.enabled }),
    },
    include: {
      creator: {
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

  return templates.map((template) => ({
    ...template,
    variables: template.variables ? JSON.parse(template.variables) : [],
  }))
}

export async function updateTemplate(input: UpdateTemplateInput & { id: string }) {
  // Extract id first, then validate the rest of the data
  const { id, ...data } = input
  const validated = updateTemplateSchema.parse(data)

  const updateData: any = {}
  if (validated.name !== undefined) updateData.name = validated.name
  if (validated.type !== undefined) updateData.type = validated.type
  if (validated.channel !== undefined) updateData.channel = validated.channel
  if (validated.subject !== undefined) updateData.subject = validated.subject
  if (validated.content !== undefined) updateData.content = validated.content
  if (validated.variables !== undefined) updateData.variables = JSON.stringify(validated.variables)
  if (validated.enabled !== undefined) updateData.enabled = validated.enabled

  const template = await db.messageTemplate.update({
    where: { id },
    data: updateData,
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return {
    ...template,
    variables: template.variables ? JSON.parse(template.variables) : [],
  }
}

export async function deleteTemplate(templateId: string) {
  await db.messageTemplate.delete({
    where: { id: templateId },
  })
}

/**
 * Get template by type and channel
 */
export async function getTemplateByType(
  type: MessageTemplateType,
  channel: MessageChannel
) {
  const template = await db.messageTemplate.findFirst({
    where: {
      type,
      channel,
      enabled: true,
    },
  })

  if (!template) {
    return null
  }

  return {
    ...template,
    variables: template.variables ? JSON.parse(template.variables) : [],
  }
}

