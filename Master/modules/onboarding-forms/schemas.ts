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

export type FormField = z.infer<typeof formFieldSchema>

/** Section headers are not submitted; uniqueness only matters for real inputs (shared state / submission keys). */
function refUniqueNonSectionFieldKeys(fields: FormField[], ctx: z.RefinementCtx) {
  const seen = new Set<string>()
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i]
    if (f.type === 'section') continue
    const k = f.key.trim()
    if (seen.has(k)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Each input field must have a unique key. Duplicate: "${k}"`,
        path: ['fields', i, 'key'],
      })
    }
    seen.add(k)
  }
}

export const createOnboardingFormSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    fields: z.array(formFieldSchema).min(1, 'At least one field is required'),
  })
  .superRefine((data, ctx) => refUniqueNonSectionFieldKeys(data.fields, ctx))

export const updateOnboardingFormSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    fields: z.array(formFieldSchema).min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fields != null) refUniqueNonSectionFieldKeys(data.fields, ctx)
  })

export const submitOnboardingFormSchema = z.object({
  data: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])),
  leadId: z.string().nullable().optional(),
})

export type CreateOnboardingFormInput = z.infer<typeof createOnboardingFormSchema>
export type UpdateOnboardingFormInput = z.infer<typeof updateOnboardingFormSchema>
export type SubmitOnboardingFormInput = z.infer<typeof submitOnboardingFormSchema>
