import { z } from 'zod'

/**
 * User-defined name/value rows for Reports → Outreach metrics (stored on Client, embedded in shared report).
 */
export const reportOutreachCustomFieldRowSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  value: z.string().max(5000),
})

export const reportOutreachCustomFieldsSchema = z.array(reportOutreachCustomFieldRowSchema).max(100)

export type ReportOutreachCustomFieldRow = z.infer<typeof reportOutreachCustomFieldRowSchema>

/** Parse JSON from DB; invalid or legacy shapes become []. */
export function parseStoredReportOutreachCustomFields(raw: unknown): ReportOutreachCustomFieldRow[] {
  if (!Array.isArray(raw)) return []
  const out: ReportOutreachCustomFieldRow[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id.trim() : ''
    const label = typeof o.label === 'string' ? o.label.trim() : ''
    const value = typeof o.value === 'string' ? o.value : ''
    if (!id || !label) continue
    out.push({ id, label: label.slice(0, 200), value: value.slice(0, 5000) })
  }
  return out
}

/** Validate and normalize PATCH body for custom outreach rows. */
export function normalizeIncomingReportOutreachCustomFields(raw: unknown): ReportOutreachCustomFieldRow[] {
  if (!Array.isArray(raw)) return []
  const parsed = reportOutreachCustomFieldsSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join('; ') || 'Invalid custom outreach fields')
  }
  return parsed.data.map((r) => ({
    id: r.id.trim(),
    label: r.label.trim(),
    value: r.value.trim(),
  }))
}
