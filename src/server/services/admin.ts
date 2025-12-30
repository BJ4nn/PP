import { prisma } from "@/server/db/client";
import { ApplicationStatus, JobStatus } from "@/types";

export async function getAdminDashboardData() {
  const [
    workerCount,
    companyCount,
    openJobCount,
    applicationCount,
    lateCancellationCount,
    compensationAggregate,
    latestWorkers,
    latestCompanies,
    recentJobs,
    recentApplications,
    pendingCompanies,
    readyWorkers,
    confirmedMatches,
  ] = await Promise.all([
    prisma.workerProfile.count(),
    prisma.companyProfile.count(),
    prisma.job.count({ where: { status: JobStatus.OPEN } }),
    prisma.jobApplication.count(),
    prisma.jobApplication.count({
      where: {
        status: {
          in: [
            ApplicationStatus.COMPANY_CANCELED_LATE,
            ApplicationStatus.WORKER_CANCELED_LATE,
          ],
        },
      },
    }),
    prisma.jobApplication.aggregate({
      _sum: { compensationAmount: true },
      where: { status: ApplicationStatus.COMPANY_CANCELED_LATE },
    }),
    prisma.workerProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        city: true,
        region: true,
        createdAt: true,
        onboardingComplete: true,
      },
    }),
    prisma.companyProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        companyName: true,
        region: true,
        addressCity: true,
        createdAt: true,
        onboardingComplete: true,
        isApproved: true,
      },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        company: true,
      },
    }),
    prisma.jobApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        worker: true,
        job: {
          include: {
            company: true,
          },
        },
      },
    }),
    prisma.companyProfile.findMany({
      where: { onboardingComplete: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        companyName: true,
        region: true,
        addressCity: true,
        createdAt: true,
        isApproved: true,
      },
    }),
    prisma.workerProfile.findMany({
      where: { onboardingComplete: true, isReady: true },
      orderBy: [{ lastReadyAt: "desc" }, { updatedAt: "desc" }],
      take: 30,
      select: {
        id: true,
        name: true,
        city: true,
        region: true,
        isReady: true,
        lastReadyAt: true,
        activityScore: true,
        reliabilityScore: true,
      },
    }),
    prisma.jobApplication.findMany({
      where: {
        status: ApplicationStatus.CONFIRMED,
        worker: { onboardingComplete: true, isReady: true },
        job: {
          endsAt: { gt: new Date() },
          status: { in: [JobStatus.OPEN, JobStatus.FULL] },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        createdAt: true,
        worker: { select: { id: true, name: true, city: true, region: true } },
        job: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            endsAt: true,
            company: { select: { id: true, companyName: true } },
          },
        },
      },
    }),
  ]);

  return {
    counts: {
      workers: workerCount,
      companies: companyCount,
      openJobs: openJobCount,
      applications: applicationCount,
      lateCancellations: lateCancellationCount,
      compensationTotalEur: compensationAggregate._sum.compensationAmount ?? 0,
    },
    latestWorkers,
    latestCompanies,
    recentJobs,
    recentApplications,
    pendingCompanies,
    monitor: {
      readyWorkers,
      companies: pendingCompanies,
      confirmedMatches,
    },
  };
}
