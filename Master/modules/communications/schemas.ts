import { z } from 'zod'
import { MessageChannel, MessageStatus, MessageTemplateType } from '@prisma/client'

/**
 * Create message template schema
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.nativeEnum(MessageTemplateType),
  channel: z.nativeEnum(MessageChannel),
  subject: z.string().optional(),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  enabled: z.boolean().default(true),
})

/**
 * Update message template schema
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.nativeEnum(MessageTemplateType).optional(),
  channel: z.nativeEnum(MessageChannel).optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  variables: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
})

/**
 * Send message schema
 */
export const sendMessageSchema = z.object({
  templateId: z.string().optional(),
  channel: z.nativeEnum(MessageChannel),
  recipientType: z.enum(['candidate', 'client', 'lead', 'user']),
  recipientId: z.string(),
  recipientPhone: z.string().optional(),
  recipientEmail: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().min(1),
  variables: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>

