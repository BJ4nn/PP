import { prisma } from "@/server/db/client";

export type WorkerCompanyFlags = {
  isFavorite: boolean;
  isPriority: boolean;
  isNarrowCollaboration: boolean;
  hasWorked: boolean;
};

const defaultFlags: WorkerCompanyFlags = {
  isFavorite: false,
  isPriority: false,
  isNarrowCollaboration: false,
  hasWorked: false,
};

export async function getWorkerCompanyFlags(workerId: string, companyIds: string[]) {
  const uniqueCompanyIds = Array.from(new Set(companyIds));
  if (uniqueCompanyIds.length === 0) return new Map<string, WorkerCompanyFlags>();

  const flags = new Map<string, WorkerCompanyFlags>(
    uniqueCompanyIds.map((companyId) => [companyId, { ...defaultFlags }]),
  );

  const [relations, workedRows] = await Promise.all([
    prisma.workerCompanyRelation.findMany({
      where: { workerId, companyId: { in: uniqueCompanyIds } },
      select: {
        companyId: true,
        isFavorite: true,
        isPriority: true,
        isNarrowCollaboration: true,
      },
    }),
    prisma.jobApplication.findMany({
      where: {
        workerId,
        workedConfirmedAt: { not: null },
        job: { companyId: { in: uniqueCompanyIds } },
      },
      select: {
        job: { select: { companyId: true } },
      },
      take: 5000,
    }),
  ]);

  for (const relation of relations) {
    const entry = flags.get(relation.companyId);
    if (!entry) continue;
    entry.isFavorite = relation.isFavorite;
    entry.isPriority = relation.isPriority;
    entry.isNarrowCollaboration = relation.isNarrowCollaboration;
  }

  for (const row of workedRows) {
    const entry = flags.get(row.job.companyId);
    if (!entry) continue;
    entry.hasWorked = true;
  }

  return flags;
}
