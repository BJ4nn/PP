import { ContractType, ExperienceLevel } from "@/types";
import type { JobForScoring, WorkerForScoring } from "@/server/services/jobs/shared";
import { EXPERIENCE_ORDER } from "@/server/services/jobs/shared";
import { getEffectivePayForWorker, workerMeetsBundle, workerMeetsFlexConditions } from "@/server/services/jobs/worker-eligibility";

function getWorkerMinRate(worker: WorkerForScoring, contractType: ContractType) {
  if (contractType === ContractType.EMPLOYMENT) {
    return worker.minHourlyRateEmployment ?? worker.minHourlyRate ?? null;
  }
  return worker.minHourlyRate ?? null;
}

export function scoreWorkerForJob({
  worker,
  job,
}: {
  worker: WorkerForScoring;
  job: JobForScoring;
}) {
  let score = 0;

  if (job.region === worker.region) {
    score += 25;
  }

  if (!job.requiredVzv) {
    score += 5;
  } else if (worker.hasVZV) {
    score += 10;
  } else {
    score -= 10;
  }

  if (job.minExperience) {
    const workerIdx = EXPERIENCE_ORDER.indexOf(worker.experienceLevel);
    const jobIdx = EXPERIENCE_ORDER.indexOf(job.minExperience);
    score += workerIdx >= jobIdx ? 20 : -10;
  } else {
    score += 5;
  }

  if (worker.activityScore) {
    score += Math.min(worker.activityScore, 15);
  }

  if (worker.reliabilityScore) {
    score += Math.min(worker.reliabilityScore, 15);
  }

  const offer = getEffectivePayForWorker(job, worker);
  const effectiveRate = offer?.hourlyRate ?? Number(job.hourlyRate);
  const minRate = offer ? getWorkerMinRate(worker, offer.contractType) : worker.minHourlyRate ?? null;
  if (minRate !== null) {
    score += Math.max(0, Math.min(10, effectiveRate - minRate));
  } else {
    score += 5;
  }

  if (job.isUrgent) {
    score *= 1.1;
    if (worker.reliabilityScore) {
      score += Math.min(worker.reliabilityScore, 5);
    }
  }

  if (job.isBundle) {
    if (worker.reliabilityScore) {
      score += Math.min(worker.reliabilityScore, 10);
    }
    if (!workerMeetsBundle(job, worker)) {
      score -= 25;
    }
  }

  const flex = workerMeetsFlexConditions(worker, job);
  if (
    flex.offer &&
    worker.preferredContractType &&
    flex.offer.contractType === worker.preferredContractType
  ) {
    score += 10;
  }
  if (flex.noticeMatch) score += 5;

  return Math.max(0, Math.min(100, score));
}

export const EXPERIENCE_LABEL_ORDER: ExperienceLevel[] = EXPERIENCE_ORDER;
