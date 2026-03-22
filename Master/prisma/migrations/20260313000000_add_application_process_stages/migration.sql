-- Add new values to ApplicationStage enum (PostgreSQL)
ALTER TYPE "ApplicationStage" ADD VALUE 'FOLLOW_UP_1';
ALTER TYPE "ApplicationStage" ADD VALUE 'FOLLOW_UP_2';
ALTER TYPE "ApplicationStage" ADD VALUE 'FINAL_FOLLOW_UP';
ALTER TYPE "ApplicationStage" ADD VALUE 'NO_RESPONSE';
ALTER TYPE "ApplicationStage" ADD VALUE 'INTERVIEW_PREPARATION';

-- Add new value to ApplicationActionType enum
ALTER TYPE "ApplicationActionType" ADD VALUE 'NO_RESPONSE';
