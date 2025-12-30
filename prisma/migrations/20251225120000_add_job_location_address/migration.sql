-- Add locationAddress to Job for precise job site address
ALTER TABLE "Job" ADD COLUMN "locationAddress" TEXT NOT NULL DEFAULT '';
