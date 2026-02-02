import { z } from 'zod'

// These will be available after Prisma client generation
export enum RuleEntity {
  LEAD = 'LEAD',
  CLIENT = 'CLIENT',
  FOLLOW_UP = 'FOLLOW_UP',
  APPLICATION = 'APPLICATION',
  REVENUE = 'REVENUE',
  PAYMENT = 'PAYMENT',
}

export enum RuleConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
  DAYS_SINCE = 'DAYS_SINCE',
  DAYS_UNTIL = 'DAYS_UNTIL',
}

export enum RuleActionType {
  NOTIFY_EMPLOYEE = 'NOTIFY_EMPLOYEE',
  NOTIFY_MANAGER = 'NOTIFY_MANAGER',
  NOTIFY_ADMIN = 'NOTIFY_ADMIN',
  ESCALATE = 'ESCALATE',
  CREATE_ACTIVITY = 'CREATE_ACTIVITY',
  UPDATE_STATUS = 'UPDATE_STATUS',
  CREATE_FOLLOW_UP = 'CREATE_FOLLOW_UP',
}

/**
 * Condition structure for rule evaluation
 */
const operatorValues = Object.values(RuleConditionOperator) as [string, ...string[]]
const actionTypeValues = Object.values(RuleActionType) as [string, ...string[]]
const entityValues = Object.values(RuleEntity) as [string, ...string[]]

export const ruleConditionSchema = z.object({
  field: z.string(), // e.g., "status", "createdAt", "daysSinceLastActivity"
  operator: z.enum(operatorValues),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
})

/**
 * Action structure for rule execution
 */
export const ruleActionSchema = z.object({
  type: z.enum(actionTypeValues),
  target: z.string().optional(), // userId, role, etc.
  message: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Create rule schema
 */
export const createRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  entity: z.enum(entityValues),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
  conditions: z.array(ruleConditionSchema).min(1),
  actions: z.array(ruleActionSchema).min(1),
})

/**
 * Update rule schema
 */
export const updateRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  entity: z.enum(entityValues).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  conditions: z.array(ruleConditionSchema).optional(),
  actions: z.array(ruleActionSchema).optional(),
})

export type RuleCondition = z.infer<typeof ruleConditionSchema>
export type RuleAction = z.infer<typeof ruleActionSchema>
export type CreateRuleInput = z.infer<typeof createRuleSchema>
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>

