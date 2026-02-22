-- AlterTable: Make Application.jobId optional so applications can be created without a job
ALTER TABLE "applications" ALTER COLUMN "jobId" DROP NOT NULL;
