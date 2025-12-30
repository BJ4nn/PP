-- Beta contracts + worker attendance confirmation

DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('PENDING_WORKER', 'SIGNED_BY_WORKER', 'COMPLETED', 'VOID');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ContractTemplate" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "intro" TEXT,
  "workplaceRules" TEXT,
  "customTerms" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ContractTemplate"
    ADD CONSTRAINT "ContractTemplate_companyId_key" UNIQUE ("companyId");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ContractTemplate"
  ADD CONSTRAINT "ContractTemplate_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ContractDocument" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "templateId" TEXT,
  "status" "ContractStatus" NOT NULL DEFAULT 'PENDING_WORKER',
  "titleSnapshot" TEXT NOT NULL,
  "bodySnapshot" TEXT NOT NULL,
  "workerSignedAt" TIMESTAMP(3),
  "workerSignatureName" TEXT,
  "companySignedAt" TIMESTAMP(3),
  "companySignatureName" TEXT,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContractDocument_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "ContractDocument"
    ADD CONSTRAINT "ContractDocument_applicationId_key" UNIQUE ("applicationId");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ContractDocument"
  ADD CONSTRAINT "ContractDocument_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractDocument"
  ADD CONSTRAINT "ContractDocument_workerId_fkey"
  FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractDocument"
  ADD CONSTRAINT "ContractDocument_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractDocument"
  ADD CONSTRAINT "ContractDocument_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractDocument"
  ADD CONSTRAINT "ContractDocument_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "ContractDocument_companyId_createdAt_idx"
  ON "ContractDocument"("companyId", "createdAt");

CREATE INDEX IF NOT EXISTS "ContractDocument_workerId_createdAt_idx"
  ON "ContractDocument"("workerId", "createdAt");

ALTER TABLE "JobApplication"
  ADD COLUMN IF NOT EXISTS "workerWorkedConfirmedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "workerWorkedNote" TEXT;

