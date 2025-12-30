-- Add optional position types for jobs (multi-select)
ALTER TABLE "Job"
ADD COLUMN "positionTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

