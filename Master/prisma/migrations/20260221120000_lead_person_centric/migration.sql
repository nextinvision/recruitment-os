-- Lead: organisation -> person (job seeker). Add firstName, lastName, currentCompany; backfill; drop companyName, contactName.
ALTER TABLE "leads" ADD COLUMN "firstName" TEXT;
ALTER TABLE "leads" ADD COLUMN "lastName" TEXT;
ALTER TABLE "leads" ADD COLUMN "currentCompany" TEXT;

UPDATE "leads" SET
  "firstName" = CASE
    WHEN TRIM(SPLIT_PART(COALESCE("contactName", 'Lead'), ' ', 1)) = '' THEN 'Unknown'
    ELSE TRIM(SPLIT_PART(COALESCE("contactName", 'Lead'), ' ', 1))
  END,
  "lastName" = CASE
    WHEN TRIM(SUBSTRING(COALESCE("contactName", ' Lead') FROM POSITION(' ' IN COALESCE("contactName", ' Lead')) + 1)) = '' THEN 'Lead'
    ELSE TRIM(SUBSTRING(COALESCE("contactName", ' Lead') FROM POSITION(' ' IN COALESCE("contactName", ' Lead')) + 1))
  END,
  "currentCompany" = "companyName";

UPDATE "leads" SET "firstName" = 'Unknown', "lastName" = 'Lead' WHERE "firstName" IS NULL OR "firstName" = '';

ALTER TABLE "leads" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "leads" ALTER COLUMN "lastName" SET NOT NULL;

ALTER TABLE "leads" DROP COLUMN "companyName";
ALTER TABLE "leads" DROP COLUMN "contactName";
