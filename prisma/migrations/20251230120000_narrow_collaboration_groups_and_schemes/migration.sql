-- Narrow collaboration groups and schemes
CREATE TABLE "CompanyNarrowCollaborationGroup" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxAdvanceWeeks" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyNarrowCollaborationGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyNarrowCollaborationScheme" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "daysOfWeek" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyNarrowCollaborationScheme_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkerCompanyRelation" ADD COLUMN "narrowGroupId" TEXT;

CREATE INDEX "CompanyNarrowCollaborationGroup_company_idx" ON "CompanyNarrowCollaborationGroup"("companyId");
CREATE INDEX "CompanyNarrowCollaborationScheme_company_idx" ON "CompanyNarrowCollaborationScheme"("companyId");
CREATE INDEX "WorkerCompanyRelation_narrow_group_idx" ON "WorkerCompanyRelation"("narrowGroupId");

ALTER TABLE "CompanyNarrowCollaborationGroup" ADD CONSTRAINT "CompanyNarrowCollaborationGroup_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyNarrowCollaborationScheme" ADD CONSTRAINT "CompanyNarrowCollaborationScheme_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkerCompanyRelation" ADD CONSTRAINT "WorkerCompanyRelation_narrowGroupId_fkey" FOREIGN KEY ("narrowGroupId") REFERENCES "CompanyNarrowCollaborationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
