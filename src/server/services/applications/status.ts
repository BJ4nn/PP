import { prisma } from "@/server/db/client";
import { ApplicationStatus, CanceledBy, JobStatus, NotificationType } from "@/types";
import type { UpdateApplicationStatusInput } from "@/lib/validators/applications";
import {
  incrementWorkerActivityByWorkerId,
  updateWorkerReliability,
} from "@/server/services/worker";
import { createNotificationForUser } from "@/server/services/notifications";
import { formatShiftWindow } from "@/server/utils/shift-window";
import {
  requireCompanyProfile,
  requireWorkerProfile,
  sendEmailToUser,
} from "@/server/services/applications/shared";
import { getEffectivePayForWorker } from "@/server/services/jobs";
import { isLateCancellation } from "@/server/services/jobs/capacity";
import { getOrCreateContractForApplication } from "@/server/services/contracts";

async function ensureNoOverlappingConfirmedShifts(
  workerId: string,
  startsAt: Date,
  endsAt: Date,
  excludeApplicationId?: string,
) {
  const overlap = await prisma.jobApplication.findFirst({
    where: {
      workerId,
      status: ApplicationStatus.CONFIRMED,
      ...(excludeApplicationId ? { id: { not: excludeApplicationId } } : {}),
      job: {
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    },
    include: { job: true },
  });
  if (overlap) {
    throw new Error("Worker already confirmed for overlapping shift");
  }
}

export async function updateApplicationStatus(
  companyUserId: string,
  applicationId: string,
  input: UpdateApplicationStatusInput,
) {
  const company = await requireCompanyProfile(companyUserId);
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          company: true,
        },
      },
      worker: true,
    },
  });

  if (!application || application.job.companyId !== company.id) {
    throw new Error("Application not found");
  }

  if (
    input.status === ApplicationStatus.CANCELLED_BY_WORKER ||
    input.status === ApplicationStatus.PENDING
  ) {
    throw new Error("Invalid status update");
  }

  if (
    application.job.status === JobStatus.CLOSED ||
    application.job.status === JobStatus.CANCELLED
  ) {
    throw new Error("Job is no longer active");
  }

  if (
    application.status === ApplicationStatus.CONFIRMED &&
    input.status === ApplicationStatus.REJECTED
  ) {
    throw new Error("Use cancel for confirmed applications");
  }

  if (input.status === ApplicationStatus.CONFIRMED) {
    await ensureNoOverlappingConfirmedShifts(
      application.workerId,
      application.job.startsAt,
      application.job.endsAt,
      application.id,
    );
  }

  const updated = await prisma.jobApplication.update({
    where: { id: application.id },
    data: {
      status: input.status,
    },
  });

  if (input.status === ApplicationStatus.CONFIRMED) {
    await incrementWorkerActivityByWorkerId(application.workerId, "CONFIRM");
    await updateWorkerReliability(application.workerId, "CONFIRMED_SHIFT");
  }

  if (input.status === ApplicationStatus.REJECTED) {
    await incrementWorkerActivityByWorkerId(application.workerId, "CANCEL");
  }

  const shiftWindow = formatShiftWindow(
    application.job.startsAt,
    application.job.endsAt,
  );
  if (input.status === ApplicationStatus.CONFIRMED) {
    let contractId: string | null = null;
    try {
      const doc = await getOrCreateContractForApplication(application.id);
      contractId = doc.id;
    } catch {
      // Do not block confirmation if beta contract generation fails.
    }

    await createNotificationForUser(
      application.worker.userId,
      NotificationType.WORKER_APPLICATION_CONFIRMED,
      {
        jobId: application.jobId,
        jobTitle: application.job.title,
        applicationId: application.id,
        contractId,
        companyName: company.companyName,
        shiftWindow,
      },
    );
    await sendEmailToUser(
      application.worker.userId,
      "Your shift was confirmed",
      `You are confirmed for ${application.job.title} on ${shiftWindow}.`,
    );

    return { ...updated, contractId };
  }
  if (input.status === ApplicationStatus.REJECTED) {
    await createNotificationForUser(
      application.worker.userId,
      NotificationType.WORKER_APPLICATION_REJECTED,
      {
        jobId: application.jobId,
        jobTitle: application.job.title,
        applicationId: application.id,
        companyName: company.companyName,
        shiftWindow,
      },
    );
  }

  return updated;
}

