/**
 * System-controlled link blocks for transactional email.
 * User-editable templates should not be the only place a magic/report/onboarding URL appears —
 * callers pass `appendedEmailHtml` via MessageService and link-shaped placeholders are blanked
 * in the body so wrong {{variables}} cannot break delivery.
 */

/**
 * Placeholder keys that represent URLs we typically append after the template body.
 * When `appendedEmailHtml` is set, these are forced to empty string for **body** rendering only
 * (subject still receives full variables so rare {{reportUrl}} in subject can work).
 */
export const TEMPLATE_LINK_VARIABLE_KEYS: readonly string[] = [
  'reportUrl',
  'reportLink',
  'link',
  'publicReportUrl',
  'approvalUrl',
  'approvalLink',
  'onboardingLink',
  'formLink',
  'resumeViewUrl',
  'resumeUrl',
  'resumeLink',
  'calendlyUrl',
  'meetingUrl',
  'magicLink',
  'scheduledEventLink',
  'bookingLink',
]

export function blankTemplateLinkVariablesForBody(variables: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...variables }
  for (const k of TEMPLATE_LINK_VARIABLE_KEYS) {
    out[k] = ''
  }
  return out
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Standard HTML block appended after the rendered template (email only).
 * URL is escaped for text nodes and attribute context used here.
 */
export function buildEmailLinkAppendSection(options: {
  url: string
  heading?: string
  buttonLabel?: string
  intro?: string
}): string {
  const { url, heading = 'Your link', buttonLabel = 'Open link', intro } = options
  if (!url || !url.trim()) return ''
  const safeUrl = escapeHtml(url.trim())
  const introBlock = intro
    ? `<p style="margin:0 0 12px 0;">${escapeHtml(intro)}</p>`
    : ''
  return `
<div class="ros-appended-link" style="margin-top:24px;padding-top:20px;border-top:1px solid #E5E7EB;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#334155;">
  <p style="margin:0 0 8px 0;font-weight:600;color:#0f172a;">${escapeHtml(heading)}</p>
  ${introBlock}
  <p style="margin:0 0 12px 0;">
    <a href="${safeUrl}" style="display:inline-block;background:#1F3A5F;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:600;">${escapeHtml(buttonLabel)}</a>
  </p>
  <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;">If the button does not work, copy and paste this URL into your browser:<br/><a href="${safeUrl}" style="color:#2563eb;">${safeUrl}</a></p>
</div>`.trim()
}
