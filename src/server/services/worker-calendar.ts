import { prisma } from "@/server/db/client";
import { JobStatus, JobWaveStage, NoticeWindow } from "@/types";
import { requireWorker, allowedExperienceLevels } from "@/server/services/jobs/shared";
import { scoreWorkerForJob } from "@/server/services/jobs/scoring";
import {
  getEffectivePayForWorker,
  workerMeetsBundle,
  workerMeetsFlexConditions,
} from "@/server/services/jobs/worker-eligibility";
import { canWorkerSeeWave, getEffectiveWaveStage } from "@/server/services/jobs/waves";
import { getWorkerCompanyFlags } from "@/server/services/jobs/worker-company-flags";

export type WorkerCalendarJobClient = {
  id: string;
  title: string;
  description: string;
  locationCity: string;
  locationAddress: string;
  region: string;
  warehouseType: string;
  startsAtIso: string;
  endsAtIso: string;
  durationHours: number;
  hourlyRate: string | number;
  effectiveHourlyRate?: number;
  requiredVzv: boolean;
  isUrgent: boolean;
  urgentBonusEur: number | null;
  confirmByIso: string | null;
  isBundle: boolean;
  bundleMinHours: number | null;
  bundleMinDays: number | null;
  bundleBonusEur: number | null;
  bundleHourlyRateEur: string | number | null;
  contractType: string | null;
  noticeWindow: NoticeWindow;
  cancellationCompensationPct: number;
  relevanceScore: number;
  inviteStage: JobWaveStage;
  isFavoriteCompany: boolean;
  isVerifiedCompany: boolean;
  isPriorityCompany: boolean;
  company: { companyName: string };
};

export type WorkerCalendarMyShiftClient = {
  applicationId: string;
  jobId: string;
  title: string;
  startsAtIso: string;
  endsAtIso: string;
  locationCity: string;
  locationAddress: string;
  region: string;
  companyName: string;
};

export type WorkerCalendarDayClient = {
  dateKey: string; // YYYY-MM-DD (UTC)
  availableCount: number;
  myCount: number;
  availableJobs: WorkerCalendarJobClient[];
  myShifts: WorkerCalendarMyShiftClient[];
};

