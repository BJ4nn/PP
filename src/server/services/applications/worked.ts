import { prisma } from "@/server/db/client";
import { ApplicationStatus } from "@/types";
import { requireCompanyProfile } from "@/server/services/applications/shared";

export type ConfirmWorkedShiftsInput = {
  applicationIds: string[];
  ratingStars?: number | null;
};

export type WorkedConfirmationCandidate = {
  applicationId: string;
  worker: { id: string; name: string };
  job: { id: string; title: string; endsAt: Date };
};

export async function listWorkedConfirmationCandidatesForCompanyJob(
  companyUserId: string,
  jobId: string,
) {
  const company = await requireCompanyProfile(companyUserId);
  const now = new Date();

  const rows = await prisma.jobApplication.findMany({
    where: {
      jobId,
      status: ApplicationStatus.CONFIRMED,
      workedConfirmedAt: null,
      job: { companyId: company.id, endsAt: { lt: now } },
    },
    select: {
      id: true,
      worker: { select: { id: true, name: true } },
      job: { select: { id: true, title: true, endsAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  return rows.map((row) => ({
    applicationId: row.id,
    worker: row.worker,
    job: row.job,
  })) satisfies WorkedConfirmationCandidate[];
}

export async function confirmWorkedShiftsForCompany(
  companyUserId: string,
  input: ConfirmWorkedShiftsInput,
) {
  const company = await requireCompanyProfile(companyUserId);
  const now = new Date();

  const eligible = await prisma.jobApplication.findMany({
    where: {
      id: { in: input.applicationIds },
      status: ApplicationStatus.CONFIRMED,
      workedConfirmedAt: null,
      job: {
        companyId: company.id,
        endsAt: { lt: now },
      },
    },
    select: { id: true },
    take: 1000,
  });

  const ids = eligible.map((row) => row.id);
  if (ids.length === 0) {
    return { updatedCount: 0, updatedIds: [] as string[] };
  }

  const data = {
    workedConfirmedAt: now,
    ...(input.ratingStars !== undefined
      ? { workerRatingStars: input.ratingStars }
      : {}),
  };

  const result = await prisma.jobApplication.updateMany({
    where: { id: { in: ids } },
    data,
  });

  return { updatedCount: result.count, updatedIds: ids };
}
