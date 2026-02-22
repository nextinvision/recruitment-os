import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/rbac'
import { systemConfigService } from '@/modules/system-config/service'
import { UserRole } from '@prisma/client'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

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

    // Only ADMIN can view system configuration
    requireRole(authContext, [UserRole.ADMIN])

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let configs
    if (category) {
      configs = await systemConfigService.getConfigsByCategory(category)
    } else {
      configs = await systemConfigService.getAllConfigs()
    }

    const response = NextResponse.json(configs, { status: 200 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch system configuration'
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

    // Only ADMIN can update system configuration
    requireRole(authContext, [UserRole.ADMIN])

    const body = await request.json()
    
    // Get old config if exists
    const oldConfig = await systemConfigService.getConfigByKey(body.key)

    const config = await systemConfigService.setConfig({
      ...body,
      updatedBy: authContext.userId,
    })

    // Log the mutation
    await logMutation({
      request,
      userId: authContext.userId,
      action: oldConfig ? 'UPDATE' : 'CREATE',
      entity: 'SystemConfig',
      entityId: config.id,
      entityName: config.key,
      oldData: oldConfig || undefined,
      newData: config,
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const response = NextResponse.json(config, { status: oldConfig ? 200 : 201 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save system configuration'
    const response = NextResponse.json({ error: message }, { status: 400 })
    const origin = request.headers.get('origin')
    return addCorsHeaders(response, origin)
  }
}

