-- Idempotent setup for onboarding_forms and onboarding_form_submissions.
-- Safe to run multiple times. Use when migrate deploy is blocked by earlier migrations.

CREATE TABLE IF NOT EXISTS "onboarding_forms" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "fields" JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "onboarding_forms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "onboarding_form_submissions" (
  "id" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "clientId" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "onboarding_form_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "onboarding_forms_createdById_idx" ON "onboarding_forms"("createdById");
CREATE INDEX IF NOT EXISTS "onboarding_form_submissions_formId_idx" ON "onboarding_form_submissions"("formId");
CREATE INDEX IF NOT EXISTS "onboarding_form_submissions_clientId_idx" ON "onboarding_form_submissions"("clientId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_forms_createdById_fkey') THEN
    ALTER TABLE "onboarding_forms" ADD CONSTRAINT "onboarding_forms_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_form_submissions_formId_fkey') THEN
    ALTER TABLE "onboarding_form_submissions" ADD CONSTRAINT "onboarding_form_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "onboarding_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'onboarding_form_submissions_clientId_fkey') THEN
    ALTER TABLE "onboarding_form_submissions" ADD CONSTRAINT "onboarding_form_submissions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
