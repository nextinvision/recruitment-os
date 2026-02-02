/**
 * Condition Evaluator for Automation Rules
 * Evaluates conditions against entity data
 */

import { RuleCondition, RuleConditionOperator } from './schemas'
import { db } from '@/lib/db'
import { Lead, Client, FollowUp, Application, Revenue, Payment } from '@prisma/client'

type EntityData = Lead | Client | FollowUp | Application | Revenue | Payment | Record<string, unknown>

export class ConditionEvaluator {
  /**
   * Evaluate a single condition against entity data
   */
  static evaluateCondition(
    condition: RuleCondition,
    entityData: EntityData
  ): boolean {
    const { field, operator, value } = condition

    // Get field value from entity
    const fieldValue = this.getFieldValue(entityData, field)

    // Handle special computed fields
    if (field.startsWith('daysSince') || field.startsWith('daysUntil')) {
      return this.evaluateDateCondition(field, operator, value, entityData)
    }

    // Evaluate based on operator
    switch (operator) {
      case RuleConditionOperator.EQUALS:
        return fieldValue === value

      case RuleConditionOperator.NOT_EQUALS:
        return fieldValue !== value

      case RuleConditionOperator.GREATER_THAN:
        return this.compareNumbers(fieldValue, value, '>')

      case RuleConditionOperator.LESS_THAN:
        return this.compareNumbers(fieldValue, value, '<')

      case RuleConditionOperator.GREATER_THAN_OR_EQUAL:
        return this.compareNumbers(fieldValue, value, '>=')

      case RuleConditionOperator.LESS_THAN_OR_EQUAL:
        return this.compareNumbers(fieldValue, value, '<=')

      case RuleConditionOperator.CONTAINS:
        return String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase())

      case RuleConditionOperator.NOT_CONTAINS:
        return !String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase())

      case RuleConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined

      case RuleConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined

      default:
        return false
    }
  }

  /**
   * Evaluate all conditions (AND logic)
   */
  static evaluateConditions(
    conditions: RuleCondition[],
    entityData: EntityData
  ): boolean {
    return conditions.every((condition) => this.evaluateCondition(condition, entityData))
  }

  /**
   * Get field value from entity data
   */
  private static getFieldValue(entityData: EntityData, field: string): unknown {
    // Handle nested fields (e.g., "assignedUser.email")
    const parts = field.split('.')
    let value: unknown = entityData

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return value
  }

  /**
   * Compare numbers
   */
  private static compareNumbers(
    fieldValue: unknown,
    value: unknown,
    operator: '>' | '<' | '>=' | '<='
  ): boolean {
    const num1 = Number(fieldValue)
    const num2 = Number(value)

    if (isNaN(num1) || isNaN(num2)) {
      return false
    }

    switch (operator) {
      case '>':
        return num1 > num2
      case '<':
        return num1 < num2
      case '>=':
        return num1 >= num2
      case '<=':
        return num1 <= num2
    }
  }

  /**
   * Evaluate date-based conditions (daysSince, daysUntil)
   */
  private static evaluateDateCondition(
    field: string,
    operator: RuleConditionOperator,
    value: unknown,
    entityData: EntityData
  ): boolean {
    // Extract date field name (e.g., "daysSinceLastActivity" -> "lastActivity")
    const dateFieldMatch = field.match(/days(Since|Until)(.+)/)
    if (!dateFieldMatch) {
      return false
    }

    const [, type, dateFieldName] = dateFieldMatch
    const dateField = dateFieldName.charAt(0).toLowerCase() + dateFieldName.slice(1)

    // Get date value
    const dateValue = this.getFieldValue(entityData, dateFieldName) || this.getFieldValue(entityData, dateField)
    if (!dateValue) {
      return false
    }

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue as string)
    if (isNaN(date.getTime())) {
      return false
    }

    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    // For daysSince, we want daysDiff
    // For daysUntil, we want -daysDiff (future date)
    const days = type === 'Since' ? daysDiff : -daysDiff

    // Compare with value
    const targetDays = Number(value)
    if (isNaN(targetDays)) {
      return false
    }

    switch (operator) {
      case RuleConditionOperator.EQUALS:
        return days === targetDays
      case RuleConditionOperator.GREATER_THAN:
        return days > targetDays
      case RuleConditionOperator.LESS_THAN:
        return days < targetDays
      case RuleConditionOperator.GREATER_THAN_OR_EQUAL:
        return days >= targetDays
      case RuleConditionOperator.LESS_THAN_OR_EQUAL:
        return days <= targetDays
      default:
        return false
    }
  }

  /**
   * Get days since last activity for an entity
   */
  static async getDaysSinceLastActivity(entityId: string, entityType: string): Promise<number> {
    let lastActivity = null

    switch (entityType) {
      case 'LEAD':
        lastActivity = await db.activity.findFirst({
          where: { leadId: entityId },
          orderBy: { occurredAt: 'desc' },
        })
        break
      case 'CLIENT':
        lastActivity = await db.activity.findFirst({
          where: { clientId: entityId },
          orderBy: { occurredAt: 'desc' },
        })
        break
    }

    if (!lastActivity) {
      return Infinity
    }

    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - lastActivity.occurredAt.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff
  }

  /**
   * Get days since entity creation
   */
  static getDaysSinceCreation(entityData: EntityData): number {
    const createdAt = this.getFieldValue(entityData, 'createdAt')
    if (!createdAt) {
      return Infinity
    }

    const date = createdAt instanceof Date ? createdAt : new Date(createdAt as string)
    if (isNaN(date.getTime())) {
      return Infinity
    }

    const now = new Date()
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  }
}

