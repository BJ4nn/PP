-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "bundleBonusEur" INTEGER,
ADD COLUMN     "bundleHourlyRateEur" INTEGER,
ADD COLUMN     "bundleMinDays" INTEGER,
ADD COLUMN     "bundleMinHours" INTEGER,
ADD COLUMN     "confirmBy" TIMESTAMP(3),
ADD COLUMN     "isBundle" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "urgentBonusEur" INTEGER;

