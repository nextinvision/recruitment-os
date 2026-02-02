-- CreateEnum
CREATE TYPE "RuleEntity" AS ENUM ('LEAD', 'CLIENT', 'FOLLOW_UP', 'APPLICATION', 'REVENUE', 'PAYMENT');

-- CreateEnum
CREATE TYPE "RuleConditionOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL', 'CONTAINS', 'NOT_CONTAINS', 'IS_NULL', 'IS_NOT_NULL', 'DAYS_SINCE', 'DAYS_UNTIL');

-- CreateEnum
CREATE TYPE "RuleActionType" AS ENUM ('NOTIFY_EMPLOYEE', 'NOTIFY_MANAGER', 'NOTIFY_ADMIN', 'ESCALATE', 'CREATE_ACTIVITY', 'UPDATE_STATUS', 'CREATE_FOLLOW_UP');

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entity" "RuleEntity" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "automation_rules_entity_idx" ON "automation_rules"("entity");

-- CreateIndex
CREATE INDEX "automation_rules_enabled_idx" ON "automation_rules"("enabled");

-- CreateIndex
CREATE INDEX "automation_rules_priority_idx" ON "automation_rules"("priority");

-- AddForeignKey
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
