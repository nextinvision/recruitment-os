/**
 * Resume Builder Types
 * Structure based on sample layout (Abhishek_Satpati_Resume):
 * Contact | Profile | Skills | Awards | Experience | Education | Certifications
 */

export interface ResumeContact {
  name: string
  location: string
  phone: string
  email: string
  linkedin?: string
}

export interface ResumeExperience {
  id: string
  company: string
  location: string
  role: string
  startDate: string
  endDate: string
  bullets: string[]
}

export interface ResumeEducation {
  id: string
  degree: string
  specialization?: string
  institution: string
}

export interface ResumeCertification {
  id: string
  title: string
  issuer: string
}

export interface ResumeAward {
  id: string
  title: string
  organization: string
  year: string
}

export interface ResumeDocument {
  contact: ResumeContact
  profile: string
  skills: string[]
  awards: ResumeAward[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
  certifications: ResumeCertification[]
  /** Extra custom sections: { title, items[] } */
  customSections?: { id: string; title: string; items: string[] }[]
}

export interface ResumeTailoringSuggestion {
  section: string
  field?: string
  current: string
  suggested: string
  reason: string
}

export interface TailorResumeResult {
  tailoring_suggestions: ResumeTailoringSuggestion[]
  keywords_to_add: string[]
  skills_to_emphasize: string[]
  bullets_to_rewrite: { original: string; suggested: string }[]
  summary_rewrite?: string
  cover_letter?: string
}
