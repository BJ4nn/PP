import type { Prisma } from "@prisma/client";
import { ContractType } from "@/types";
import type { WorkerForScoring } from "@/server/services/jobs/shared";

export function workerMeetsBundle(
  job: Prisma.JobGetPayload<object>,
  worker: WorkerForScoring,
) {
  if (!job.isBundle) return true;
  const availability = (worker.availabilityJson ?? {
    daysOfWeek: [],
    shiftTypes: [],
  }) as { daysOfWeek?: unknown; shiftTypes?: unknown };
  const days =
    Array.isArray(availability.daysOfWeek) && availability.daysOfWeek.length > 0
      ? availability.daysOfWeek.length
      : 0;
  const estimatedHours = days * (job.durationHours ?? 8);

  if (job.bundleMinDays && days < job.bundleMinDays) return false;
  if (job.bundleMinHours && estimatedHours < job.bundleMinHours) return false;
  return true;
}

export function workerMeetsNoticeWindow() {
  return true;
}

type ContractOffer = {
  contractType: ContractType;
  hourlyRate: number;
};

function getAllowedContractTypes(
  worker: WorkerForScoring,
  job: Prisma.JobGetPayload<object>,
) {
  const byJob = job.contractType ? [job.contractType] : [ContractType.EMPLOYMENT, ContractType.TRADE_LICENSE];
  const byPref = worker.preferredContractType ? [worker.preferredContractType] : byJob;
  const intersection = byJob.filter((value) => byPref.includes(value));
  return intersection.filter((value) => value !== ContractType.TRADE_LICENSE || worker.hasTradeLicense);
}

function getBaseHourlyRate(job: Prisma.JobGetPayload<object>, contractType: ContractType) {
  if (job.isBundle && job.bundleHourlyRateEur) {
    return Number(job.bundleHourlyRateEur);
  }
  if (contractType === ContractType.EMPLOYMENT) {
    return job.payEmployment ?? Number(job.hourlyRate);
  }
  return job.payTradeLicense ?? Number(job.hourlyRate);
}

function getWorkerMinHourlyRate(worker: WorkerForScoring, contractType: ContractType) {
  if (contractType === ContractType.EMPLOYMENT) {
    return worker.minHourlyRateEmployment ?? worker.minHourlyRate ?? null;
  }
  return worker.minHourlyRate ?? null;
}

function getContractOffers(
  worker: WorkerForScoring,
  job: Prisma.JobGetPayload<object>,
  options?: { enforceMinRate?: boolean },
): ContractOffer[] {
  const enforceMinRate = options?.enforceMinRate !== false;
  const types = getAllowedContractTypes(worker, job);

  return types
    .map((contractType) => {
      const base = getBaseHourlyRate(job, contractType);
      const hourlyRate = base;

      if (enforceMinRate) {
        const minRate = getWorkerMinHourlyRate(worker, contractType);
        if (minRate !== null && hourlyRate < minRate) return null;
      }

      return { contractType, hourlyRate };
    })
    .filter((offer): offer is ContractOffer => Boolean(offer));
}

export function getEffectivePayForWorker(
  job: Prisma.JobGetPayload<object>,
  worker: WorkerForScoring,
): ContractOffer | null {
  const offers = getContractOffers(worker, job, { enforceMinRate: true });
  if (offers.length === 0) return null;

  return offers.sort((a, b) => b.hourlyRate - a.hourlyRate)[0] ?? null;
}

export function isJobCompatibleWithWorker(
  job: Prisma.JobGetPayload<object>,
  worker: WorkerForScoring,
) {
  if (!workerMeetsNoticeWindow()) return false;
  return getEffectivePayForWorker(job, worker) !== null;
}

export function workerMeetsFlexConditions(worker: WorkerForScoring, job: Prisma.JobGetPayload<object>) {
  const noticeMatch = workerMeetsNoticeWindow();
  const contractMatch = getContractOffers(worker, job, { enforceMinRate: false }).length > 0;
  const offer = getEffectivePayForWorker(job, worker);
  const minRateMatch = offer !== null;

  return {
    contractMatch,
    noticeMatch,
    minRateMatch,
    offer,
    all: contractMatch && noticeMatch && minRateMatch,
  };
}
