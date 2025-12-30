-- Drawn signatures (mouse/touch) + hashes

ALTER TABLE "ContractDocument"
  ADD COLUMN IF NOT EXISTS "workerSignatureJson" JSONB,
  ADD COLUMN IF NOT EXISTS "workerSignatureSha256" TEXT,
  ADD COLUMN IF NOT EXISTS "companySignatureJson" JSONB,
  ADD COLUMN IF NOT EXISTS "companySignatureSha256" TEXT;

