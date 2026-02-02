/**
 * Helper function to log mutations (Activity + AuditLog)
 * Use this in API routes after successful mutations
 */

import { unifiedLogger, UnifiedLogger } from './activity-audit'
import { NextRequest } from 'next/server'

interface LogMutationParams {
  request: NextRequest
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: string
  entityId: string
  entityName?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Log a mutation with automatic change detection
 */
export async function logMutation(params: LogMutationParams): Promise<void> {
  const { request, userId, action, entity, entityId, entityName, oldData, newData, metadata } = params

  // Extract request context
  const requestContext = UnifiedLogger.getRequestContext(request)

  // Extract changes for UPDATE actions
  let changes: Record<string, { old?: unknown; new?: unknown }> | undefined
  if (action === 'UPDATE' && oldData && newData) {
    changes = UnifiedLogger.extractChanges(oldData, newData)
  }

  // Log the mutation
  await unifiedLogger.logMutation({
    userId,
    action,
    entity,
    entityId,
    entityName,
    changes,
    ipAddress: requestContext.ipAddress,
    userAgent: requestContext.userAgent,
    metadata,
  })
}

