-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CONTRACT_EMPLOYEE', 'CONTRACT_TRADE', 'CONTRACT_ANY');

-- CreateEnum
CREATE TYPE "NoticeWindow" AS ENUM ('NOTICE_12H', 'NOTICE_24H', 'NOTICE_48H');

-- AlterTable
ALTER TABLE "Job"
ADD COLUMN     "contractType" "ContractType" NOT NULL DEFAULT 'CONTRACT_ANY',
ADD COLUMN     "requiresOnCall" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minNoticeWindow" "NoticeWindow",
ADD COLUMN     "minHourlyRateOverride" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "WorkerProfile"
ADD COLUMN     "noticeWindow" "NoticeWindow" NOT NULL DEFAULT 'NOTICE_24H',
ADD COLUMN     "acceptShortNotice" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isOnCall" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onCallRadiusKm" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "onCallMinBonusEur" INTEGER,
ADD COLUMN     "preferredContractType" "ContractType" NOT NULL DEFAULT 'CONTRACT_ANY';

-- CreateIndex
CREATE INDEX "Job_contract_oncall_starts_idx" ON "Job"("contractType", "requiresOnCall", "startsAt");

-- CreateIndex
CREATE INDEX "WorkerProfile_ready_oncall_region_city_idx" ON "WorkerProfile"("isReady", "isOnCall", "region", "city");

