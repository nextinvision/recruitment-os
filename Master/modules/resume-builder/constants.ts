/**
 * Resume export layout constants.
 * Single source of truth for page margins so PDF and Word match.
 * Word (docx) uses these; PDF print and on-screen preview use the same values.
 */
export const RESUME_PAGE_MARGIN_TOP_BOTTOM_PT = 30
export const RESUME_PAGE_MARGIN_LEFT_RIGHT_CM = '1cm'

/** CSS padding string for .resume-preview (top/bottom pt, left/right cm). Use in print and preview. */
export const RESUME_PREVIEW_PADDING_CSS = `${RESUME_PAGE_MARGIN_TOP_BOTTOM_PT}pt ${RESUME_PAGE_MARGIN_LEFT_RIGHT_CM}`
