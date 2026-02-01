import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))
    
    // Only ADMIN can view user details
    requireRole(authContext, [UserRole.ADMIN])

    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
    })

    if (!user) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 404 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    const userWithExtras = user as typeof user & { managerId?: string | null; isActive?: boolean; lastLogin?: Date | null }
    const [manager, counts] = await Promise.all([
      userWithExtras.managerId ? db.user.findUnique({
        where: { id: userWithExtras.managerId },
        select: { id: true, firstName: true, lastName: true, email: true },
      }) : null,
      db.user.findUnique({
        where: { id },
        select: {
          _count: {
            select: {
              jobs: true,
              candidates: true,
              applications: true,
            },
          },
        },
      }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...userData } = user
    const response = NextResponse.json({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      isActive: userWithExtras.isActive ?? true,
      lastLogin: userWithExtras.lastLogin ?? null,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      manager,
      _count: counts?._count || { jobs: 0, candidates: 0, applications: 0 },
    }, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))
    
    // Only ADMIN can update users
    requireRole(authContext, [UserRole.ADMIN])

    const { id } = await params
    const body = await request.json()
    const updateData: {
      firstName?: string
      lastName?: string
      email?: string
      role?: UserRole
      isActive?: boolean
      managerId?: string | null
      password?: string
    } = {}

    if (body.firstName) updateData.firstName = body.firstName
    if (body.lastName) updateData.lastName = body.lastName
    if (body.email) updateData.email = body.email
    if (body.role) updateData.role = body.role
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.managerId !== undefined) updateData.managerId = body.managerId || null
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pwd, ...userData } = updatedUser
    const userWithExtras = userData as typeof userData & { isActive?: boolean }
    const response = NextResponse.json({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      isActive: userWithExtras.isActive ?? true,
      createdAt: userData.createdAt,
    }, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))
    
    // Only ADMIN can delete users
    requireRole(authContext, [UserRole.ADMIN])

    const { id } = await params

    // Prevent self-deletion
    if (id === authContext.userId) {
      const response = NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
      const origin = request.headers.get('origin')
      return addCorsHeaders(response, origin)
    }

    await db.user.delete({
      where: { id },
    })

    const response = NextResponse.json({ message: 'User deleted successfully' }, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

