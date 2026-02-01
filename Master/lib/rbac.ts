import { UserRole } from '@prisma/client'
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth'

export interface AuthContext {
  userId: string
  email: string
  role: UserRole
}

export async function getAuthContext(
  authHeader: string | null
): Promise<AuthContext | null> {
  const token = extractTokenFromHeader(authHeader)
  if (!token) {
    return null
  }

  try {
    const payload = verifyToken(token)
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    }
  } catch {
    return null
  }
}

export function requireAuth(authContext: AuthContext | null): AuthContext {
  if (!authContext) {
    throw new Error('Unauthorized')
  }
  return authContext
}

export function requireRole(authContext: AuthContext, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(authContext.role)) {
    throw new Error('Forbidden: Insufficient permissions')
  }
}

export function canAccessResource(
  authContext: AuthContext,
  resourceRecruiterId: string | null
): boolean {
  // Admin can access everything
  if (authContext.role === UserRole.ADMIN) {
    return true
  }

  // Manager can access everything (assuming managers have same access as admin)
  if (authContext.role === UserRole.MANAGER) {
    return true
  }

  // Recruiter can only access their own resources
  if (authContext.role === UserRole.RECRUITER) {
    return resourceRecruiterId === authContext.userId
  }

  return false
}

