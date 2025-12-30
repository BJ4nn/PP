-- Step 2 (v2): Flex conditions + on-call preferences
-- Introduces ContractTypeV2/NoticeWindowV2 and migrates existing columns from the previous Step 2 draft.

-- CreateEnum
CREATE TYPE "ContractTypeV2" AS ENUM ('EMPLOYMENT', 'TRADE_LICENSE');

-- CreateEnum
CREATE TYPE "NoticeWindowV2" AS ENUM ('H12', 'H24', 'H48');

-- WorkerProfile: migrate contract preference
ALTER TABLE "WorkerProfile" RENAME COLUMN "preferredContractType" TO "preferredContractTypeOld";
ALTER TABLE "WorkerProfile" ADD COLUMN "preferredContractType" "ContractTypeV2";

UPDATE "WorkerProfile"
SET "preferredContractType" = CASE "preferredContractTypeOld"
  WHEN 'CONTRACT_EMPLOYEE' THEN 'EMPLOYMENT'::"ContractTypeV2"
  WHEN 'CONTRACT_TRADE' THEN 'TRADE_LICENSE'::"ContractTypeV2"
  ELSE NULL
END;

-- WorkerProfile: on-call + notice preference
ALTER TABLE "WorkerProfile" ADD COLUMN "isOnCallPreferred" BOOLEAN NOT NULL DEFAULT false;
UPDATE "WorkerProfile" SET "isOnCallPreferred" = COALESCE("isOnCall", false);

ALTER TABLE "WorkerProfile" ADD COLUMN "noticePreference" "NoticeWindowV2" NOT NULL DEFAULT 'H24';
UPDATE "WorkerProfile"
SET "noticePreference" = CASE "noticeWindow"
  WHEN 'NOTICE_12H' THEN 'H12'::"NoticeWindowV2"
  WHEN 'NOTICE_24H' THEN 'H24'::"NoticeWindowV2"
  WHEN 'NOTICE_48H' THEN 'H48'::"NoticeWindowV2"
  ELSE 'H24'::"NoticeWindowV2"
END;

-- WorkerProfile: hourly rates (Float)
ALTER TABLE "WorkerProfile"
  ALTER COLUMN "minHourlyRate" TYPE DOUBLE PRECISION USING "minHourlyRate"::DOUBLE PRECISION;
ALTER TABLE "WorkerProfile"
  ADD COLUMN "minHourlyRateEmployment" DOUBLE PRECISION,
  ADD COLUMN "minHourlyRateTradeLicense" DOUBLE PRECISION;

-- Drop old Step 2 draft columns and update index
DROP INDEX IF EXISTS "WorkerProfile_ready_oncall_region_city_idx";
ALTER TABLE "WorkerProfile"
  DROP COLUMN "noticeWindow",
  DROP COLUMN "acceptShortNotice",
  DROP COLUMN "isOnCall",
  DROP COLUMN "onCallRadiusKm",
  DROP COLUMN "onCallMinBonusEur",
  DROP COLUMN "preferredContractTypeOld";

CREATE INDEX "WorkerProfile_ready_oncall_region_city_idx"
  ON "WorkerProfile"("isReady", "isOnCallPreferred", "region", "city");

-- Job: migrate contractType to nullable v2 enum
ALTER TABLE "Job" RENAME COLUMN "contractType" TO "contractTypeOld";
ALTER TABLE "Job" ADD COLUMN "contractType" "ContractTypeV2";

UPDATE "Job"
SET "contractType" = CASE "contractTypeOld"
  WHEN 'CONTRACT_EMPLOYEE' THEN 'EMPLOYMENT'::"ContractTypeV2"
  WHEN 'CONTRACT_TRADE' THEN 'TRADE_LICENSE'::"ContractTypeV2"
  ELSE NULL
END;

-- Job: notice window (required, default H24)
ALTER TABLE "Job" ADD COLUMN "noticeWindow" "NoticeWindowV2" NOT NULL DEFAULT 'H24';
UPDATE "Job"
SET "noticeWindow" = CASE "minNoticeWindow"
  WHEN 'NOTICE_12H' THEN 'H12'::"NoticeWindowV2"
  WHEN 'NOTICE_24H' THEN 'H24'::"NoticeWindowV2"
  WHEN 'NOTICE_48H' THEN 'H48'::"NoticeWindowV2"
  ELSE "noticeWindow"
END
WHERE "minNoticeWindow" IS NOT NULL;

-- Job: pay modifiers (Float)
ALTER TABLE "Job"
  ADD COLUMN "payEmployment" DOUBLE PRECISION,
  ADD COLUMN "payTradeLicense" DOUBLE PRECISION,
  ADD COLUMN "onCallBonus" DOUBLE PRECISION;

-- Drop old Step 2 draft columns and update index
DROP INDEX IF EXISTS "Job_contract_oncall_starts_idx";
ALTER TABLE "Job"
  DROP COLUMN "contractTypeOld",
  DROP COLUMN "minNoticeWindow",
  DROP COLUMN "minHourlyRateOverride";

CREATE INDEX "Job_contract_oncall_starts_idx"
  ON "Job"("contractType", "requiresOnCall", "startsAt");

-- Cleanup: old enums are no longer referenced after the migration
DROP TYPE IF EXISTS "ContractType";
DROP TYPE IF EXISTS "NoticeWindow";

