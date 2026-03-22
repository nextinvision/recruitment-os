/**
 * Canonical list of JobSpy scraper platforms.
 * Values must match JobSpy API (jobspy.model.Site): lowercase identifiers.
 * Used by JobFetchPanel (UI) and fetch API (validation).
 */
export const JOBSPY_PLATFORMS: readonly { value: string; label: string; warning?: string }[] = [
  { value: 'indeed', label: 'Indeed' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'naukri', label: 'Naukri' },
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'zip_recruiter', label: 'Zip Recruiter' },
  { value: 'google', label: 'Google Jobs', warning: 'May be temporarily unavailable; try other sources first.' },
  { value: 'bayt', label: 'Bayt' },
  { value: 'bdjobs', label: 'BDJobs' },
]

export type JobSpyPlatformValue =
  | 'indeed'
  | 'linkedin'
  | 'naukri'
  | 'glassdoor'
  | 'zip_recruiter'
  | 'google'
  | 'bayt'
  | 'bdjobs'

export const JOBSPY_PLATFORM_VALUES: readonly string[] = JOBSPY_PLATFORMS.map((p) => p.value)

/** Default platforms when user has not selected any (matches previous default). */
export const JOBSPY_DEFAULT_PLATFORMS: JobSpyPlatformValue[] = ['indeed', 'linkedin', 'naukri']

export function isValidJobSpySite(site: string): site is JobSpyPlatformValue {
  return JOBSPY_PLATFORM_VALUES.includes(site)
}

export function filterValidJobSpySites(sites: string[]): JobSpyPlatformValue[] {
  return sites.filter(isValidJobSpySite) as JobSpyPlatformValue[]
}
