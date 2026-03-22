import { db } from '@/lib/db'
import { createResumeDraftSchema, updateResumeDraftSchema } from './schemas'
import type { ResumeDocument } from './types'

export async function createResumeDraft(
  userId: string,
  input: { content: ResumeDocument; clientId?: string; template?: string; atsScore?: number; atsAnalysis?: any }
) {
  const validated = createResumeDraftSchema.parse(input)
  return db.resumeDraft.create({
    data: {
      userId,
      clientId: validated.clientId ?? null,
      content: validated.content as object,
      template: validated.template ?? 'professional',
      atsScore: validated.atsScore ?? null,
      atsAnalysis: validated.atsAnalysis ?? null,
    },
  })
}

export async function updateResumeDraft(
  id: string,
  userId: string,
  input: Partial<{ content: ResumeDocument; template: string; clientId: string | null; atsScore: number; atsAnalysis: any }>
) {
  const validated = updateResumeDraftSchema.parse(input)
  await db.resumeDraft.findFirstOrThrow({
    where: { id, userId },
  })
  return db.resumeDraft.update({
    where: { id },
    data: {
      ...(validated.content && { content: validated.content as object }),
      ...(validated.template && { template: validated.template }),
      ...('clientId' in validated && { clientId: validated.clientId }),
      ...('atsScore' in validated && { atsScore: validated.atsScore }),
      ...('atsAnalysis' in validated && { atsAnalysis: validated.atsAnalysis }),
    },
  })
}

export async function getResumeDraft(id: string, userId: string) {
  return db.resumeDraft.findFirstOrThrow({
    where: { id, userId },
  })
}

export async function listResumeDrafts(userId: string) {
  return db.resumeDraft.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function deleteResumeDraft(id: string, userId: string) {
  await db.resumeDraft.findFirstOrThrow({
    where: { id, userId },
  })
  return db.resumeDraft.delete({
    where: { id },
  })
}
