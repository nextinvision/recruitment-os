import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import {
  createOnboardingFormSchema,
  updateOnboardingFormSchema,
  submitOnboardingFormSchema,
  CreateOnboardingFormInput,
  UpdateOnboardingFormInput,
  SubmitOnboardingFormInput,
} from './schemas'
import { createClientSchema, CreateClientInput } from '@/modules/clients/schemas'
import { createClient } from '@/modules/clients/service'

export async function createOnboardingForm(input: CreateOnboardingFormInput, createdById: string) {
  const validated = createOnboardingFormSchema.parse(input)
  return db.onboardingForm.create({
    data: {
      title: validated.title,
      description: validated.description ?? null,
      fields: validated.fields as object,
      createdById,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

export async function getOnboardingFormById(formId: string) {
  return db.onboardingForm.findUnique({
    where: { id: formId },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { submissions: true } },
    },
  })
}

export async function getOnboardingForms(userId: string, userRole: UserRole) {
  const where = userRole === 'ADMIN' || userRole === 'MANAGER' ? {} : { createdById: userId }
  return db.onboardingForm.findMany({
    where,
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function updateOnboardingForm(formId: string, input: UpdateOnboardingFormInput) {
  const validated = updateOnboardingFormSchema.parse(input)
  return db.onboardingForm.update({
    where: { id: formId },
    data: {
      ...(validated.title != null && { title: validated.title }),
      ...(validated.description !== undefined && { description: validated.description || null }),
      ...(validated.fields != null && { fields: validated.fields as object }),
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  })
}

export async function deleteOnboardingForm(formId: string) {
  return db.onboardingForm.delete({ where: { id: formId } })
}

export async function submitOnboardingForm(formId: string, input: SubmitOnboardingFormInput) {
  const form = await db.onboardingForm.findUnique({ where: { id: formId } })
  if (!form) throw new Error('Form not found')
  const validated = submitOnboardingFormSchema.parse(input)
  return db.onboardingFormSubmission.create({
    data: {
      formId,
      data: validated.data as object,
    },
  })
}

export async function getSubmissionsByFormId(formId: string, userId: string, userRole: UserRole) {
  const form = await db.onboardingForm.findUnique({ where: { id: formId } })
  if (!form) return []
  if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && form.createdById !== userId) return []
  return db.onboardingFormSubmission.findMany({
    where: { formId },
    include: { client: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { submittedAt: 'desc' },
  })
}

export async function getAllSubmissions(userId: string, userRole: UserRole) {
  const formWhere = userRole === 'ADMIN' || userRole === 'MANAGER' ? {} : { createdById: userId }
  return db.onboardingFormSubmission.findMany({
    where: { form: formWhere },
    include: {
      form: { select: { id: true, title: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { submittedAt: 'desc' },
  })
}

export async function getSubmissionById(submissionId: string) {
  return db.onboardingFormSubmission.findUnique({
    where: { id: submissionId },
    include: {
      form: true,
      client: true,
    },
  })
}

/**
 * Create a client from submission data. Maps common field keys to client fields.
 */
export async function createClientFromSubmission(
  submissionId: string,
  assignedUserId: string
) {
  const submission = await db.onboardingFormSubmission.findUnique({
    where: { id: submissionId },
    include: { form: true },
  })
  if (!submission) throw new Error('Submission not found')
  if (submission.clientId) throw new Error('This submission was already converted to a client')

  const data = submission.data as Record<string, unknown>

  const map = (key: string): string | undefined => {
    const v = data[key]
    if (v == null) return undefined
    return String(v).trim() || undefined
  }
  const mapArr = (key: string): string[] => {
    const v = data[key]
    if (Array.isArray(v)) return v.map(String).filter(Boolean)
    if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean)
    return []
  }

  const clientInput: CreateClientInput = {
    firstName: map('firstName') || map('first_name') || map('fullName')?.split(' ')[0] || 'Client',
    lastName: map('lastName') || map('last_name') || map('fullName')?.split(' ').slice(1).join(' ') || 'Name',
    email: map('email') || map('linkedinId') || undefined,
    phone: map('phone') || map('mobile') || map('contact') || undefined,
    address: map('address') || map('fullHomeAddr') || map('currentLocation') || undefined,
    industry: map('currentIndustry') || map('targetIndustry') || map('industry') || undefined,
    currentJobTitle: map('currentRole') || map('designation') || map('currentJobTitle') || undefined,
    experience: map('experience') || undefined,
    skills: mapArr('skills').length ? mapArr('skills') : (map('careerObjective') ? [map('careerObjective')!] : []),
    notes: [
      map('careerObjective') && `Career: ${map('careerObjective')}`,
      map('targetRole') && `Target role: ${map('targetRole')}`,
      map('targetIndustry') && `Target industry: ${map('targetIndustry')}`,
      map('targetLocation') && `Target location: ${map('targetLocation')}`,
      map('currentCtc') && `Current CTC: ${map('currentCtc')}`,
      map('expectedCtc') && `Expected CTC: ${map('expectedCtc')}`,
      map('noticePeriod') && `Notice: ${map('noticePeriod')}`,
      map('dateOfBirth') && `DOB: ${map('dateOfBirth')}`,
      map('panCardNo') && `PAN: ${map('panCardNo')}`,
      map('aadharCardNo') && `Aadhar: ${map('aadharCardNo')}`,
      data.employmentHistory && `Employment: ${JSON.stringify(data.employmentHistory)}`,
      data.education && `Education: ${JSON.stringify(data.education)}`,
    ].filter(Boolean).join('\n') || undefined,
    assignedUserId,
  }

  const validated = createClientSchema.parse(clientInput)
  const client = await createClient(validated)

  await db.onboardingFormSubmission.update({
    where: { id: submissionId },
    data: { clientId: client.id },
  })

  return client
}
