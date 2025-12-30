-- Extend application status enum
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'CANCELLED_BY_COMPANY';

-- New enums
CREATE TYPE "PhysicalLevel" AS ENUM ('LIGHT', 'MEDIUM', 'HEAVY');
CREATE TYPE "ApplicationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- Worker profile enhancements
ALTER TABLE "WorkerProfile"
  ADD COLUMN "isReady" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "activityScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "reliabilityScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastReadyAt" TIMESTAMP(3),
  ADD COLUMN "lastActiveAt" TIMESTAMP(3);

-- Job timing + difficulty
ALTER TABLE "Job"
  RENAME COLUMN "date" TO "startsAt";

ALTER TABLE "Job"
  ADD COLUMN "endsAt" TIMESTAMP(3),
  ADD COLUMN "physicalLevel" "PhysicalLevel" NOT NULL DEFAULT 'MEDIUM';

UPDATE "Job"
SET "endsAt" = "startsAt" + make_interval(hours => "durationHours");

ALTER TABLE "Job"
  ALTER COLUMN "endsAt" SET NOT NULL;

-- Job application scoring
ALTER TABLE "JobApplication"
  ADD COLUMN "matchScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "priority" "ApplicationPriority" NOT NULL DEFAULT 'NORMAL';
