import { prisma } from "@/server/db/client";
import {
  ApplicationStatus,
  JobStatus,
  NoticeWindow,
} from "@/types";
import { requireCompany } from "@/server/services/jobs/shared";

const NOTICE_HOURS: Record<NoticeWindow, number> = {
  [NoticeWindow.H12]: 12,
  [NoticeWindow.H24]: 24,
  [NoticeWindow.H48]: 48,
};

function getHoursUntil(date: Date, now: Date) {
  return (date.getTime() - now.getTime()) / 36e5;
}

export async function updateJobSlots(
  companyUserId: string,
  jobId: string,
  neededWorkers: number,
) {
  const company = await requireCompany(companyUserId);
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: company.id },
  });
  if (!job) throw new Error("Job not found");
  if (job.status === JobStatus.CANCELLED || job.status === JobStatus.CLOSED) {
    throw new Error("Zmena nie je aktívna");
  }

  const confirmedCount = await prisma.jobApplication.count({
    where: { jobId: job.id, status: ApplicationStatus.CONFIRMED },
  });
  if (neededWorkers < confirmedCount) {
    throw new Error("Slots cannot be lower than confirmed workers");
  }

  const nextStatus =
    neededWorkers === confirmedCount ? JobStatus.FULL : JobStatus.OPEN;

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: {
      neededWorkers,
      status: nextStatus,
    },
  });

  return {
    job: updated,
    confirmedCount,
    pingedCount: 0,
  };
}

export async function updateJobPolicy(
  companyUserId: string,
  jobId: string,
  input: { noticeWindow: NoticeWindow; cancellationCompensationPct: number },
) {
  const company = await requireCompany(companyUserId);
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: company.id },
  });
  if (!job) throw new Error("Job not found");

  const pct = Math.max(0, Math.min(100, input.cancellationCompensationPct));
  return prisma.job.update({
    where: { id: job.id },
    data: {
      noticeWindow: input.noticeWindow,
      cancellationCompensationPct: pct,
    },
  });
}

export function isLateCancellation(job: { startsAt: Date; noticeWindow: NoticeWindow }, now: Date) {
  const hoursUntil = getHoursUntil(job.startsAt, now);
  return hoursUntil < NOTICE_HOURS[job.noticeWindow];
}
