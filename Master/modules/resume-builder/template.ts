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
}

export function createEmptyResumeDocument(): ResumeDocument {
  return JSON.parse(JSON.stringify(DEFAULT_TEMPLATE))
}

/**
 * Map parsed ATS/resume-upload response to ResumeDocument
 */
export function parsedToResumeDocument(parsed: {
  name?: string
  skills?: string[]
  summary?: string
  education?: string[]
  contact?: Record<string, string>
  experience?: Array<{
    company?: string
    role?: string
    start_date?: string
    end_date?: string
    responsibilities?: string[]
  }>
  raw_text?: string
}): ResumeDocument {
  const doc = createEmptyResumeDocument()
  doc.contact = {
    name: parsed.name || '',
    location: parsed.contact?.location || '',
    phone: parsed.contact?.phone || '',
    email: parsed.contact?.email || '',
    linkedin: parsed.contact?.linkedin || '',
  }
  doc.profile = parsed.summary || ''
  doc.skills = Array.isArray(parsed.skills) ? parsed.skills : []

  doc.education = (parsed.education || []).map((e, i) => ({
    id: `edu-${i}`,
    degree: typeof e === 'string' ? e : (e as any).degree || '',
    institution: (e as any).institution || '',
    specialization: (e as any).specialization || '',
  }))

  if (Array.isArray(parsed.experience)) {
    doc.experience = parsed.experience.map((exp, i) => ({
      id: `exp-${i}`,
      company: exp.company || '',
      location: (exp as any).location || '',
      role: exp.role || '',
      startDate: exp.start_date || '',
      endDate: exp.end_date || '',
      bullets: exp.responsibilities || [],
    }))
  }

  return doc
}
