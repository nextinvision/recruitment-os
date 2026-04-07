-- AlterTable
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "reportOutreachCustomFields" JSONB NOT NULL DEFAULT '[]';
