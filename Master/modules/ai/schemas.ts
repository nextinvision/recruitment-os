import { z } from 'zod'

export const analyzeResumeSchema = z.object({
  resumeText: z.string().min(1),
  jobDescription: z.string().optional(),
})

export const optimizeLinkedInSchema = z.object({
  candidateId: z.string().min(1),
  currentProfile: z.string().optional(),
})

export const matchJobsSchema = z.object({
  candidateId: z.string().min(1),
  limit: z.number().min(1).max(50).default(10),
})

export const generateMessageSchema = z.object({
  type: z.enum(['cold_outreach', 'follow_up', 'job_sharing']),
  candidateId: z.string().min(1),
  jobId: z.string().optional(),
  tone: z.enum(['professional', 'friendly', 'casual']).default('professional'),
})

export const generateWeeklyPlanSchema = z.object({
  recruiterId: z.string().min(1),
  week: z.string().optional(), // ISO date string
})

export type AnalyzeResumeInput = z.infer<typeof analyzeResumeSchema>
export type OptimizeLinkedInInput = z.infer<typeof optimizeLinkedInSchema>
export type MatchJobsInput = z.infer<typeof matchJobsSchema>
export type GenerateMessageInput = z.infer<typeof generateMessageSchema>
export type GenerateWeeklyPlanInput = z.infer<typeof generateWeeklyPlanSchema>

