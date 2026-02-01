import { z } from 'zod'
import { UserRole } from '@prisma/client'

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.nativeEnum(UserRole).default(UserRole.RECRUITER),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

