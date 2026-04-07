/**
 * Canonical Prisma order for ApplicationJob rows: newest assignment first.
 * Use on every `applicationJobs` include so list UIs and APIs stay consistent.
 */
export const APPLICATION_JOBS_ORDER_BY = { createdAt: 'desc' as const }
