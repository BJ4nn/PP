-- CreateEnum
CREATE TYPE "CanceledBy" AS ENUM ('WORKER', 'COMPANY', 'SYSTEM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ApplicationStatus" ADD VALUE 'WORKER_CANCELED_LATE';
ALTER TYPE "ApplicationStatus" ADD VALUE 'COMPANY_CANCELED_LATE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'WORKER_APPLICATION_CANCELED_LATE_BY_COMPANY';
ALTER TYPE "NotificationType" ADD VALUE 'COMPANY_APPLICATION_CANCELED_LATE_BY_WORKER';
ALTER TYPE "NotificationType" ADD VALUE 'ON_CALL_PING';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "cancellationCompensationPct" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "canceledBy" "CanceledBy",
ADD COLUMN     "compensationAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Job_status_region_starts_idx" ON "Job"("status", "region", "startsAt");

-- CreateIndex
CREATE INDEX "JobApplication_job_status_idx" ON "JobApplication"("jobId", "status");
