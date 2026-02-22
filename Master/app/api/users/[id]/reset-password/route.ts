import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))

    // Only ADMIN can reset passwords
    requireRole(authContext, [UserRole.ADMIN])

    const { id } = await params
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 8) {
      const response = NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Validate password strength
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      const response = NextResponse.json(
        {
          error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        },
        { status: 400 }
      )
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    // Get old user data
    const oldUser = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    if (!oldUser) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await db.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        locked: false,
        lockedUntil: null,
      },
    })

    // Log the mutation
    await logMutation({
      request,
      userId: authContext.userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      entityName: `${oldUser.firstName} ${oldUser.lastName}`,
      oldData: oldUser,
      newData: { ...oldUser, passwordReset: true },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset password'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