export async function cancelApplicationByWorker(
  workerUserId: string,
  applicationId: string,
) {
  const worker = await requireWorkerProfile(workerUserId);
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!application || application.workerId !== worker.id) {
    throw new Error("Application not found");
  }

  if (
    application.status !== ApplicationStatus.PENDING &&
    application.status !== ApplicationStatus.CONFIRMED
  ) {
    throw new Error("Cannot cancel this application");
  }

  const now = new Date();
  if (application.job.startsAt <= now) {
    throw new Error("Shift already started");
  }

  const isLate = application.status === ApplicationStatus.CONFIRMED
    ? isLateCancellation(application.job, now)
    : false;
  const nextStatus = isLate
    ? ApplicationStatus.WORKER_CANCELED_LATE
    : ApplicationStatus.CANCELLED_BY_WORKER;

  await prisma.jobApplication.update({
    where: { id: application.id },
    data: {
      status: nextStatus,
      canceledAt: now,
      canceledBy: CanceledBy.WORKER,
    },
  });

  await incrementWorkerActivityByWorkerId(worker.id, "CANCEL");

  if (isLate) {
    await updateWorkerReliability(worker.id, "CANCELLED_LATE");
  }

  await createNotificationForUser(
    application.job.company.userId,
    isLate
      ? NotificationType.COMPANY_APPLICATION_CANCELED_LATE_BY_WORKER
      : NotificationType.COMPANY_APPLICATION_CANCELED_BY_WORKER,
    {
      jobId: application.jobId,
      jobDateKey: application.job.startsAt.toISOString().slice(0, 10),
      jobMonthKey: application.job.startsAt.toISOString().slice(0, 7),
      jobTitle: application.job.title,
      applicationId: application.id,
      workerName: worker.name,
      shiftWindow: formatShiftWindow(
        application.job.startsAt,
        application.job.endsAt,
      ),
    },
  );
}

export async function cancelApplicationByCompany(
  companyUserId: string,
  applicationId: string,
) {
  const company = await requireCompanyProfile(companyUserId);
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      job: { include: { company: true } },
      worker: true,
    },
  });

  if (!application || application.job.companyId !== company.id) {
    throw new Error("Application not found");
  }

  if (
    application.status !== ApplicationStatus.PENDING &&
    application.status !== ApplicationStatus.CONFIRMED
  ) {
    throw new Error("Cannot cancel this application");
  }

  const now = new Date();
  if (application.job.startsAt <= now) {
    throw new Error("Shift already started");
  }
  const isLate =
    application.status === ApplicationStatus.CONFIRMED
      ? isLateCancellation(application.job, now)
      : false;

  let compensationAmount = 0;
  if (isLate && application.job.cancellationCompensationPct > 0) {
    const offer = getEffectivePayForWorker(application.job, application.worker);
    const hourly = offer?.hourlyRate ?? Number(application.job.hourlyRate);
    const hours =
      application.job.durationHours ??
      (application.job.endsAt.getTime() - application.job.startsAt.getTime()) / 36e5;
    compensationAmount =
      Math.round(
        hourly *
          hours *
          (application.job.cancellationCompensationPct / 100) *
          100,
      ) / 100;
  }

  await prisma.jobApplication.update({
    where: { id: application.id },
    data: {
      status: isLate
        ? ApplicationStatus.COMPANY_CANCELED_LATE
        : ApplicationStatus.CANCELLED_BY_COMPANY,
      compensationAmount,
      canceledAt: now,
      canceledBy: CanceledBy.COMPANY,
    },
  });

  await createNotificationForUser(
    application.worker.userId,
    isLate
      ? NotificationType.WORKER_APPLICATION_CANCELED_LATE_BY_COMPANY
      : NotificationType.WORKER_APPLICATION_CANCELED_BY_COMPANY,
    {
      jobId: application.jobId,
      jobTitle: application.job.title,
      applicationId: application.id,
      companyName: company.companyName,
      compensationAmount,
      shiftWindow: formatShiftWindow(
        application.job.startsAt,
        application.job.endsAt,
      ),
    },
  );
}
