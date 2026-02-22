-- CreateTable
CREATE TABLE "onboarding_forms" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_form_submissions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "clientId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "onboarding_forms_createdById_idx" ON "onboarding_forms"("createdById");

-- CreateIndex
CREATE INDEX "onboarding_form_submissions_formId_idx" ON "onboarding_form_submissions"("formId");

-- CreateIndex
CREATE INDEX "onboarding_form_submissions_clientId_idx" ON "onboarding_form_submissions"("clientId");

-- AddForeignKey
ALTER TABLE "onboarding_forms" ADD CONSTRAINT "onboarding_forms_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_form_submissions" ADD CONSTRAINT "onboarding_form_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "onboarding_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_form_submissions" ADD CONSTRAINT "onboarding_form_submissions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
