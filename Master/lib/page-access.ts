/**
 * Page access control: which roles can access which routes.
 * Admin configures this in Admin → System Configuration → Page Access.
 * Used by middleware (enforcement) and sidebar (visibility).
 */

export const PAGE_ACCESS_CONFIG_KEY = 'access.page_roles'

export const ROLES = ['ADMIN', 'MANAGER', 'RECRUITER', 'SALES'] as const
export type PageAccessRole = (typeof ROLES)[number]

/** Paths that can be configured. Order matters for longest-prefix matching (more specific first). */
export const PAGES: { path: string; label: string }[] = [
  { path: '/dashboard/escalations', label: 'Escalations' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/jobs', label: 'Jobs' },
  { path: '/applications', label: 'Applications' },
  { path: '/leads', label: 'Leads' },
  { path: '/clients', label: 'Clients' },
  { path: '/companies', label: 'Companies' },
  { path: '/followups', label: 'Follow-ups' },
  { path: '/activities', label: 'Activities' },
  { path: '/ats-resume-analysis', label: 'AI Resume Analysis' },
  { path: '/resume-builder', label: 'Resume Builder' },
  { path: '/revenues', label: 'Revenues' },
  { path: '/reports', label: 'Reports' },
  { path: '/admin', label: 'Admin' },
]

/** Default role access per path (current app behavior). No entry = allow all roles. */
export const PAGE_ACCESS_DEFAULTS: Record<string, string[]> = {
  '/dashboard': ['ADMIN', 'MANAGER', 'RECRUITER', 'SALES'],
  '/jobs': ['ADMIN', 'MANAGER', 'RECRUITER'],
  '/applications': ['ADMIN', 'MANAGER', 'RECRUITER'],
  '/leads': ['ADMIN', 'MANAGER', 'RECRUITER', 'SALES'],
  '/clients': ['ADMIN', 'MANAGER', 'RECRUITER', 'SALES'],
  '/companies': ['ADMIN', 'MANAGER', 'RECRUITER'],
  '/followups': ['ADMIN', 'MANAGER', 'RECRUITER', 'SALES'],
  '/activities': ['ADMIN', 'MANAGER', 'RECRUITER', 'SALES'],
  '/ats-resume-analysis': ['ADMIN', 'MANAGER', 'RECRUITER'],
  '/resume-builder': ['ADMIN', 'MANAGER', 'RECRUITER'],
  '/revenues': ['ADMIN', 'MANAGER', 'RECRUITER', 'SALES'],
  '/reports': ['ADMIN', 'MANAGER'],
  '/dashboard/escalations': ['ADMIN', 'MANAGER'],
  '/admin': ['ADMIN', 'MANAGER'],
}

export type PageAccessRules = Record<string, string[]>

/**
 * Get the roles allowed for a given pathname using longest-prefix match.
 * e.g. /admin/audit uses rule for /admin; /dashboard/escalations uses rule for /dashboard/escalations.
 */
export function getApplicableRoles(pathname: string, rules: PageAccessRules): string[] {
  const sortedPaths = Object.keys(rules).sort((a, b) => b.length - a.length)
  for (const path of sortedPaths) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return rules[path] ?? []
    }
  }
  return []
}

/**
 * Merge DB rules with defaults. DB overrides defaults; defaults fill missing paths.
 */
export function mergeWithDefaults(dbRules: PageAccessRules | null): PageAccessRules {
  const merged: PageAccessRules = { ...PAGE_ACCESS_DEFAULTS }
  if (dbRules && typeof dbRules === 'object') {
    for (const path of PAGES.map((p) => p.path)) {
      if (Array.isArray(dbRules[path])) {
        merged[path] = dbRules[path]
      }
    }
  }
  return merged
}

/**
 * Check if a role can access a pathname given the rules.
 */
export function canAccessPath(pathname: string, role: string, rules: PageAccessRules): boolean {
  const roles = getApplicableRoles(pathname, rules)
  if (roles.length === 0) return true
  return roles.includes(role)
}
