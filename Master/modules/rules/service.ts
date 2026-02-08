import { db } from '@/lib/db'
import { RuleEntity as PrismaRuleEntity } from '@prisma/client'
import { RuleEntity } from './schemas'
import {
  createRuleSchema,
  updateRuleSchema,
  CreateRuleInput,
  UpdateRuleInput,
  RuleCondition,
  RuleAction,
} from './schemas'
import { ConditionEvaluator } from './condition-evaluator'
import { ActionExecutor } from './action-executor'

export async function createRule(input: CreateRuleInput & { createdBy: string }) {
  const validated = createRuleSchema.parse(input)

  const rule = await db.automationRule.create({
    data: {
      name: validated.name,
      description: validated.description,
      // Type assert entity since Zod infers it as string union, but Prisma expects enum
      entity: validated.entity as PrismaRuleEntity,
      enabled: validated.enabled,
      priority: validated.priority,
      conditions: JSON.stringify(validated.conditions),
      actions: JSON.stringify(validated.actions),
      createdBy: input.createdBy,
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return rule
}

export async function getRuleById(ruleId: string) {
  const rule = await db.automationRule.findUnique({
    where: { id: ruleId },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!rule) {
    return null
  }

  return {
    ...rule,
    conditions: JSON.parse(rule.conditions) as RuleCondition[],
    actions: JSON.parse(rule.actions) as RuleAction[],
  }
}

export async function getRules(filters?: {
  entity?: RuleEntity
  enabled?: boolean
}) {
  const rules = await db.automationRule.findMany({
    where: {
      // Type assert entity since TypeScript enum from schemas needs to match Prisma enum
      ...(filters?.entity && { entity: filters.entity as PrismaRuleEntity }),
      ...(filters?.enabled !== undefined && { enabled: filters.enabled }),
    },
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return rules.map((rule) => ({
    ...rule,
    conditions: JSON.parse(rule.conditions) as RuleCondition[],
    actions: JSON.parse(rule.actions) as RuleAction[],
  }))
}

export async function updateRule(input: UpdateRuleInput & { id: string }) {
  // Extract id first, then validate the rest of the data
  const { id, ...data } = input
  const validated = updateRuleSchema.parse(data)

  const updateData: any = {}
  if (validated.name !== undefined) updateData.name = validated.name
  if (validated.description !== undefined) updateData.description = validated.description
  // Type assert entity since Zod infers it as string union, but Prisma expects enum
  if (validated.entity !== undefined) updateData.entity = validated.entity as PrismaRuleEntity
  if (validated.enabled !== undefined) updateData.enabled = validated.enabled
  if (validated.priority !== undefined) updateData.priority = validated.priority
  if (validated.conditions !== undefined) updateData.conditions = JSON.stringify(validated.conditions)
  if (validated.actions !== undefined) updateData.actions = JSON.stringify(validated.actions)

  const rule = await db.automationRule.update({
    where: { id },
    data: updateData,
    include: {
      creator: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  return {
    ...rule,
    conditions: JSON.parse(rule.conditions) as RuleCondition[],
    actions: JSON.parse(rule.actions) as RuleAction[],
  }
}

export async function deleteRule(ruleId: string) {
  await db.automationRule.delete({
    where: { id: ruleId },
  })
}

export async function toggleRule(ruleId: string, enabled: boolean) {
  return updateRule({ id: ruleId, enabled })
}

/**
 * Evaluate and execute rules for a specific entity
 */
export async function evaluateRulesForEntity(
  entityId: string,
  entityType: RuleEntity,
  entityData: Record<string, unknown>
): Promise<number> {
  // Get enabled rules for this entity type, ordered by priority
  const rules = await getRules({ entity: entityType, enabled: true })

  let executedCount = 0

  for (const rule of rules) {
    try {
      // Evaluate conditions
      const conditionsMet = ConditionEvaluator.evaluateConditions(
        rule.conditions,
        entityData
      )

      if (conditionsMet) {
        // Execute actions
        await ActionExecutor.executeActions(rule.actions, entityId, entityType, entityData)

        // Update rule stats
        await db.automationRule.update({
          where: { id: rule.id },
          data: {
            lastRunAt: new Date(),
            runCount: { increment: 1 },
          },
        })

        executedCount++
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error)
      // Continue with next rule
    }
  }

  return executedCount
}

/**
 * Evaluate all rules for all entities of a specific type
 */
export async function evaluateAllRulesForEntityType(entityType: RuleEntity): Promise<number> {
  let totalExecuted = 0

  switch (entityType) {
    case RuleEntity.LEAD:
      const leads = await db.lead.findMany({
        where: { status: { not: 'LOST' } },
      })
      for (const lead of leads) {
        const executed = await evaluateRulesForEntity(lead.id, entityType, lead as unknown as Record<string, unknown>)
        totalExecuted += executed
      }
      break

    case RuleEntity.CLIENT:
      const clients = await db.client.findMany({
        where: { status: 'ACTIVE' },
      })
      for (const client of clients) {
        const executed = await evaluateRulesForEntity(client.id, entityType, client as unknown as Record<string, unknown>)
        totalExecuted += executed
      }
      break

    case RuleEntity.FOLLOW_UP:
      const followUps = await db.followUp.findMany({
        where: { completed: false },
      })
      for (const followUp of followUps) {
        const executed = await evaluateRulesForEntity(followUp.id, entityType, followUp as unknown as Record<string, unknown>)
        totalExecuted += executed
      }
      break

    case RuleEntity.APPLICATION:
      const applications = await db.application.findMany({
        where: { stage: { not: 'CLOSED' } },
      })
      for (const application of applications) {
        const executed = await evaluateRulesForEntity(application.id, entityType, application as unknown as Record<string, unknown>)
        totalExecuted += executed
      }
      break

    case RuleEntity.REVENUE:
      const revenues = await db.revenue.findMany({
        where: { status: { not: 'PAID' } },
      })
      for (const revenue of revenues) {
        const executed = await evaluateRulesForEntity(revenue.id, entityType, revenue as unknown as Record<string, unknown>)
        totalExecuted += executed
      }
      break

    case RuleEntity.PAYMENT:
      // Payment rules would typically be evaluated on creation/update
      break
  }

  return totalExecuted
}

