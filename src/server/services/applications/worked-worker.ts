import { prisma } from "@/server/db/client";
import { ApplicationStatus } from "@/types";
import { requireWorkerProfile } from "@/server/services/applications/shared";

export async function confirmWorkedByWorker(
  workerUserId: string,
  applicationId: string,
  note?: string,
) {
  const worker = await requireWorkerProfile(workerUserId);
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!application || application.workerId !== worker.id) {
    throw new Error("Application not found");
  }
  if (application.status !== ApplicationStatus.CONFIRMED) {
    throw new Error("Application is not confirmed");
  }
  if (application.job.endsAt.getTime() > Date.now()) {
    throw new Error("Shift has not ended yet");
  }

  if (application.workerWorkedConfirmedAt) {
    return application;
  }

  return prisma.jobApplication.update({
    where: { id: application.id },
    data: {
      workerWorkedConfirmedAt: new Date(),
      workerWorkedNote: (note ?? "").trim() ? (note ?? "").trim() : null,
    },
  });
}

