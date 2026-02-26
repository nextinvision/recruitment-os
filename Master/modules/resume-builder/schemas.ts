import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().default(''),
  location: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().default(''),
  linkedin: z.string().default(''),
})

const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  location: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()),
})

const educationSchema = z.object({
  id: z.string(),
  degree: z.string(),
  specialization: z.string().optional(),
  institution: z.string(),
})

const awardSchema = z.object({
  id: z.string(),
  title: z.string(),
  organization: z.string(),
  year: z.string(),
})

const certificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  issuer: z.string(),
})

export const resumeDocumentSchema = z.object({
  contact: contactSchema,
  profile: z.string().default(''),
  skills: z.array(z.string()).default([]),
  awards: z.array(awardSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  customSections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        items: z.array(z.string()),
      })
    )
    .optional(),
})

export const createResumeDraftSchema = z.object({
  content: resumeDocumentSchema,
  clientId: z.string().optional(),
  template: z.string().optional(),
})

export const updateResumeDraftSchema = createResumeDraftSchema.partial()

export const tailorResumeSchema = z.object({
  resume_data: resumeDocumentSchema,
  job_id: z.string().min(1),
})

export type ResumeDocumentInput = z.infer<typeof resumeDocumentSchema>
export type CreateResumeDraftInput = z.infer<typeof createResumeDraftSchema>
