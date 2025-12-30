import { describe, it, expect, vi } from "vitest";
import { Prisma } from "@prisma/client";
import * as jobsService from "@/server/services/jobs";
import { createNotificationForUser } from "@/server/services/notifications";
import {
  ApplicationStatus,
  ContractType,
  ExperienceLevel,
  JobStatus,
  NoticeWindow,
  Region,
  NotificationType,
} from "@/types";
import { prismaMock } from "./setup";

vi.mock("@/server/services/notifications", () => ({
  createNotificationForUser: vi.fn(),
}));

const companyProfile = {
  id: "company-1",
  userId: "user-company",
  onboardingComplete: true,
  isApproved: true,
};

describe("jobs service", () => {
  it("computes worker relevance score using region, certificates and history", () => {
    const worker = {
      region: Region.BA,
      hasVZV: true,
      experienceLevel: ExperienceLevel.ADVANCED,
      activityScore: 12,
      reliabilityScore: 20,
      minHourlyRate: 12,
      minHourlyRateEmployment: null,
      hasTradeLicense: false,
      preferredContractType: ContractType.EMPLOYMENT,
    };

    const job = {
      region: Region.BA,
      requiredVzv: true,
      minExperience: ExperienceLevel.BASIC,
      hourlyRate: new Prisma.Decimal(15),
      contractType: ContractType.EMPLOYMENT,
      noticeWindow: NoticeWindow.H24,
      company: companyProfile,
    };

    const score = jobsService.scoreWorkerForJob({
      worker: worker as never,
      job: job as never,
    });

    expect(score).toBe(100);
  });

  it("updates job data and recalculates end time when start or duration changes", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue(companyProfile as never);
    const originalStartsAt = new Date("2024-02-01T08:00:00.000Z");
    prismaMock.job.findFirst.mockResolvedValue({
      id: "job-1",
      companyId: companyProfile.id,
      startsAt: originalStartsAt,
      durationHours: 8,
    } as never);

    prismaMock.job.update.mockResolvedValue({} as never);

    const nextStartsAt = new Date("2024-02-10T10:00:00.000Z");
    await jobsService.updateJob("user-company", "job-1", {
      startsAt: nextStartsAt,
      durationHours: 6,
      hourlyRate: 11.5,
      title: "Updated shift",
    });

    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        startsAt: nextStartsAt,
        endsAt: new Date(nextStartsAt.getTime() + 6 * 60 * 60 * 1000),
        durationHours: 6,
        hourlyRate: new Prisma.Decimal(11.5),
        title: "Updated shift",
      },
    });
  });

  it("cancels a job and cascades notifications to pending workers", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue(companyProfile as never);
    const shiftStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const shiftEnd = new Date(shiftStart.getTime() + 8 * 60 * 60 * 1000);
    prismaMock.job.findFirst.mockResolvedValue({
      id: "job-2",
      companyId: companyProfile.id,
      status: JobStatus.OPEN,
      startsAt: shiftStart,
      endsAt: shiftEnd,
      neededWorkers: 1,
      title: "Packing shift",
      noticeWindow: NoticeWindow.H24,
      cancellationCompensationPct: 0,
      hourlyRate: new Prisma.Decimal(15),
      requiredVzv: false,
      minExperience: null,
      contractType: ContractType.EMPLOYMENT,
    } as never);

    prismaMock.jobApplication.findMany.mockResolvedValue([
      {
        id: "application-1",
        status: ApplicationStatus.PENDING,
        worker: { userId: "worker-user-1" },
      },
    ] as never);

    prismaMock.job.update.mockResolvedValue({
      id: "job-2",
      status: JobStatus.CANCELLED,
    } as never);
    prismaMock.$transaction.mockResolvedValueOnce([] as never);

    await jobsService.updateJobStatusForCompany({
      jobId: "job-2",
      companyUserId: "user-company",
      nextStatus: JobStatus.CANCELLED,
    });

    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: "job-2" },
      data: { status: JobStatus.CANCELLED },
    });

    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "application-1" },
        data: expect.objectContaining({
          status: ApplicationStatus.CANCELLED_BY_COMPANY,
          canceledBy: "COMPANY",
          canceledAt: expect.any(Date),
        }),
      }),
    );

    expect(createNotificationForUser).toHaveBeenCalledWith("worker-user-1", NotificationType.WORKER_JOB_CANCELED, expect.objectContaining({
      jobId: "job-2",
      jobTitle: "Packing shift",
    }));
  });

  it("rejects marking job as FULL when confirmed workers are below neededWorkers", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue(companyProfile as never);
    prismaMock.job.findFirst.mockResolvedValue({
      id: "job-3",
      companyId: companyProfile.id,
      status: JobStatus.OPEN,
      neededWorkers: 2,
    } as never);
    prismaMock.jobApplication.count.mockResolvedValue(1 as never);

    await expect(
      jobsService.updateJobStatusForCompany({
        jobId: "job-3",
        companyUserId: "user-company",
        nextStatus: JobStatus.FULL,
      }),
    ).rejects.toThrow("Not enough confirmed workers to mark as full");
  });

  it("computes compensation for late cancellation of confirmed workers", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue(companyProfile as never);
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const endsAt = new Date(startsAt.getTime() + 4 * 60 * 60 * 1000);
    prismaMock.job.findFirst.mockResolvedValue({
      id: "job-4",
      companyId: companyProfile.id,
      status: JobStatus.OPEN,
      startsAt,
      endsAt,
      durationHours: 4,
      neededWorkers: 1,
      title: "Packing shift",
      noticeWindow: NoticeWindow.H24,
      cancellationCompensationPct: 50,
      hourlyRate: new Prisma.Decimal(20),
      requiredVzv: false,
      minExperience: null,
      contractType: ContractType.EMPLOYMENT,
    } as never);

    prismaMock.jobApplication.findMany.mockResolvedValue([
      {
        id: "application-4",
        status: ApplicationStatus.CONFIRMED,
        worker: {
          userId: "worker-user-4",
          hasTradeLicense: false,
        },
      },
    ] as never);

    prismaMock.job.update.mockResolvedValue({
      id: "job-4",
      status: JobStatus.CANCELLED,
    } as never);
    prismaMock.$transaction.mockResolvedValueOnce([] as never);

    await jobsService.updateJobStatusForCompany({
      jobId: "job-4",
      companyUserId: "user-company",
      nextStatus: JobStatus.CANCELLED,
    });

    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "application-4" },
        data: expect.objectContaining({
          status: ApplicationStatus.COMPANY_CANCELED_LATE,
          compensationAmount: 40,
        }),
      }),
    );

    expect(createNotificationForUser).toHaveBeenCalledWith(
      "worker-user-4",
      NotificationType.WORKER_APPLICATION_CANCELED_LATE_BY_COMPANY,
      expect.objectContaining({
        jobId: "job-4",
        compensationAmount: 40,
      }),
    );
  });
});
