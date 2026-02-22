/**
 * One-off migration: add firstName, lastName, currentCompany to leads;
 * backfill from contactName/companyName; drop old columns.
 * Safe to run multiple times (idempotent).
 * Run: npx tsx scripts/run-lead-migration.ts
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check if new columns already exist
  const cols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'firstName'`
  )
  if (cols.length > 0) {
    console.log('Lead migration already applied (firstName exists). Skipping.')
    process.exit(0)
  }

  // Check if old schema exists
  const oldCols = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name IN ('companyName', 'contactName')`
  )
  if (oldCols.length < 2) {
    console.log('Leads table does not have companyName/contactName. Ensure migration state or run prisma migrate deploy.')
    process.exit(1)
  }

  console.log('Applying lead person-centric migration...')

  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ADD COLUMN "firstName" TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ADD COLUMN "lastName" TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ADD COLUMN "currentCompany" TEXT`)

  await prisma.$executeRawUnsafe(`
    UPDATE "leads" SET
      "firstName" = CASE
        WHEN TRIM(SPLIT_PART(COALESCE("contactName", 'Lead'), ' ', 1)) = '' THEN 'Unknown'
        ELSE TRIM(SPLIT_PART(COALESCE("contactName", 'Lead'), ' ', 1))
      END,
      "lastName" = CASE
        WHEN TRIM(SUBSTRING(COALESCE("contactName", ' Lead') FROM POSITION(' ' IN COALESCE("contactName", ' Lead')) + 1)) = '' THEN 'Lead'
        ELSE TRIM(SUBSTRING(COALESCE("contactName", ' Lead') FROM POSITION(' ' IN COALESCE("contactName", ' Lead')) + 1))
      END,
      "currentCompany" = "companyName"
  `)

  await prisma.$executeRawUnsafe(`UPDATE "leads" SET "firstName" = 'Unknown', "lastName" = 'Lead' WHERE "firstName" IS NULL OR "firstName" = ''`)

  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "firstName" SET NOT NULL`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ALTER COLUMN "lastName" SET NOT NULL`)

  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" DROP COLUMN "companyName"`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "leads" DROP COLUMN "contactName"`)

  console.log('Lead migration completed successfully.')

  // Mark migration as applied so "prisma migrate deploy" does not re-run it
  const { execSync } = await import('child_process')
  try {
    execSync('npx prisma migrate resolve --applied 20260221120000_lead_person_centric', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log('Migration marked as applied in Prisma.')
  } catch {
    console.warn('Could not run "prisma migrate resolve". If you use migrate deploy, run: npx prisma migrate resolve --applied 20260221120000_lead_person_centric')
  }
}

main()
  .catch((e) => {
    console.error('Lead migration failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
