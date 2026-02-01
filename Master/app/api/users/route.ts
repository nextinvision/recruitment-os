import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/rbac'
import { createUser, getUsersByRole } from '@/modules/users/service'
import { UserRole } from '@prisma/client'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { db } from '@/lib/db'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

export async function GET(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))
    
    // Only ADMIN can view all users
    requireRole(authContext, [UserRole.ADMIN])

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role') as UserRole | null

    let users
    if (role) {
      const roleUsers = await getUsersByRole(role)
      users = roleUsers.map((u) => {
        const userWithExtras = u as typeof u & { isActive?: boolean; lastLogin?: Date | null; manager?: { id: string; firstName: string; lastName: string; email: string } | null; _count?: { jobs: number; candidates: number; applications: number } }
        return {
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isActive: userWithExtras.isActive ?? true,
          lastLogin: userWithExtras.lastLogin ?? null,
          createdAt: u.createdAt,
          manager: userWithExtras.manager ? {
            id: userWithExtras.manager.id,
            firstName: userWithExtras.manager.firstName,
            lastName: userWithExtras.manager.lastName,
            email: userWithExtras.manager.email,
          } : null,
          _count: userWithExtras._count || { jobs: 0, candidates: 0, applications: 0 },
        }
      })
    } else {
      const allUsers = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
      })
      
      // Fetch manager and counts separately
      users = await Promise.all(allUsers.map(async (user) => {
        const userWithExtras = user as typeof user & { managerId?: string | null; isActive?: boolean; lastLogin?: Date | null }
        const [manager, counts] = await Promise.all([
          userWithExtras.managerId ? db.user.findUnique({
            where: { id: userWithExtras.managerId },
            select: { id: true, firstName: true, lastName: true, email: true },
          }) : null,
          db.user.findUnique({
            where: { id: user.id },
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
        
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: userWithExtras.isActive ?? true,
          lastLogin: userWithExtras.lastLogin ?? null,
          createdAt: user.createdAt,
          manager: manager,
          _count: counts?._count || { jobs: 0, candidates: 0, applications: 0 },
        }
      }))
    }

    const response = NextResponse.json(users, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader = request.headers.get('authorization') || 
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))
    
    // Only ADMIN can create users
    requireRole(authContext, [UserRole.ADMIN])

    const body = await request.json()
    const user = await createUser(body)

    const response = NextResponse.json(user, { status: 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

