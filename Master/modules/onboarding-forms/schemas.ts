import { z } from 'zod'

export const formFieldSchema = z.object({
  id: z.string(),
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'email', 'phone', 'number', 'textarea', 'select', 'section']),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(), // for select
  placeholder: z.string().optional(),
})

export const createOnboardingFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1, 'At least one field is required'),
})

export const updateOnboardingFormSchema = createOnboardingFormSchema.partial()

export const submitOnboardingFormSchema = z.object({
  data: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])),
})

export type FormField = z.infer<typeof formFieldSchema>
export type CreateOnboardingFormInput = z.infer<typeof createOnboardingFormSchema>
export type UpdateOnboardingFormInput = z.infer<typeof updateOnboardingFormSchema>
export type SubmitOnboardingFormInput = z.infer<typeof submitOnboardingFormSchema>