function parseMonthKey(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function getMonthRangeUtc(monthKey: string) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return null;
  const start = new Date(Date.UTC(parsed.year, parsed.month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(parsed.year, parsed.month, 1, 0, 0, 0));
  return { start, end };
}

function addDaysUtc(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function toDateKeyUtc(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildMonthDays(monthKey: string) {
  const range = getMonthRangeUtc(monthKey);
  if (!range) return [];
  const days: string[] = [];
  for (let d = range.start; d < range.end; d = addDaysUtc(d, 1)) {
    days.push(toDateKeyUtc(d));
  }
  return days;
}

export async function getWorkerCalendarData(workerUserId: string, monthKey: string) {
  const worker = await requireWorker(workerUserId);
  const range = getMonthRangeUtc(monthKey);
  if (!range) throw new Error("Invalid month");

  const now = new Date();
  const start = range.start.getTime() < now.getTime() ? now : range.start;
  const end = range.end;
  const experienceFilter = allowedExperienceLevels(worker.experienceLevel);

  const [jobsRaw, myAppsRaw] = await Promise.all([
    prisma.job.findMany({
      where: {
        status: JobStatus.OPEN,
        company: { isApproved: true, onboardingComplete: true },
        startsAt: { gte: start, lt: end },
        ...(worker.hasVZV ? {} : { requiredVzv: false }),
        AND: [
          { OR: [{ confirmBy: null }, { confirmBy: { gt: now } }] },
          { OR: [{ minExperience: null }, { minExperience: { in: experienceFilter } }] },
        ],
      },
      include: { company: true },
      orderBy: { startsAt: "asc" },
      take: 2000,
    }),
    prisma.jobApplication.findMany({
      where: {
        workerId: worker.id,
        status: "CONFIRMED",
        job: { startsAt: { gte: range.start, lt: range.end } },
      },
      include: { job: { include: { company: true } } },
      orderBy: { job: { startsAt: "asc" } },
      take: 500,
    }),
  ]);

  const companyIds = Array.from(new Set(jobsRaw.map((job) => job.companyId)));
  const companyFlags = await getWorkerCompanyFlags(worker.id, companyIds);

  const jobs = jobsRaw
    .filter((job) => workerMeetsBundle(job, worker))
    .filter((job) => workerMeetsFlexConditions(worker, job).all)
    .map((job) => {
      const flags = companyFlags.get(job.companyId);
      const hasWorked = flags?.hasWorked ?? false;
      const isPriority = flags?.isPriority ?? false;
      const offer = getEffectivePayForWorker(job, worker);
      const effectiveHourlyRate = offer?.hourlyRate ?? Number(job.hourlyRate);
      const relevanceScore = scoreWorkerForJob({ worker, job });
      const inviteStage = getEffectiveWaveStage(
        job.waveStage as JobWaveStage,
        job.waveStartedAt,
        now,
      );
      return {
        id: job.id,
        title: job.title,
        description: job.description,
        locationCity: job.locationCity,
        locationAddress: job.locationAddress,
        region: job.region,
        warehouseType: job.warehouseType,
        startsAtIso: job.startsAt.toISOString(),
        endsAtIso: job.endsAt.toISOString(),
        durationHours: job.durationHours,
        hourlyRate: job.hourlyRate.toString(),
        effectiveHourlyRate,
        requiredVzv: job.requiredVzv,
        isUrgent: job.isUrgent,
        urgentBonusEur: job.urgentBonusEur ?? null,
        confirmByIso: job.confirmBy ? job.confirmBy.toISOString() : null,
        isBundle: job.isBundle,
        bundleMinHours: job.bundleMinHours ?? null,
        bundleMinDays: job.bundleMinDays ?? null,
        bundleBonusEur: job.bundleBonusEur ?? null,
        bundleHourlyRateEur: job.bundleHourlyRateEur
          ? job.bundleHourlyRateEur.toString()
          : null,
        contractType: job.contractType ?? null,
        noticeWindow: job.noticeWindow ?? NoticeWindow.H24,
        cancellationCompensationPct: job.cancellationCompensationPct ?? 0,
        relevanceScore,
        inviteStage,
        isFavoriteCompany: flags?.isFavorite ?? false,
        isVerifiedCompany: hasWorked,
        isPriorityCompany: isPriority,
        company: { companyName: job.company.companyName },
      } satisfies WorkerCalendarJobClient;
    })
    .filter((job) =>
      canWorkerSeeWave(job.inviteStage, {
        hasWorked: job.isVerifiedCompany,
        isPriority: job.isPriorityCompany,
      }),
    )
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const myShifts: WorkerCalendarMyShiftClient[] = myAppsRaw.map((app) => ({
    applicationId: app.id,
    jobId: app.jobId,
    title: app.job.title,
    startsAtIso: app.job.startsAt.toISOString(),
    endsAtIso: app.job.endsAt.toISOString(),
    locationCity: app.job.locationCity,
    locationAddress: app.job.locationAddress,
    region: app.job.region,
    companyName: app.job.company.companyName,
  }));

  const jobsByDay = new Map<string, WorkerCalendarJobClient[]>();
  for (const job of jobs) {
    const dayKey = job.startsAtIso.slice(0, 10);
    const list = jobsByDay.get(dayKey) ?? [];
    list.push(job);
    jobsByDay.set(dayKey, list);
  }

  const myByDay = new Map<string, WorkerCalendarMyShiftClient[]>();
  for (const shift of myShifts) {
    const dayKey = shift.startsAtIso.slice(0, 10);
    const list = myByDay.get(dayKey) ?? [];
    list.push(shift);
    myByDay.set(dayKey, list);
  }

  const days = buildMonthDays(monthKey).map((dateKey) => {
    const availableJobs = jobsByDay.get(dateKey) ?? [];
    const my = myByDay.get(dateKey) ?? [];
    return {
      dateKey,
      availableCount: availableJobs.length,
      myCount: my.length,
      availableJobs,
      myShifts: my,
    } satisfies WorkerCalendarDayClient;
  });

  const monthLabel = new Intl.DateTimeFormat("sk-SK", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${monthKey}-01T00:00:00Z`));

  return { monthKey, monthLabel, days };
}
