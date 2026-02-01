import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { createUserSchema, CreateUserInput } from './schemas'

export async function createUser(input: CreateUserInput) {
  const validated = createUserSchema.parse(input)

  const existingUser = await db.user.findUnique({
    where: { email: validated.email },
  })

  if (existingUser) {
    throw new Error('User with this email already exists')
  }

  const hashedPassword = await bcrypt.hash(validated.password, 10)

  const user = await db.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      firstName: validated.firstName,
      lastName: validated.lastName,
      role: validated.role,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  })

  return user
}

export async function getUserById(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function getUsersByRole(role: UserRole) {
  return db.user.findMany({
    where: { role },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  })
}

