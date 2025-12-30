import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { ContractType, JobStatus, JobWaveStage, NoticeWindow } from "@/types";
import {
  allowedExperienceLevels,
  hasRequiredExperience,
  requireWorker,
} from "@/server/services/jobs/shared";
import { scoreWorkerForJob } from "@/server/services/jobs/scoring";
import {
  workerMeetsBundle,
  workerMeetsFlexConditions,
  getEffectivePayForWorker,
} from "@/server/services/jobs/worker-eligibility";
import { canWorkerSeeWave, getEffectiveWaveStage } from "@/server/services/jobs/waves";
import { getWorkerCompanyFlags } from "@/server/services/jobs/worker-company-flags";
import { getCityFilterVariants } from "@/lib/locations";

export type WorkerJobFeedFilters = {
  contractType?: ContractType;
  noticeWindow?: NoticeWindow;
  isUrgent?: boolean;
  isBundle?: boolean;
  hasBonus?: boolean;
  city?: string;
  favoritesOnly?: boolean;
  companyId?: string;
};

type JobWithCompany = Prisma.JobGetPayload<{ include: { company: true } }>;

export type WorkerJobRow = JobWithCompany & {
  effectiveHourlyRate: number;
  relevanceScore: number;
  inviteStage: JobWaveStage;
  isFavoriteCompany: boolean;
  isVerifiedCompany: boolean;
  isPriorityCompany: boolean;
};

const NOTICE_ORDER: NoticeWindow[] = [
  NoticeWindow.H12,
  NoticeWindow.H24,
  NoticeWindow.H48,
];

function noticeAtLeast(value: NoticeWindow) {
  const idx = NOTICE_ORDER.indexOf(value);
  return idx === -1 ? NOTICE_ORDER : NOTICE_ORDER.slice(idx);
}

function buildCityFilter(city?: string): Prisma.JobWhereInput {
  if (!city) return {};
  const variants = getCityFilterVariants(city);
  if (variants.length === 1) {
    return {
      locationCity: { equals: variants[0], mode: Prisma.QueryMode.insensitive },
    };
  }
  return {
    OR: variants.map((value) => ({
      locationCity: { equals: value, mode: Prisma.QueryMode.insensitive },
    })),
  };
}

