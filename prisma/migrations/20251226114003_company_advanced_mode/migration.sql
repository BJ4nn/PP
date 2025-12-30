-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "advancedModeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "narrowCollaborationCutoffHour" INTEGER NOT NULL DEFAULT 12;
