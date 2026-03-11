-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('HR', 'MANAGER', 'DEVELOPER', 'RECRUITER', 'DIRECTOR', 'CTO', 'CEO', 'OTHER');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "location" TEXT,
    "size" "CompanySize",
    "description" TEXT,
    "linkedinUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_contacts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "ContactRole" NOT NULL DEFAULT 'OTHER',
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_notes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_industry_idx" ON "companies"("industry");

-- CreateIndex
CREATE INDEX "companies_createdById_idx" ON "companies"("createdById");

-- CreateIndex
CREATE INDEX "company_contacts_companyId_idx" ON "company_contacts"("companyId");

-- CreateIndex
CREATE INDEX "company_notes_companyId_idx" ON "company_notes"("companyId");

-- CreateIndex
CREATE INDEX "jobs_companyId_idx" ON "jobs"("companyId");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_notes" ADD CONSTRAINT "company_notes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_notes" ADD CONSTRAINT "company_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

