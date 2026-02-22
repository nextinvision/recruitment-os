-- Migration script to convert Applications from Candidates to Clients
-- This script should be run AFTER the schema migration

-- Step 1: If you have a way to map Candidates to Clients, use this:
-- UPDATE applications 
-- SET "clientId" = (
--   SELECT id FROM clients 
--   WHERE clients.email = (
--     SELECT email FROM candidates WHERE candidates.id = applications."candidateId"
--   ) LIMIT 1
-- )
-- WHERE "clientId" IS NULL AND "candidateId" IS NOT NULL;

-- Step 2: For applications that cannot be mapped, you can either:
-- Option A: Delete them (if they're test data)
-- DELETE FROM applications WHERE "clientId" IS NULL;

-- Option B: Create placeholder clients for them
-- INSERT INTO clients (id, "firstName", "lastName", email, "assignedUserId", status, "createdAt", "updatedAt")
-- SELECT 
--   gen_random_uuid()::text,
--   c."firstName",
--   c."lastName", 
--   c.email,
--   a."recruiterId",
--   'ACTIVE',
--   NOW(),
--   NOW()
-- FROM applications a
-- JOIN candidates c ON a."candidateId" = c.id
-- WHERE a."clientId" IS NULL
-- ON CONFLICT DO NOTHING;

-- Then update applications:
-- UPDATE applications a
-- SET "clientId" = (
--   SELECT id FROM clients 
--   WHERE clients.email = (
--     SELECT email FROM candidates WHERE candidates.id = a."candidateId"
--   ) LIMIT 1
-- )
-- WHERE a."clientId" IS NULL;

-- Step 3: After migration, make clientId required in schema and remove candidateId column
-- ALTER TABLE applications ALTER COLUMN "clientId" SET NOT NULL;
-- ALTER TABLE applications DROP COLUMN "candidateId";


