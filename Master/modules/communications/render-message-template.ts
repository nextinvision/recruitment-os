/**
 * Shared {{variable}} replacement for emails, WhatsApp, and previews.
 * - Normalizes fullwidth Unicode braces (common when pasting from Word / some editors)
 * - Escapes regex metacharacters in variable keys
 * - Fills clientName ↔ fullName ↔ firstName + lastName when only some are provided
 */

function normalizeTemplateString(template: string): string {
  return template
    .replace(/\uFEFF/g, '')
    .replace(/\u200B/g, '')
    .replace(/\uFF5B/g, '{')
    .replace(/\uFF5D/g, '}')
}

function applyClientNameAliases(variables: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...variables }
  const fn = String(out.firstName ?? '').trim()
  const ln = String(out.lastName ?? '').trim()
  const fromParts = `${fn} ${ln}`.trim()

  const cn = out.clientName != null && String(out.clientName).trim() !== '' ? String(out.clientName).trim() : ''
  const fnFull = out.fullName != null && String(out.fullName).trim() !== '' ? String(out.fullName).trim() : ''

  if (!cn && fnFull) out.clientName = fnFull
  if (!fnFull && cn) out.fullName = cn
  if (!out.clientName && fromParts) out.clientName = fromParts
  if (!out.fullName && fromParts) out.fullName = fromParts

  return out
}

/** Follow-ups use contactName; many templates say {{name}} */
function applyAutomationAliases(variables: Record<string, unknown>): Record<string, unknown> {
  const out = applyClientNameAliases(variables)
  const contact = out.contactName != null && String(out.contactName).trim() !== '' ? String(out.contactName).trim() : ''
  if (!out.name && contact) out.name = contact
  if (!out.contactName && out.name) out.contactName = String(out.name)
  return out
}

/**
 * Replace {{key}} placeholders (optional internal whitespace).
 */
export function renderMessageTemplate(template: string, variables: Record<string, unknown>): string {
  let rendered = normalizeTemplateString(template)
  const vars = applyAutomationAliases(variables)

  Object.entries(vars).forEach(([key, value]) => {
    const escaped = String(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`{{\\s*${escaped}\\s*}}`, 'g')
    const str = value === null || value === undefined ? '' : String(value)
    rendered = rendered.replace(regex, str)
  })

  return rendered
}
