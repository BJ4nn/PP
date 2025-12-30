import { prisma } from "@/server/db/client";
import { ApplicationStatus } from "@/types";
import { requireCompanyProfile } from "@/server/services/applications/shared";

type WorkerSummary = {
  id: string;
  name: string;
  city: string;
  reliabilityScore: number;
};

export type CompanyWorkerRow = WorkerSummary & { lastWorkedAt: Date };

function summarizeWorkersByMostRecentShift(
  rows: Array<{
    workerId: string;
    worker: WorkerSummary;
    job: { endsAt: Date };
  }>,
) {
  const byWorker = new Map<string, CompanyWorkerRow>();
  for (const row of rows) {
    if (byWorker.has(row.workerId)) continue;
    byWorker.set(row.workerId, { ...row.worker, lastWorkedAt: row.job.endsAt });
  }
  return Array.from(byWorker.values());
}

export async function getCompanyWorkersData(companyUserId: string) {
  const company = await requireCompanyProfile(companyUserId);
  const now = new Date();

  const [workedRows, verifiedRows] = await Promise.all([
    prisma.jobApplication.findMany({
      where: {
        status: ApplicationStatus.CONFIRMED,
        job: { companyId: company.id, endsAt: { lt: now } },
      },
      include: {
        job: { select: { endsAt: true } },
        worker: { select: { id: true, name: true, city: true, reliabilityScore: true } },
      },
      orderBy: { job: { endsAt: "desc" } },
      take: 10000,
    }),
    prisma.jobApplication.findMany({
      where: {
        status: ApplicationStatus.CONFIRMED,
        workedConfirmedAt: { not: null },
        job: { companyId: company.id, endsAt: { lt: now } },
      },
      include: {
        job: { select: { endsAt: true } },
        worker: { select: { id: true, name: true, city: true, reliabilityScore: true } },
      },
      orderBy: { job: { endsAt: "desc" } },
      take: 10000,
    }),
  ]);

  return {
    workersWorked: summarizeWorkersByMostRecentShift(
      workedRows.map((row) => ({
        workerId: row.workerId,
        worker: row.worker,
        job: row.job,
      })),
    ),
    verifiedWorkers: summarizeWorkersByMostRecentShift(
      verifiedRows.map((row) => ({
        workerId: row.workerId,
        worker: row.worker,
        job: row.job,
      })),
    ),
  };
}

export async function getCompanyWorkerProfile(
  companyUserId: string,
  workerProfileId: string,
) {
  const company = await requireCompanyProfile(companyUserId);
  const worker = await prisma.workerProfile.findFirst({
    where: {
      id: workerProfileId,
      applications: {
        some: {
          job: { companyId: company.id },
        },
      },
    },
    include: {
      user: { select: { email: true } },
    },
  });
  if (!worker) return null;

  const [relation, worked] = await Promise.all([
    prisma.workerCompanyRelation.findUnique({
      where: { companyId_workerId: { companyId: company.id, workerId: worker.id } },
      select: { isPriority: true, isNarrowCollaboration: true, narrowGroupId: true },
    }),
    prisma.jobApplication.findFirst({
      where: {
        workerId: worker.id,
        workedConfirmedAt: { not: null },
        job: { companyId: company.id },
      },
      select: { id: true },
    }),
  ]);

  return {
    ...worker,
    relation: relation ?? { isPriority: false, isNarrowCollaboration: false },
    hasWorked: Boolean(worked),
  };
}

export async function updateCompanyWorkerRelation(
  companyUserId: string,
  workerProfileId: string,
  input: {
    isPriority?: boolean;
    isNarrowCollaboration?: boolean;
    narrowGroupId?: string | null;
  },
) {
  const company = await requireCompanyProfile(companyUserId);

  const worked = await prisma.jobApplication.findFirst({
    where: {
      workerId: workerProfileId,
      workedConfirmedAt: { not: null },
      job: { companyId: company.id },
    },
    select: { id: true },
  });

  if (!worked) {
    throw new Error("Pracovník ešte nemá potvrdenú odpracovanú zmenu.");
  }

  const data: {
    isPriority?: boolean;
    isNarrowCollaboration?: boolean;
    narrowGroupId?: string | null;
  } = {};
  if (input.isPriority !== undefined) data.isPriority = input.isPriority;
  if (input.isNarrowCollaboration !== undefined)
    data.isNarrowCollaboration = input.isNarrowCollaboration;
  if (input.narrowGroupId !== undefined) {
    if (input.narrowGroupId === null) {
      data.narrowGroupId = null;
    } else {
      const group = await prisma.companyNarrowCollaborationGroup.findFirst({
        where: { id: input.narrowGroupId, companyId: company.id },
        select: { id: true },
      });
      if (!group) {
        throw new Error("Skupina užšej spolupráce nebola nájdená.");
      }
      data.narrowGroupId = group.id;
    }
  }

  if (input.isNarrowCollaboration === false) {
    data.narrowGroupId = null;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("Nie je čo uložiť.");
  }

  return prisma.workerCompanyRelation.upsert({
    where: {
      companyId_workerId: { companyId: company.id, workerId: workerProfileId },
    },
    update: data,
    create: {
      companyId: company.id,
      workerId: workerProfileId,
      ...data,
    },
  });
}
