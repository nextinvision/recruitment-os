export interface ResumeAnalysis {
  atsScore: number
  skills: string[]
  missingSkills: string[]
  recommendations: string[]
  gapAnalysis: {
    skill: string
    level: 'missing' | 'basic' | 'intermediate' | 'advanced'
  }[]
}

export interface LinkedInOptimization {
  headline: string
  about: string
  experience: {
    title: string
    description: string
  }[]
  keywords: string[]
}

export interface JobMatch {
  jobId: string
  score: number
  reasons: string[]
  missingSkills: string[]
}

export interface MessageTemplate {
  type: 'cold_outreach' | 'follow_up' | 'job_sharing'
  tone: 'professional' | 'friendly' | 'casual'
  message: string
}

export interface WeeklyPlan {
  week: string
  jobs: {
    jobId: string
    priority: number
    actions: string[]
  }[]
  dailyTasks: {
    date: string
    tasks: string[]
  }[]
}

