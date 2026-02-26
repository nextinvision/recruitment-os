import { z } from 'zod'
import { ServiceType } from '@prisma/client'

export const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  address: z.string().optional(),
  industry: z.string().optional(), // Industry they want to work in
  currentJobTitle: z.string().optional(), // Current job title
  experience: z.string().optional(), // Years of experience
  skills: z.array(z.string()).optional(), // Skills/interests
  notes: z.string().optional(),
  leadId: z.string().optional(), // For conversion from lead
  
  // Preparation Pipeline Fields
  serviceType: z.nativeEnum(ServiceType).optional(),
  onboardedDate: z.string().datetime().optional(),
  reverseRecruiterId: z.string().optional(),
  whatsappGroupCreated: z.boolean().optional(),
  whatsappGroupId: z.string().optional(),
  whatsappGroupCreatedAt: z.string().datetime().optional(),
  jobSearchStrategyDocId: z.string().optional(),
  gmailId: z.string().optional(),
  gmailCreated: z.boolean().optional(),
  gmailCreatedAt: z.string().datetime().optional(),
  linkedInOptimized: z.boolean().optional(),
  linkedInOptimizedAt: z.string().datetime().optional(),
  jobSearchInitiated: z.boolean().optional(),
  jobSearchInitiatedAt: z.string().datetime().optional(),
})

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// Filter schemas
export const clientFilterSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  assignedUserId: z.string().optional(),
  reverseRecruiterId: z.string().optional(),
  industry: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(),
  hasSkills: z.boolean().optional(),
  jobSearchInitiated: z.boolean().optional(),
  linkedInOptimized: z.boolean().optional(),
  whatsappGroupCreated: z.boolean().optional(),
})

// Sort schemas
export const clientSortSchema = z.object({
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'status', 'onboardedDate', 'jobSearchInitiatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Pagination schemas - max 500 to support picker/dropdown use cases (e.g. job assign, application form)
export const clientPaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(500).default(25),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ClientFilters = z.infer<typeof clientFilterSchema>
export type ClientSortOptions = z.infer<typeof clientSortSchema>
export type ClientPaginationOptions = z.infer<typeof clientPaginationSchema>

export interface ClientsResult {
  clients: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
