/**
 * HTML <input type="date"> sends YYYY-MM-DD. Normalize to UTC day bounds for createdAt filters.
 * Full ISO datetimes are passed through as-is.
 */
export function parseApplicationFilterBoundaryDate(value: string, boundary: 'start' | 'end'): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return boundary === 'start'
      ? new Date(`${value}T00:00:00.000Z`)
      : new Date(`${value}T23:59:59.999Z`)
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date')
  }
  return d
}
