import { prisma } from "@/server/db/client";
import { requireCompanyProfile, requireWorkerProfile } from "@/server/services/applications/shared";

export async function listWorkerApplications(workerUserId: string) {
  const worker = await requireWorkerProfile(workerUserId);
  const applications = await prisma.jobApplication.findMany({
    where: { workerId: worker.id },
    include: {
      contractDocument: {
        select: { id: true, workerSignedAt: true },
      },
      job: {
        include: {
          company: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const nowMs = Date.now();
  return applications.map((app) => ({
    ...app,
    shiftEnded: app.job.endsAt.getTime() < nowMs,
  }));
}

export async function listJobApplicationsForCompany(
  companyUserId: string,
  jobId: string,
) {
  const company = await requireCompanyProfile(companyUserId);
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: company.id },
    include: {
      applications: {
        include: {
          worker: true,
        },
        orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!job) {
    throw new Error("Job not found");
  }
  return job.applications;
}
