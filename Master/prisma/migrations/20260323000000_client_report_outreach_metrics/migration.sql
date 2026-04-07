-- AlterTable
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "referralsSentCount" INTEGER;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "connectionRequestsSentCount" INTEGER;