export async function listOpenJobsForWorker(
  workerUserId: string,
  filters?: WorkerJobFeedFilters,
): Promise<WorkerJobRow[]> {
  const worker = await requireWorker(workerUserId);
  const experienceFilter = allowedExperienceLevels(worker.experienceLevel);
  const now = new Date();
  const locationFilter = buildCityFilter(filters?.city);
  const jobs = (await prisma.job.findMany({
    where: {
      status: JobStatus.OPEN,
      company: { isApproved: true, onboardingComplete: true },
      ...locationFilter,
      ...(filters?.companyId ? { companyId: filters.companyId } : {}),
      startsAt: { gte: new Date() },
      ...(worker.hasVZV ? {} : { requiredVzv: false }),
      ...(filters?.isUrgent !== undefined ? { isUrgent: filters.isUrgent } : {}),
      ...(filters?.isBundle !== undefined ? { isBundle: filters.isBundle } : {}),
      ...(filters?.hasBonus
        ? {
            OR: [
              { urgentBonusEur: { gt: 0 } },
              { bundleBonusEur: { gt: 0 } },
            ],
          }
        : {}),
      ...(filters?.contractType
        ? { OR: [{ contractType: filters.contractType }, { contractType: null }] }
        : {}),
      ...(filters?.noticeWindow
        ? { noticeWindow: { in: noticeAtLeast(filters.noticeWindow) } }
        : {}),
      AND: [
        { OR: [{ confirmBy: null }, { confirmBy: { gt: now } }] },
        {
          OR: [
            { minExperience: null },
            { minExperience: { in: experienceFilter } },
          ],
        },
      ],
    },
    include: {
      company: true,
    },
  })) as JobWithCompany[];

  const companyIds = Array.from(new Set(jobs.map((job) => job.companyId)));
  const companyFlags = await getWorkerCompanyFlags(worker.id, companyIds);

  return jobs
    .filter((job) => workerMeetsBundle(job, worker))
    .filter((job) => workerMeetsFlexConditions(worker, job).all)
    .map((job) => {
      const flags = companyFlags.get(job.companyId);
      const hasWorked = flags?.hasWorked ?? false;
      const isPriority = flags?.isPriority ?? false;
      const inviteStage = getEffectiveWaveStage(
        job.waveStage as JobWaveStage,
        job.waveStartedAt,
        now,
      );
      return {
        ...job,
        effectiveHourlyRate:
          getEffectivePayForWorker(job, worker)?.hourlyRate ?? Number(job.hourlyRate),
        relevanceScore: scoreWorkerForJob({ worker, job }),
        inviteStage,
        isFavoriteCompany: flags?.isFavorite ?? false,
        isVerifiedCompany: hasWorked,
        isPriorityCompany: isPriority,
      };
    })
    .filter((job) =>
      canWorkerSeeWave(job.inviteStage, {
        hasWorked: job.isVerifiedCompany,
        isPriority: job.isPriorityCompany,
      }),
    )
    .filter((job) => (filters?.favoritesOnly ? job.isFavoriteCompany : true))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export async function getOpenJobForWorker(workerUserId: string, jobId: string) {
  const worker = await requireWorker(workerUserId);
  const application = await prisma.jobApplication.findUnique({
    where: { jobId_workerId: { jobId, workerId: worker.id } },
    include: {
      contractDocument: { select: { id: true, workerSignedAt: true, companySignedAt: true } },
      invoiceLine: { select: { invoiceId: true } },
    },
  });
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      ...(application ? {} : { status: JobStatus.OPEN }),
      company: { isApproved: true, onboardingComplete: true },
    },
    include: { company: true },
  });
  if (!job) {
    throw new Error("Job not found");
  }
  const flagsByCompany = await getWorkerCompanyFlags(worker.id, [job.companyId]);
  const flags = flagsByCompany.get(job.companyId);
  const inviteStage = getEffectiveWaveStage(
    job.waveStage as JobWaveStage,
    job.waveStartedAt,
  );
  if (!application) {
    if (
      !canWorkerSeeWave(inviteStage, {
        hasWorked: flags?.hasWorked ?? false,
        isPriority: flags?.isPriority ?? false,
      })
    ) {
      throw new Error("Zmena zatiaľ nie je dostupná.");
    }
    if (job.confirmBy && job.confirmBy.getTime() < Date.now()) {
      throw new Error("Deadline to confirm has passed");
    }
    if (job.requiredVzv && !worker.hasVZV) {
      throw new Error("Job requires VZV certification");
    }
    if (!hasRequiredExperience(worker.experienceLevel, job.minExperience)) {
      throw new Error("Job requires higher experience level");
    }
    if (!workerMeetsBundle(job, worker)) {
      throw new Error("Job requires higher availability");
    }
    const flex = workerMeetsFlexConditions(worker, job);
    if (!flex.all) {
      if (!flex.contractMatch) throw new Error("Job contract does not match your preferences");
      if (!flex.noticeMatch) throw new Error("Job notice policy does not match your preference");
      if (!flex.minRateMatch) throw new Error("Hourly rate below your minimum");
      throw new Error("Job does not match your preferences");
    }
  }

  return {
    ...job,
    effectiveHourlyRate:
      getEffectivePayForWorker(job, worker)?.hourlyRate ?? Number(job.hourlyRate),
    myApplication: application,
    inviteStage,
    isFavoriteCompany: flags?.isFavorite ?? false,
    isVerifiedCompany: flags?.hasWorked ?? false,
    isPriorityCompany: flags?.isPriority ?? false,
  };
}
