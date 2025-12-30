import { prisma } from "@/server/db/client";
import { requireCompanyProfile } from "@/server/services/applications/shared";

export type CompanyWorkerGroupRow = {
  id: string;
  name: string;
  city: string;
  reliabilityScore: number;
  lastWorkedAt: Date | null;
};

function normalizeWorkerName(value: string | null) {
  return value && value.trim().length > 0 ? value : "Nezname meno";
}

function normalizeWorkerCity(value: string | null) {
  return value && value.trim().length > 0 ? value : "Nezname mesto";
}

export async function getCompanyWorkerGroups(companyUserId: string) {
  const company = await requireCompanyProfile(companyUserId);

  const relations = await prisma.workerCompanyRelation.findMany({
    where: {
      companyId: company.id,
      OR: [{ isPriority: true }, { isNarrowCollaboration: true }],
    },
    select: {
      workerId: true,
      isPriority: true,
      isNarrowCollaboration: true,
      worker: {
        select: {
          id: true,
          name: true,
          city: true,
          reliabilityScore: true,
        },
      },
    },
    take: 5000,
  });

  const workerIds = relations.map((row) => row.workerId);
  const workedRows =
    workerIds.length === 0
      ? []
      : await prisma.jobApplication.findMany({
          where: {
            workerId: { in: workerIds },
            workedConfirmedAt: { not: null },
            job: { companyId: company.id },
          },
          select: {
            workerId: true,
            job: { select: { endsAt: true } },
          },
          orderBy: { job: { endsAt: "desc" } },
          distinct: ["workerId"],
          take: 5000,
        });

  const lastWorkedById = new Map(
    workedRows.map((row) => [row.workerId, row.job.endsAt] as const),
  );

  const rows = relations.map((relation) => ({
    id: relation.worker.id,
    name: normalizeWorkerName(relation.worker.name),
    city: normalizeWorkerCity(relation.worker.city),
    reliabilityScore: relation.worker.reliabilityScore ?? 0,
    lastWorkedAt: lastWorkedById.get(relation.workerId) ?? null,
    isPriority: relation.isPriority,
    isNarrow: relation.isNarrowCollaboration,
  }));
  const stripFlags = (row: (typeof rows)[number]) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    reliabilityScore: row.reliabilityScore,
    lastWorkedAt: row.lastWorkedAt,
  });

  return {
    priorityWorkers: rows.filter((row) => row.isPriority).map(stripFlags),
    narrowWorkers: rows.filter((row) => row.isNarrow).map(stripFlags),
  };
}
