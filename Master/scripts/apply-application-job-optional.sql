-- Make applications.jobId nullable so applications can be created without a job.
-- Safe to run multiple times (ALTER COLUMN DROP NOT NULL is idempotent if already nullable).
ALTER TABLE "applications" ALTER COLUMN "jobId" DROP NOT NULL;
