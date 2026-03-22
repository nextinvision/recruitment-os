/**
 * Default resume template structure based on sample (Abhishek_Satpati_Resume).
 * Layout: Contact | Profile | Skills | Awards | Experience | Education | Certifications
 */
import type { ResumeDocument } from './types'

export const DEFAULT_TEMPLATE: ResumeDocument = {
  contact: {
    name: '',
    location: '',
    phone: '',
    email: '',
    linkedin: '',
  },
  profile: '',
  skills: [],
  awards: [],
  experience: [],
  education: [],
  certifications: [],
  customSections: [],
  sectionOrder: ['profile', 'experience', 'awards', 'education', 'certifications'],
}

export function createEmptyResumeDocument(): ResumeDocument {
  const doc = JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)) as ResumeDocument
  return doc
}

/** Education item from API: string or structured object (Python returns object) */
type EducationItem = string | { degree?: string; institution?: string; specialization?: string }

/** Experience item from API (Python uses snake_case) */
type ExperienceItem = {
  company?: string
  role?: string
  location?: string
  start_date?: string
  end_date?: string
  responsibilities?: string[]
}

/**
 * Map parsed ATS/resume-upload API response to ResumeDocument.
 * Accepts the exact shape returned by Python /api/analyze-resume (and Next.js resume-upload).
 * Defensive to missing/undefined/wrong types so import never throws.
 */
export function parsedToResumeDocument(parsed: {
  name?: string
  skills?: unknown
  summary?: string
  education?: EducationItem[]
  contact?: Record<string, unknown> | null
  experience?: ExperienceItem[] | null
  raw_text?: string
  success?: boolean
  experience_years?: number
  ats_score?: number
}): ResumeDocument {
  const doc = createEmptyResumeDocument()

  const contact = parsed.contact && typeof parsed.contact === 'object' && !Array.isArray(parsed.contact)
    ? (parsed.contact as Record<string, string>)
    : {}

  doc.contact = {
    name: typeof parsed.name === 'string' ? parsed.name : '',
    location: typeof contact.location === 'string' ? contact.location : '',
    phone: typeof contact.phone === 'string' ? contact.phone : '',
    email: typeof contact.email === 'string' ? contact.email : '',
    linkedin: typeof contact.linkedin === 'string' ? contact.linkedin : '',
  }

  doc.profile = typeof parsed.summary === 'string' ? parsed.summary : ''

  if (Array.isArray(parsed.skills)) {
    doc.skills = parsed.skills.filter((s): s is string => typeof s === 'string')
  } else {
    doc.skills = []
  }

  const educationList = Array.isArray(parsed.education) ? parsed.education : []
  doc.education = educationList.map((e, i) => {
    if (typeof e === 'string') {
      return { id: `edu-${i}`, degree: e, institution: '', specialization: '' }
    }
    if (e && typeof e === 'object') {
      const o = e as { degree?: string; institution?: string; specialization?: string }
      return {
        id: `edu-${i}`,
        degree: typeof o.degree === 'string' ? o.degree : '',
        institution: typeof o.institution === 'string' ? o.institution : '',
        specialization: typeof o.specialization === 'string' ? o.specialization : '',
      }
    }
    return { id: `edu-${i}`, degree: '', institution: '', specialization: '' }
  })

  const experienceList = Array.isArray(parsed.experience) ? parsed.experience : []
  doc.experience = experienceList.map((exp, i) => {
    const loc = (exp as ExperienceItem).location
    const locationStr: string = typeof loc === 'string' ? loc : ''
    return {
      id: `exp-${i}`,
      company: typeof exp.company === 'string' ? exp.company : '',
      location: locationStr,
      role: typeof exp.role === 'string' ? exp.role : '',
      startDate: typeof exp.start_date === 'string' ? exp.start_date : '',
      endDate: typeof exp.end_date === 'string' ? exp.end_date : '',
      bullets: Array.isArray(exp.responsibilities)
        ? exp.responsibilities.filter((b): b is string => typeof b === 'string')
        : [],
    }
  })

  doc.customSections = []
  doc.sectionOrder = ['profile', 'experience', 'awards', 'education', 'certifications']

  return doc
}
