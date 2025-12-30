import { prisma } from "@/server/db/client";
import { ApplicationStatus, NoticeWindow } from "@/types";

export type CompanyKpis = {
  rangeDays: number;
  windowStart: Date;
  windowEnd: Date;
  neededSlots: number;
  confirmedSlots: number;
  fillRate: number | null;
  confirmedShifts: number;
  completedConfirmedShifts: number;
  completionProxy: number | null;
  applicationsTotal: number;
  cancellationsTotal: number;
  cancellationsByWorker: number;
  cancellationsByCompany: number;
  cancellationRate: number | null;
  avgApplicantReliability: number | null;
  slaHint: string;
};

const NOTICE_HOURS: Record<NoticeWindow, number> = {
  [NoticeWindow.H12]: 12,
  [NoticeWindow.H24]: 24,
  [NoticeWindow.H48]: 48,
};

function safeRate(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

function parseNumeric(value: unknown) {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function getCompanyKpis(companyId: string, rangeDays: number): Promise<CompanyKpis> {
  const now = new Date();
  const safeRangeDays = [7, 30, 90].includes(rangeDays) ? rangeDays : 30;
  const windowStart = new Date(now.getTime() - safeRangeDays * 24 * 60 * 60 * 1000);
  const windowEnd = now;

  const jobWhere = {
    companyId,
    startsAt: { gte: windowStart, lte: windowEnd },
  } as const;

  const cancelStatuses = [
    ApplicationStatus.CANCELLED_BY_WORKER,
    ApplicationStatus.CANCELLED_BY_COMPANY,
    ApplicationStatus.WORKER_CANCELED_LATE,
    ApplicationStatus.COMPANY_CANCELED_LATE,
  ];
  const workerCancelStatuses = [
    ApplicationStatus.CANCELLED_BY_WORKER,
    ApplicationStatus.WORKER_CANCELED_LATE,
  ];
  const companyCancelStatuses = [
    ApplicationStatus.CANCELLED_BY_COMPANY,
    ApplicationStatus.COMPANY_CANCELED_LATE,
  ];

  const [
    jobAgg,
    confirmedSlots,
    confirmedShifts,
    completedConfirmedShifts,
    applicationsTotal,
    cancellationsTotal,
    cancellationsByWorker,
    cancellationsByCompany,
    avgReliabilityRows,
    policyGroups,
  ] = await Promise.all([
    prisma.job.aggregate({
      where: jobWhere,
      _sum: { neededWorkers: true },
      _count: { _all: true },
    }),
    prisma.jobApplication.count({
      where: { status: ApplicationStatus.CONFIRMED, job: jobWhere },
    }),
    prisma.jobApplication.count({
      where: { status: ApplicationStatus.CONFIRMED, job: jobWhere },
    }),
    prisma.jobApplication.count({
      where: {
        status: ApplicationStatus.CONFIRMED,
        job: { ...jobWhere, endsAt: { lt: now } },
      },
    }),
    prisma.jobApplication.count({ where: { job: jobWhere } }),
    prisma.jobApplication.count({
      where: { status: { in: cancelStatuses }, job: jobWhere },
    }),
    prisma.jobApplication.count({
      where: { status: { in: workerCancelStatuses }, job: jobWhere },
    }),
    prisma.jobApplication.count({
      where: { status: { in: companyCancelStatuses }, job: jobWhere },
    }),
    prisma.$queryRaw<
      Array<{ avg_reliability: number | null }>
    >`SELECT AVG(COALESCE(w."reliabilityScore",0)) AS avg_reliability
       FROM "JobApplication" a
       JOIN "WorkerProfile" w ON w.id = a."workerId"
       JOIN "Job" j ON j.id = a."jobId"
       WHERE j."companyId" = ${companyId}
         AND j."startsAt" >= ${windowStart}
         AND j."startsAt" <= ${windowEnd}`,
    prisma.job.groupBy({
      by: ["noticeWindow", "cancellationCompensationPct"],
      where: jobWhere,
      _count: { _all: true },
    }),
  ]);

  const neededSlots = Number(jobAgg._sum.neededWorkers ?? 0);

  const avgApplicantReliability = parseNumeric(avgReliabilityRows?.[0]?.avg_reliability);

  const slaHint = (() => {
    if (!policyGroups || policyGroups.length === 0) return "Bez dát";
    if (policyGroups.length > 1) return "Politika storna sa líši podľa zmeny.";
    const one = policyGroups[0];
    const hours = NOTICE_HOURS[one.noticeWindow as NoticeWindow] ?? 24;
    const pct = Number(one.cancellationCompensationPct ?? 0);
    if (pct <= 0) return `Storno okno: ${hours}h · bez kompenzácie`;
    return `Storno okno: ${hours}h · kompenzácia ${pct}%`;
  })();

  return {
    rangeDays: safeRangeDays,
    windowStart,
    windowEnd,
    neededSlots,
    confirmedSlots,
    fillRate: safeRate(confirmedSlots, neededSlots),
    confirmedShifts,
    completedConfirmedShifts,
    completionProxy: safeRate(completedConfirmedShifts, confirmedShifts),
    applicationsTotal,
    cancellationsTotal,
    cancellationsByWorker,
    cancellationsByCompany,
    cancellationRate: safeRate(cancellationsTotal, applicationsTotal),
    avgApplicantReliability,
    slaHint,
  };
}

