-- Contracts signing v2: company signs first + audit fields + contract notifications

DO $$ BEGIN
  ALTER TYPE "ContractStatus" ADD VALUE 'PENDING_COMPANY';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "ContractStatus" ADD VALUE 'SIGNED_BY_COMPANY';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE 'WORKER_CONTRACT_READY';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE 'COMPANY_CONTRACT_READY';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE 'COMPANY_CONTRACT_COMPLETED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ContractDocument"
  ADD COLUMN IF NOT EXISTS "documentSha256" TEXT,
  ADD COLUMN IF NOT EXISTS "workerSignedIp" TEXT,
  ADD COLUMN IF NOT EXISTS "workerSignedUserAgent" TEXT,
  ADD COLUMN IF NOT EXISTS "companySignedIp" TEXT,
  ADD COLUMN IF NOT EXISTS "companySignedUserAgent" TEXT;

