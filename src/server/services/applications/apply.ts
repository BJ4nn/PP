import { prisma } from "@/server/db/client";
import { ApplicationStatus, JobStatus, NotificationType } from "@/types";
import type { CreateApplicationInput } from "@/lib/validators/applications";
import { incrementWorkerActivityByUserId } from "@/server/services/worker";
import { scoreWorkerForJob } from "@/server/services/jobs";
import { createNotificationForUser } from "@/server/services/notifications";
import { formatShiftWindow } from "@/server/utils/shift-window";
import { computeEstimatedEarnings } from "@/server/services/applications/earnings";
import { requireWorkerProfile, sendEmailToUser } from "@/server/services/applications/shared";
import { workerMeetsFlexConditions } from "@/server/services/jobs/worker-eligibility";

export async function applyToJob(
  workerUserId: string,
  jobId: string,
  input: CreateApplicationInput,
) {
  const worker = await requireWorkerProfile(workerUserId);
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      status: JobStatus.OPEN,
      company: { isApproved: true, onboardingComplete: true },
    },
    include: { company: true },
  });

  if (!job) {
    throw new Error("Job not found or closed");
  }

  if (job.confirmBy && job.confirmBy.getTime() < Date.now()) {
    throw new Error("Deadline to confirm has passed");
  }

  const existing = await prisma.jobApplication.findUnique({
    where: {
      jobId_workerId: {
        jobId: job.id,
        workerId: worker.id,
      },
    },
  });

  if (existing) {
    throw new Error("You already applied to this job");
  }

  if (job.requiredVzv && !worker.hasVZV) {
    throw new Error("Job requires VZV certification");
  }

  const flex = workerMeetsFlexConditions(worker, job);
  if (!flex.all) {
    if (!flex.contractMatch) throw new Error("Job kontrakt nezodpovedá vašim preferenciám");
    if (!flex.noticeMatch) throw new Error("Notice politika nezodpovedá vašim preferenciám");
    if (!flex.minRateMatch) throw new Error("Hodinová sadzba je pod vaším minimom");
    throw new Error("Ponuka nezodpovedá vašim preferenciám");
  }

  const matchScore = scoreWorkerForJob({ worker, job });
  const earnings = computeEstimatedEarnings(
    job,
    flex.offer ? { hourlyRate: flex.offer.hourlyRate } : undefined,
  );

  const application = await prisma.jobApplication.create({
    data: {
      jobId: job.id,
      workerId: worker.id,
      note: input.note ?? null,
      matchScore,
      estimatedEarningsEur: earnings.totalEur,
      status: ApplicationStatus.PENDING,
    },
  });

  await incrementWorkerActivityByUserId(workerUserId, "APPLY");

  const shiftWindow = formatShiftWindow(job.startsAt, job.endsAt);
  await createNotificationForUser(
    job.company.userId,
    NotificationType.COMPANY_NEW_APPLICATION,
    {
      jobId: job.id,
      jobDateKey: job.startsAt.toISOString().slice(0, 10),
      jobMonthKey: job.startsAt.toISOString().slice(0, 7),
      jobTitle: job.title,
      applicationId: application.id,
      workerName: worker.name,
      shiftWindow,
    },
  );
  await sendEmailToUser(
    job.company.userId,
    `New application for ${job.title}`,
    `${worker.name} applied to your shift happening ${shiftWindow}.`,
  );

  return application;
}
