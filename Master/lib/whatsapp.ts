/**
 * WhatsApp utility - opens WhatsApp (desktop/web) with pre-filled message.
 * User manually sends from their logged-in WhatsApp.
 */

/**
 * Normalize phone to digits only with country code.
 * E.g. "+91 98765 43210" or "9876543210" -> "919876543210"
 */
export function normalizePhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  // 10 digits: assume India (+91)
  if (digits.length === 10) return '91' + digits
  // 11+ digits: use as is (already has country code)
  return digits
}

/**
 * Turn HTML email body into plain text suitable for WhatsApp (wa.me has length limits; keep concise).
 */
export function stripHtmlForWhatsApp(html: string): string {
  if (!html || typeof html !== 'string') return ''
  let t = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
  return t
}

/**
 * Open WhatsApp with pre-filled message.
 * Opens wa.me URL which launches WhatsApp desktop or web.
 */
export function openWhatsAppWithMessage(phone: string | null | undefined, message: string): boolean {
  const normalized = normalizePhoneForWhatsApp(phone)
  if (!normalized) return false
  const encoded = encodeURIComponent(message)
  const url = `https://wa.me/${normalized}?text=${encoded}`
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
