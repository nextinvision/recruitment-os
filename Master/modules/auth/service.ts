import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { loginSchema, LoginInput } from './schemas'

export async function loginUser(input: LoginInput) {
  const validated = loginSchema.parse(input)

  const user = await db.user.findUnique({
    where: { email: validated.email },
  })

  if (!user) {
    throw new Error('Invalid email or password')
  }

  const isValidPassword = await bcrypt.compare(validated.password, user.password)

  if (!isValidPassword) {
    throw new Error('Invalid email or password')
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  }
}

