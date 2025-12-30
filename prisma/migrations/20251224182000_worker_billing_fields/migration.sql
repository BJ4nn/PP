-- AlterTable
ALTER TABLE "WorkerProfile"
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "billingStreet" TEXT,
ADD COLUMN     "billingZip" TEXT,
ADD COLUMN     "billingIban" TEXT,
ADD COLUMN     "billingIco" VARCHAR(32);

