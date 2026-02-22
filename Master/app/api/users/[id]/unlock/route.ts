import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'
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

    // Only ADMIN can unlock accounts
    requireRole(authContext, [UserRole.ADMIN])

    const { id } = await params

    // Get old user data
    const oldUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        locked: true,
        lockedUntil: true,
        failedLoginAttempts: true,
      },
    })

    if (!oldUser) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    await db.user.update({
      where: { id },
      data: {
        locked: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
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
      newData: {
        ...oldUser,
        locked: false,
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(
      { message: 'Account unlocked successfully' },
      { status: 200 }
    )
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unlock account'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

