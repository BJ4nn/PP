import { prisma } from "@/server/db/client";
import { ApplicationStatus, CanceledBy, JobStatus, NotificationType } from "@/types";
import { createNotificationForUser } from "@/server/services/notifications";
import { formatShiftWindow } from "@/server/utils/shift-window";
import { requireCompany } from "@/server/services/jobs/shared";
import { getEffectivePayForWorker } from "@/server/services/jobs/worker-eligibility";
import { isLateCancellation } from "@/server/services/jobs/capacity";

const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.OPEN]: [JobStatus.FULL, JobStatus.CLOSED, JobStatus.CANCELLED],
  [JobStatus.FULL]: [JobStatus.CLOSED, JobStatus.CANCELLED],
  [JobStatus.CLOSED]: [],
  [JobStatus.CANCELLED]: [],
};

export async function updateJobStatusForCompany({
  jobId,
  companyUserId,
  nextStatus,
}: {
  jobId: string;
  companyUserId: string;
  nextStatus: JobStatus;
}) {
  const company = await requireCompany(companyUserId);
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: company.id },
  });
  if (!job) {
    throw new Error("Job not found");
  }

  if (!JOB_STATUS_TRANSITIONS[job.status].includes(nextStatus)) {
    throw new Error("Invalid status transition");
  }

  if (nextStatus === JobStatus.FULL) {
    const confirmedCount = await prisma.jobApplication.count({
      where: {
        jobId: job.id,
        status: ApplicationStatus.CONFIRMED,
      },
    });
    if (confirmedCount < job.neededWorkers) {
      throw new Error("Not enough confirmed workers to mark as full");
    }
  }

  const affectedApplications =
    nextStatus === JobStatus.CANCELLED
      ? await prisma.jobApplication.findMany({
          where: {
            jobId: job.id,
            status: {
              in: [ApplicationStatus.PENDING, ApplicationStatus.CONFIRMED],
            },
          },
          include: {
            worker: true,
          },
        })
      : [];

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { status: nextStatus },
  });

  if (nextStatus === JobStatus.CANCELLED) {
    const now = new Date();
    const late = isLateCancellation(job, now);

    const computed = affectedApplications.map((app) => {
      const isConfirmed = app.status === ApplicationStatus.CONFIRMED;
      const isLateConfirmed = isConfirmed && late;

      let compensationAmount = 0;
      if (isLateConfirmed && job.cancellationCompensationPct > 0) {
        const offer = getEffectivePayForWorker(job, app.worker);
        const hourly = offer?.hourlyRate ?? Number(job.hourlyRate);
        const hours =
          job.durationHours ??
          (job.endsAt.getTime() - job.startsAt.getTime()) / 36e5;
        compensationAmount =
          Math.round(hourly * hours * (job.cancellationCompensationPct / 100) * 100) /
          100;
      }

      return {
        app,
        isLateConfirmed,
        compensationAmount,
      };
    });

    await prisma.$transaction(
      computed.map(({ app, isLateConfirmed, compensationAmount }) =>
        prisma.jobApplication.update({
        where: { id: app.id },
        data: {
          status: isLateConfirmed
            ? ApplicationStatus.COMPANY_CANCELED_LATE
            : ApplicationStatus.CANCELLED_BY_COMPANY,
          compensationAmount,
          canceledAt: now,
          canceledBy: CanceledBy.COMPANY,
        },
      }),
      ),
    );

    if (computed.length > 0) {
      const shiftWindow = formatShiftWindow(job.startsAt, job.endsAt);
      await Promise.all(
        computed.map(({ app, isLateConfirmed, compensationAmount }) =>
          createNotificationForUser(
            app.worker.userId,
            isLateConfirmed
              ? NotificationType.WORKER_APPLICATION_CANCELED_LATE_BY_COMPANY
              : NotificationType.WORKER_JOB_CANCELED,
            {
              jobId: job.id,
              jobTitle: job.title,
              applicationId: app.id,
              companyName: company.companyName,
              shiftWindow,
              compensationAmount: isLateConfirmed ? compensationAmount : undefined,
            },
          ),
        ),
      );
    }
  }

  return updated;
}
