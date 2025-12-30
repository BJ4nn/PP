import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { CreateJobInput, UpdateJobInput } from "@/lib/validators/jobs";
import { calculateEndsAt, requireCompany } from "@/server/services/jobs/shared";
import {
  ApplicationStatus,
  ContractStatus,
  ContractType,
  JobStatus,
  JobWaveStage,
} from "@/types";

export async function createJob(companyUserId: string, input: CreateJobInput) {
  const company = await requireCompany(companyUserId);
  const startsAt = input.startsAt;
  const endsAt = calculateEndsAt(startsAt, input.durationHours);

  return prisma.job.create({
    data: {
      companyId: company.id,
      title: input.title,
      description: input.description,
      locationCity: input.locationCity,
      locationAddress: input.locationAddress,
      region: input.region,
      warehouseType: input.warehouseType,
      positionTypes: input.positionTypes ?? [],
      startsAt,
      endsAt,
      durationHours: input.durationHours,
      hourlyRate: new Prisma.Decimal(input.hourlyRate),
      requiredVzv: input.requiredVzv,
      minExperience: input.minExperience ?? null,
      ...(input.physicalLevel !== undefined
        ? { physicalLevel: input.physicalLevel }
        : {}),
      neededWorkers: input.neededWorkers,
      waveStage: input.waveStage ?? JobWaveStage.WAVE1,
      waveStartedAt: new Date(),
      isUrgent: input.isUrgent ?? false,
      urgentBonusEur:
        input.isUrgent && input.urgentBonusEur !== undefined
          ? input.urgentBonusEur
          : null,
      confirmBy: input.isUrgent ? input.confirmBy ?? null : null,
      isBundle: input.isBundle ?? false,
      bundleMinHours: input.isBundle ? input.bundleMinHours ?? null : null,
      bundleMinDays: input.isBundle ? input.bundleMinDays ?? null : null,
      bundleBonusEur: input.isBundle ? input.bundleBonusEur ?? null : null,
      bundleHourlyRateEur:
        input.isBundle && input.bundleHourlyRateEur !== undefined
          ? new Prisma.Decimal(input.bundleHourlyRateEur)
          : null,
      contractType: input.contractType ?? ContractType.TRADE_LICENSE,
      noticeWindow: input.noticeWindow,
      payEmployment: input.payEmployment ?? null,
      payTradeLicense: input.payTradeLicense ?? null,
    },
  });
}

export async function updateJob(
  companyUserId: string,
  jobId: string,
  input: UpdateJobInput,
) {
  const company = await requireCompany(companyUserId);
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: company.id },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  const data: Prisma.JobUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.locationCity !== undefined) data.locationCity = input.locationCity;
  if (input.locationAddress !== undefined)
    data.locationAddress = input.locationAddress;
  if (input.region !== undefined) data.region = input.region;
  if (input.warehouseType !== undefined)
    data.warehouseType = input.warehouseType;
  if (input.positionTypes !== undefined) data.positionTypes = input.positionTypes;
  if (input.startsAt !== undefined) {
    data.startsAt = input.startsAt;
    data.endsAt = calculateEndsAt(
      input.startsAt,
      input.durationHours ?? job.durationHours,
    );
  } else if (input.durationHours !== undefined) {
    data.endsAt = calculateEndsAt(job.startsAt, input.durationHours);
  }
  if (input.durationHours !== undefined)
    data.durationHours = input.durationHours;
  if (input.hourlyRate !== undefined)
    data.hourlyRate = new Prisma.Decimal(input.hourlyRate);
  if (input.requiredVzv !== undefined) data.requiredVzv = input.requiredVzv;
  if (input.minExperience !== undefined) data.minExperience = input.minExperience;
  if (input.physicalLevel !== undefined) data.physicalLevel = input.physicalLevel;
  if (input.neededWorkers !== undefined) data.neededWorkers = input.neededWorkers;
  if (input.isUrgent !== undefined) {
    data.isUrgent = input.isUrgent;
    if (!input.isUrgent) {
      data.urgentBonusEur = null;
      data.confirmBy = null;
    }
  }
  if (input.urgentBonusEur !== undefined) data.urgentBonusEur = input.urgentBonusEur;
  if (input.confirmBy !== undefined) data.confirmBy = input.confirmBy;
  if (input.isBundle !== undefined) {
    data.isBundle = input.isBundle;
    if (!input.isBundle) {
      data.bundleMinHours = null;
      data.bundleMinDays = null;
      data.bundleBonusEur = null;
      data.bundleHourlyRateEur = null;
    }
  }
  if (input.bundleMinHours !== undefined) data.bundleMinHours = input.bundleMinHours;
  if (input.bundleMinDays !== undefined) data.bundleMinDays = input.bundleMinDays;
  if (input.bundleBonusEur !== undefined) data.bundleBonusEur = input.bundleBonusEur;
  if (input.bundleHourlyRateEur !== undefined)
    data.bundleHourlyRateEur = new Prisma.Decimal(input.bundleHourlyRateEur);

  if (input.contractType !== undefined) data.contractType = input.contractType;
  if (input.noticeWindow !== undefined) data.noticeWindow = input.noticeWindow;
  if (input.payEmployment !== undefined) data.payEmployment = input.payEmployment;
  if (input.payTradeLicense !== undefined) data.payTradeLicense = input.payTradeLicense;

  if (input.status !== undefined) data.status = input.status;

  return prisma.job.update({
    where: { id: job.id },
    data,
  });
}

