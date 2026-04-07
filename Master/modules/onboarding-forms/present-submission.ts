/**
 * Turn stored form field definitions + submission answers into ordered rows for CRM UI.
 * Keeps presentation logic out of React and API routes.
 */

export type FormFieldDef = {
  id: string
  key: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  placeholder?: string
}

export function parseFormFields(raw: unknown): FormFieldDef[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (x): x is FormFieldDef =>
      x != null &&
      typeof x === 'object' &&
      typeof (x as FormFieldDef).key === 'string' &&
      typeof (x as FormFieldDef).label === 'string'
  )
}

function formatAnswer(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value.trim() === '' ? '—' : value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean).join(', ') || '—'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export type OnboardingDisplayRow =
  | { kind: 'section'; title: string }
  | { kind: 'field'; label: string; value: string; fieldKey: string }

/**
 * Build rows following the form definition order, then any extra keys in `data` not in the form.
 */
export function buildOnboardingDisplayRows(
  formFieldsJson: unknown,
  dataJson: unknown
): OnboardingDisplayRow[] {
  const data =
    dataJson && typeof dataJson === 'object' && !Array.isArray(dataJson)
      ? (dataJson as Record<string, unknown>)
      : {}
  const fields = parseFormFields(formFieldsJson)
  const usedKeys = new Set<string>()
  const rows: OnboardingDisplayRow[] = []

  for (const f of fields) {
    if (f.type === 'section') {
      rows.push({ kind: 'section', title: f.label || 'Section' })
      continue
    }
    usedKeys.add(f.key)
    const value = formatAnswer(data[f.key])
    rows.push({ kind: 'field', label: f.label || f.key, value, fieldKey: f.key })
  }

  const orphanKeys = Object.keys(data).filter((k) => !usedKeys.has(k))
  if (orphanKeys.length > 0) {
    rows.push({ kind: 'section', title: 'Additional responses' })
    for (const key of orphanKeys.sort()) {
      rows.push({
        kind: 'field',
        label: key,
        value: formatAnswer(data[key]),
        fieldKey: key,
      })
    }
  }

  return rows
}

/**
 * Resolve a value from submission data using the form's field `type` (e.g. first `email` or `phone` field).
 */
export function getSubmissionValueByFieldType(
  data: Record<string, unknown>,
  formFieldsJson: unknown,
  type: 'email' | 'phone'
): string | undefined {
  const fields = parseFormFields(formFieldsJson)
  const key = fields.find((f) => f.type === type)?.key
  if (!key) return undefined
  const v = data[key]
  if (v == null) return undefined
  const s = String(v).trim()
  return s || undefined
}
