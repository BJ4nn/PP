import type { Prisma } from "@prisma/client";

export function computeEstimatedEarnings(
  job: Prisma.JobGetPayload<{ include: { company: true } }>,
  options?: { hourlyRate?: number },
) {
  const baseHours = job.durationHours ?? 0;
  let effectiveRate =
    options?.hourlyRate !== undefined ? options.hourlyRate : Number(job.hourlyRate);
  let bonus = 0;
  let hoursTarget = baseHours;

  if (job.isUrgent && job.urgentBonusEur) {
    bonus += job.urgentBonusEur;
  }

  if (job.isBundle) {
    if (job.bundleHourlyRateEur) {
      effectiveRate = Number(job.bundleHourlyRateEur);
    }
    if (job.bundleBonusEur) {
      bonus += job.bundleBonusEur;
    }
    const minHoursFromDays =
      job.bundleMinDays && baseHours ? job.bundleMinDays * baseHours : undefined;
    const threshold = [job.bundleMinHours, minHoursFromDays].filter(
      (v) => v !== undefined,
    ) as number[];
    hoursTarget =
      threshold.length > 0 ? Math.max(...threshold, baseHours) : baseHours;
  }

  const baseEur = Math.round(effectiveRate * hoursTarget);
  const totalEur = Math.round(baseEur + bonus);
  return { baseEur, bonusEur: bonus, totalEur };
}
