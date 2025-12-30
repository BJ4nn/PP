-- Add job wave stage enum
CREATE TYPE "JobWaveStage" AS ENUM ('WAVE1', 'WAVE2', 'PUBLIC');

-- Add wave fields to Job
ALTER TABLE "Job" ADD COLUMN "waveStage" "JobWaveStage" NOT NULL DEFAULT 'WAVE1';
ALTER TABLE "Job" ADD COLUMN "waveStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Worker/company relation table
CREATE TABLE "WorkerCompanyRelation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "isNarrowCollaboration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerCompanyRelation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkerCompanyRelation_company_worker_key" ON "WorkerCompanyRelation"("companyId", "workerId");
CREATE INDEX "WorkerCompanyRelation_worker_idx" ON "WorkerCompanyRelation"("workerId");
CREATE INDEX "WorkerCompanyRelation_company_idx" ON "WorkerCompanyRelation"("companyId");

ALTER TABLE "WorkerCompanyRelation" ADD CONSTRAINT "WorkerCompanyRelation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkerCompanyRelation" ADD CONSTRAINT "WorkerCompanyRelation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
