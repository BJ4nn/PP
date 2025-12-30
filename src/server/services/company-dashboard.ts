import { prisma } from "@/server/db/client";
import { ApplicationStatus, JobStatus } from "@/types";
import { requireCompanyProfile } from "@/server/services/applications/shared";

type WorkerSummary = {
  id: string;
  name: string;
  city: string;
  reliabilityScore: number;
};

export type WorkedConfirmationItem = {
  applicationId: string;
  worker: WorkerSummary;
  job: {
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    status: JobStatus;
  };
};

export type CalendarJobItem = {
  id: string;
  title: string;
  status: JobStatus;
  startsAt: Date;
  endsAt: Date;
  neededWorkers: number;
  applicantsCount: number;
  confirmedCount: number;
  missingCount: number;
};

export type CalendarDay = {
  dateKey: string; // YYYY-MM-DD (UTC)
  jobs: CalendarJobItem[];
  applicantsCount: number;
  confirmedCount: number;
  neededWorkers: number;
  missingCount: number;
};

export type CompanyDashboardData = {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  days: CalendarDay[];
  workersWorked: Array<WorkerSummary & { lastWorkedAt: Date }>;
  verifiedWorkers: Array<WorkerSummary & { lastWorkedAt: Date }>;
  pendingWorkedConfirmations: WorkedConfirmationItem[];
};

function safeUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function clampNonNegative(n: number) {
  return n < 0 ? 0 : n;
}

function parseMonthKey(value: string | null | undefined) {
  const input = (value ?? "").trim();
  const match = /^(\d{4})-(\d{2})$/.exec(input);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-");
  const month = Number(m);
  const names = [
    "Január",
    "Február",
    "Marec",
    "Apríl",
    "Máj",
    "Jún",
    "Júl",
    "August",
    "September",
    "Október",
    "November",
    "December",
  ];
  return `${names[month - 1] ?? m} ${y}`;
}

function getMonthRange(monthKey: string) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) throw new Error("Invalid monthKey");
  const start = new Date(Date.UTC(parsed.year, parsed.month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(parsed.year, parsed.month, 1, 0, 0, 0));
  return { start, end };
}

function daysInMonth(monthKey: string) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) throw new Error("Invalid monthKey");
  return new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
}

function getDefaultMonthKey(now: Date) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function buildMonthDays(monthKey: string) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) throw new Error("Invalid monthKey");
  const total = daysInMonth(monthKey);
  const days: CalendarDay[] = [];
  for (let d = 1; d <= total; d += 1) {
    const date = new Date(Date.UTC(parsed.year, parsed.month - 1, d, 0, 0, 0));
    days.push({
      dateKey: safeUtcDateKey(date),
      jobs: [],
      applicantsCount: 0,
      confirmedCount: 0,
      neededWorkers: 0,
      missingCount: 0,
    });
  }
  return days;
}

function summarizeWorkersByMostRecentShift(
  rows: Array<{
    workerId: string;
    worker: WorkerSummary;
    job: { endsAt: Date };
  }>,
) {
  const byWorker = new Map<string, WorkerSummary & { lastWorkedAt: Date }>();
  for (const row of rows) {
    if (byWorker.has(row.workerId)) continue;
    byWorker.set(row.workerId, { ...row.worker, lastWorkedAt: row.job.endsAt });
  }
  return Array.from(byWorker.values());
}

export async function getCompanyDashboardData(
  companyUserId: string,
  options?: { monthKey?: string | null },
): Promise<CompanyDashboardData> {
  const company = await requireCompanyProfile(companyUserId);
  const now = new Date();

  const requestedMonthKey = (options?.monthKey ?? "").trim();
  const safeMonthKey = parseMonthKey(requestedMonthKey)
    ? requestedMonthKey
    : getDefaultMonthKey(now);
  const { start, end } = getMonthRange(safeMonthKey);

  const jobs = await prisma.job.findMany({
    where: {
      companyId: company.id,
      startsAt: { gte: start, lt: end },
    },
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      endsAt: true,
      neededWorkers: true,
    },
    orderBy: { startsAt: "asc" },
    take: 5000,
  });

  const jobIds = jobs.map((job) => job.id);
  const relevantApplications =
    jobIds.length === 0
      ? []
      : await prisma.jobApplication.findMany({
          where: {
            jobId: { in: jobIds },
            status: { in: [ApplicationStatus.PENDING, ApplicationStatus.CONFIRMED] },
          },
          select: { jobId: true, status: true },
          take: 200000,
        });

  const statsByJobId = new Map<
    string,
    { applicantsCount: number; confirmedCount: number }
  >();
  for (const app of relevantApplications) {
    const prev = statsByJobId.get(app.jobId) ?? { applicantsCount: 0, confirmedCount: 0 };
    prev.applicantsCount += 1;
    if (app.status === ApplicationStatus.CONFIRMED) prev.confirmedCount += 1;
    statsByJobId.set(app.jobId, prev);
  }

  const days = buildMonthDays(safeMonthKey);
  const dayIndex = new Map(days.map((d, idx) => [d.dateKey, idx] as const));

  for (const job of jobs) {
    const key = safeUtcDateKey(job.startsAt);
    const idx = dayIndex.get(key);
    if (idx === undefined) continue;
    const stats = statsByJobId.get(job.id) ?? { applicantsCount: 0, confirmedCount: 0 };
    const missingCount = clampNonNegative(job.neededWorkers - stats.confirmedCount);

    days[idx].jobs.push({
      id: job.id,
      title: job.title,
      status: job.status,
      startsAt: job.startsAt,
      endsAt: job.endsAt,
      neededWorkers: job.neededWorkers,
      applicantsCount: stats.applicantsCount,
      confirmedCount: stats.confirmedCount,
      missingCount,
    });
  }

  for (const day of days) {
    day.jobs.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    day.neededWorkers = day.jobs.reduce((sum, j) => sum + j.neededWorkers, 0);
    day.applicantsCount = day.jobs.reduce((sum, j) => sum + j.applicantsCount, 0);
    day.confirmedCount = day.jobs.reduce((sum, j) => sum + j.confirmedCount, 0);
    day.missingCount = clampNonNegative(day.neededWorkers - day.confirmedCount);
  }

  const [workedRows, verifiedRows, pendingWorkedConfirmations] = await Promise.all([
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
      take: 5000,
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
      take: 5000,
    }),
    prisma.jobApplication.findMany({
      where: {
        status: ApplicationStatus.CONFIRMED,
        workedConfirmedAt: null,
        job: { companyId: company.id, endsAt: { lt: now } },
      },
      include: {
        job: { select: { id: true, title: true, startsAt: true, endsAt: true, status: true } },
        worker: { select: { id: true, name: true, city: true, reliabilityScore: true } },
      },
      orderBy: { job: { endsAt: "desc" } },
      take: 300,
    }),
  ]);

  return {
    monthKey: safeMonthKey,
    monthLabel: monthLabel(safeMonthKey),
    days,
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
    pendingWorkedConfirmations: pendingWorkedConfirmations.map((row) => ({
      applicationId: row.id,
      worker: row.worker,
      job: row.job,
    })),
  };
}