const waveOrder: Record<JobWaveStage, number> = {
  [JobWaveStage.WAVE1]: 1,
  [JobWaveStage.WAVE2]: 2,
  [JobWaveStage.PUBLIC]: 3,
};

export async function updateJobWaveStage(
  companyUserId: string,
  jobId: string,
  waveStage: JobWaveStage,
) {
  const company = await requireCompany(companyUserId, { ensureApproved: false });
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: company.id },
    select: { id: true, waveStage: true, status: true },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.status !== JobStatus.OPEN) {
    throw new Error("Zmena nie je otvorená.");
  }

  if (waveOrder[waveStage] < waveOrder[job.waveStage as JobWaveStage]) {
    throw new Error("Vlnu nie je možné vrátiť späť.");
  }

  return prisma.job.update({
    where: { id: job.id },
    data: { waveStage },
  });
}

export async function listCompanyJobs(companyUserId: string) {
  const company = await requireCompany(companyUserId, {
    ensureApproved: false,
  });
  const jobs = await prisma.job.findMany({
    where: { companyId: company.id },
    orderBy: { startsAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  const jobIds = jobs.map((job) => job.id);
  const confirmed =
    jobIds.length === 0
      ? []
      : await prisma.jobApplication.groupBy({
          by: ["jobId"],
          where: { jobId: { in: jobIds }, status: ApplicationStatus.CONFIRMED },
          _count: { jobId: true },
        });
  const confirmedByJobId = new Map(confirmed.map((row) => [row.jobId, row._count.jobId] as const));

  return jobs.map((job) => ({
    ...job,
    confirmedCount: confirmedByJobId.get(job.id) ?? 0,
    missingCount: Math.max(0, job.neededWorkers - (confirmedByJobId.get(job.id) ?? 0)),
  }));
}

export async function getJobForCompany(companyUserId: string, jobId: string) {
  const company = await requireCompany(companyUserId, { ensureApproved: false });
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: company.id },
    include: {
      applications: {
        include: {
          worker: true,
          contractDocument: {
            select: {
              id: true,
              status: true,
              companySignedAt: true,
              workerSignedAt: true,
            },
          },
        },
        orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!job) return null;

  const workerIds = Array.from(new Set(job.applications.map((a) => a.workerId)));
  const completedContracts =
    workerIds.length === 0
      ? []
      : await prisma.contractDocument.findMany({
          where: {
            companyId: company.id,
            workerId: { in: workerIds },
            status: ContractStatus.COMPLETED,
          },
          select: { workerId: true },
          distinct: ["workerId"],
          take: 5000,
        });
  const completedByWorkerId = new Set(completedContracts.map((c) => c.workerId));

  return {
    ...job,
    applications: job.applications.map((app) => ({
      ...app,
      hasCompletedContractWithCompany: completedByWorkerId.has(app.workerId),
    })),
  };
}
