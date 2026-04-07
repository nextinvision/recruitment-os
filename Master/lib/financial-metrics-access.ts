import { UserRole } from '@prisma/client'

/**
 * Sales & financial aggregates (revenue, cash collected, pending balance) are restricted
 * to Admin and Sales. Other roles may still receive operational analytics (funnel, platform, etc.).
 */
export function canViewSalesFinancialMetrics(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SALES
}

export type SystemMetricsWithOptionalSales = {
  totalJobs: number
  totalCandidates: number
  totalApplications: number
  activeApplications: number
  conversionRates: {
    identifiedToApplied: number
    appliedToInterview: number
    interviewToOffer: number
  }
  salesMetrics?: {
    totalRevenue: number
    totalCollected: number
    pendingBalance: number
  }
}

/**
 * Strips `salesMetrics` from the system metrics block when the role must not see financial data.
 * Use for API responses so values are not exposed via the network (not only hidden in UI).
 */
export function redactSalesMetricsFromSystemMetricsBlock<T extends SystemMetricsWithOptionalSales>(
  block: T,
  role: UserRole
): T {
  if (canViewSalesFinancialMetrics(role)) {
    return block
  }
  const { salesMetrics: _omit, ...rest } = block
  return rest as T
}
