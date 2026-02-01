import jwt from 'jsonwebtoken'
import { jwtVerify } from 'jose'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

// For API routes (Node.js runtime) - use jsonwebtoken
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

// For middleware (Edge runtime) - use jose
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    // Convert secret to Uint8Array for jose
    const secret = new TextEncoder().encode(JWT_SECRET)
    
    // Verify token using jose (Edge Runtime compatible)
    const { payload: decoded } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    })
    
    return {
      userId: decoded.userId as string,
      email: decoded.email as string,
      role: decoded.role as UserRole,
    }
  } catch {
    throw new Error('Invalid or expired token')
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

