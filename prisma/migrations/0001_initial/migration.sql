-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WORKER', 'COMPANY', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('NONE', 'BASIC', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('BA', 'SENEC', 'TRNAVA', 'GALANTA');

-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('WAREHOUSE', 'FULFILLMENT', 'RETAIL_DISTRIBUTION', 'PRODUCTION_SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED_BY_WORKER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "hasTradeLicense" BOOLEAN NOT NULL DEFAULT false,
    "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'NONE',
    "hasVZV" BOOLEAN NOT NULL DEFAULT false,
    "hasBOZP" BOOLEAN NOT NULL DEFAULT false,
    "hasFoodCard" BOOLEAN NOT NULL DEFAULT false,
    "hasCar" BOOLEAN NOT NULL DEFAULT false,
    "availabilityJson" JSONB NOT NULL,
    "minHourlyRate" DECIMAL(10,2),
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "siteName" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "addressStreet" TEXT NOT NULL,
    "addressCity" TEXT NOT NULL,
    "addressZip" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "warehouseType" "WarehouseType" NOT NULL,
    "ico" VARCHAR(32),
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locationCity" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "warehouseType" "WarehouseType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "requiredVzv" BOOLEAN NOT NULL DEFAULT false,
    "minExperience" "ExperienceLevel",
    "neededWorkers" INTEGER NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerProfile_userId_key" ON "WorkerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_userId_key" ON "CompanyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_workerId_key" ON "JobApplication"("jobId", "workerId");

-- AddForeignKey
ALTER TABLE "WorkerProfile" ADD CONSTRAINT "WorkerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

