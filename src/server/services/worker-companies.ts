import { prisma } from "@/server/db/client";
import type { DayOfWeek } from "@/types";
import { requireWorker } from "@/server/services/jobs/shared";

export type WorkerCompanyRow = {
  companyId: string;
  companyName: string;
  city: string;
  region: string;
  lastWorkedAt: Date;
  isFavorite: boolean;
  isPriority: boolean;
  isNarrowCollaboration: boolean;
  advancedModeEnabled?: boolean;
  narrowCollaborationCutoffHour?: number;
  narrowCollaborationGroup?: {
    id: string;
    name: string;
    maxAdvanceWeeks: number;
  } | null;
  narrowCollaborationSchemes?: Array<{
    id: string;
    name: string;
    daysOfWeek: DayOfWeek[];
  }>;
};

async function workerHasWorked(workerId: string, companyId: string) {
  const match = await prisma.jobApplication.findFirst({
    where: {
      workerId,
      workedConfirmedAt: { not: null },
      job: { companyId },
    },
    select: { id: true },
  });
  return Boolean(match);
}

export async function getWorkerCompanySummary(userId: string, companyId: string) {
  const worker = await requireWorker(userId);

  const [workedRow, company, relation] = await Promise.all([
    prisma.jobApplication.findFirst({
      where: {
        workerId: worker.id,
        workedConfirmedAt: { not: null },
        job: { companyId },
      },
      select: { job: { select: { endsAt: true } } },
      orderBy: { job: { endsAt: "desc" } },
    }),
    prisma.companyProfile.findFirst({
      where: { id: companyId, isApproved: true, onboardingComplete: true },
      select: {
        companyName: true,
        addressCity: true,
        region: true,
        advancedModeEnabled: true,
        narrowCollaborationCutoffHour: true,
      },
    }),
    prisma.workerCompanyRelation.findUnique({
      where: { companyId_workerId: { companyId, workerId: worker.id } },
      select: {
        isFavorite: true,
        isPriority: true,
        isNarrowCollaboration: true,
        narrowGroupId: true,
      },
    }),
  ]);

  if (!workedRow || !company) return null;

  const [group, schemes] = await Promise.all([
    relation?.narrowGroupId
      ? prisma.companyNarrowCollaborationGroup.findFirst({
          where: { id: relation.narrowGroupId, companyId },
          select: { id: true, name: true, maxAdvanceWeeks: true },
        })
      : null,
    prisma.companyNarrowCollaborationScheme.findMany({
      where: { companyId },
      select: { id: true, name: true, daysOfWeek: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    companyId,
    companyName: company.companyName,
    city: company.addressCity,
    region: company.region,
    lastWorkedAt: workedRow.job.endsAt,
    isFavorite: relation?.isFavorite ?? false,
    isPriority: relation?.isPriority ?? false,
    isNarrowCollaboration: relation?.isNarrowCollaboration ?? false,
    advancedModeEnabled: company.advancedModeEnabled ?? false,
    narrowCollaborationCutoffHour: company.narrowCollaborationCutoffHour ?? 12,
    narrowCollaborationGroup: group
      ? {
          id: group.id,
          name: group.name,
          maxAdvanceWeeks: group.maxAdvanceWeeks,
        }
      : null,
    narrowCollaborationSchemes: schemes.map((scheme) => ({
      id: scheme.id,
      name: scheme.name,
      daysOfWeek: scheme.daysOfWeek as DayOfWeek[],
    })),
  } satisfies WorkerCompanyRow;
}

export async function listWorkerCompanies(userId: string) {
  const worker = await requireWorker(userId);

  const workedRows = await prisma.jobApplication.findMany({
    where: {
      workerId: worker.id,
      workedConfirmedAt: { not: null },
      job: { company: { isApproved: true, onboardingComplete: true } },
    },
    select: {
      job: {
        select: {
          companyId: true,
          endsAt: true,
          company: {
            select: { companyName: true, addressCity: true, region: true },
          },
        },
      },
    },
    orderBy: { job: { endsAt: "desc" } },
    take: 5000,
  });

  const byCompany = new Map<string, WorkerCompanyRow>();
  for (const row of workedRows) {
    const { companyId, endsAt, company } = row.job;
    if (byCompany.has(companyId)) continue;
    byCompany.set(companyId, {
      companyId,
      companyName: company.companyName,
      city: company.addressCity,
      region: company.region,
      lastWorkedAt: endsAt,
      isFavorite: false,
      isPriority: false,
      isNarrowCollaboration: false,
    });
  }

  const companyIds = Array.from(byCompany.keys());
  if (companyIds.length === 0) return [];

  const relations = await prisma.workerCompanyRelation.findMany({
    where: { workerId: worker.id, companyId: { in: companyIds } },
    select: {
      companyId: true,
      isFavorite: true,
      isPriority: true,
      isNarrowCollaboration: true,
    },
  });

  for (const relation of relations) {
    const existing = byCompany.get(relation.companyId);
    if (!existing) continue;
    existing.isFavorite = relation.isFavorite;
    existing.isPriority = relation.isPriority;
    existing.isNarrowCollaboration = relation.isNarrowCollaboration;
  }

  return Array.from(byCompany.values());
}

export async function toggleFavoriteCompany(
  userId: string,
  companyId: string,
  isFavorite: boolean,
) {
  const worker = await requireWorker(userId);

  const hasWorked = await workerHasWorked(worker.id, companyId);
  if (!hasWorked) {
    throw new Error("Firmu si môžete pridať až po odpracovanej zmene.");
  }

  return prisma.workerCompanyRelation.upsert({
    where: { companyId_workerId: { companyId, workerId: worker.id } },
    update: { isFavorite },
    create: {
      companyId,
      workerId: worker.id,
      isFavorite,
    },
  });
}

export async function requireNarrowCollaboration(
  userId: string,
  companyId: string,
) {
  const worker = await requireWorker(userId);
  const relation = await prisma.workerCompanyRelation.findUnique({
    where: { companyId_workerId: { companyId, workerId: worker.id } },
    select: { isNarrowCollaboration: true },
  });
  if (!relation?.isNarrowCollaboration) {
    throw new Error("Užšia spolupráca nie je pre túto firmu povolená.");
  }
  return worker;
}
