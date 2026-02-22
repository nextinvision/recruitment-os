import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, requireAuth, requireRole } from '@/lib/rbac'
import { systemConfigService } from '@/modules/system-config/service'
import { UserRole } from '@prisma/client'
import { mergeWithDefaults } from '@/lib/page-access'
import type { PageAccessRules } from '@/lib/page-access'
import { addCorsHeaders, handleCors } from '@/lib/cors'
import { logMutation } from '@/lib/mutation-logger'

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 204 })
}

/**
 * GET page access rules. Public (no auth) so middleware can call it.
 * Returns merged defaults + stored overrides.
 */
export async function GET() {
  try {
    const dbRules = await systemConfigService.getPageAccessRules()
    const rules = mergeWithDefaults(dbRules)
    return NextResponse.json({ rules })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch page access rules'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST page access rules. ADMIN only. Body: { rules: PageAccessRules }
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const authHeader =
      request.headers.get('authorization') ||
      (request.cookies.get('token')?.value ? `Bearer ${request.cookies.get('token')?.value}` : null)
    const authContext = requireAuth(await getAuthContext(authHeader))
    requireRole(authContext, [UserRole.ADMIN])

    const body = await request.json()
    const rules = body.rules as PageAccessRules
    if (!rules || typeof rules !== 'object' || Array.isArray(rules)) {
      return NextResponse.json({ error: 'Invalid body: rules must be an object' }, { status: 400 })
    }

    const oldConfig = await systemConfigService.getPageAccessRules()
    await systemConfigService.setPageAccessRules(rules, authContext.userId)

    await logMutation({
      request,
      userId: authContext.userId,
      action: oldConfig ? 'UPDATE' : 'CREATE',
      entity: 'PageAccessRules',
      entityId: 'access.page_roles',
      entityName: 'access.page_roles',
      oldData: oldConfig || undefined,
      newData: rules,
    }).catch((err) => {
      console.error('Failed to log mutation:', err)
    })

    const merged = mergeWithDefaults(rules)
    return NextResponse.json({ rules: merged })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save page access rules'
    const status = message.includes('Forbidden') || message.includes('Unauthorized') ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
