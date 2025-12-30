import { describe, it, expect, vi, beforeEach } from "vitest";
import * as applicationsService from "@/server/services/applications";
import * as workerService from "@/server/services/worker";
import { createNotificationForUser } from "@/server/services/notifications";
import { ApplicationStatus, ExperienceLevel, JobStatus, NoticeWindow, Region, NotificationType } from "@/types";
import { prismaMock } from "./setup";

vi.mock("@/server/services/notifications", () => ({
  createNotificationForUser: vi.fn(),
}));

vi.mock("@/server/services/mailer", () => ({
  sendTransactionalEmail: vi.fn(),
}));

const workerProfile = {
  id: "worker-1",
  userId: "user-worker",
  name: "Worker One",
  region: Region.BA,
  hasVZV: true,
  experienceLevel: ExperienceLevel.INTERMEDIATE,
  onboardingComplete: true,
};

const job = {
  id: "job-1",
  title: "Packing shift",
  status: JobStatus.OPEN,
  region: Region.BA,
  requiredVzv: true,
  minExperience: ExperienceLevel.BASIC,
  hourlyRate: 12,
  company: { userId: "company-user", companyName: "Warehouse X" },
  startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  endsAt: new Date(Date.now() + 28 * 60 * 60 * 1000),
};

describe("applications service", () => {
  beforeEach(() => {
    prismaMock.workerProfile.findUnique.mockResolvedValue(workerProfile as never);
  });

  it("creates a worker application and triggers activity and notifications", async () => {
    prismaMock.job.findFirst.mockResolvedValue(job as never);
    prismaMock.jobApplication.findUnique.mockResolvedValue(null as never);
    prismaMock.jobApplication.create.mockResolvedValue({
      id: "application-1",
      jobId: job.id,
      workerId: workerProfile.id,
    } as never);

    const activitySpy = vi
      .spyOn(workerService, "incrementWorkerActivityByUserId")
      .mockResolvedValue();

    const application = await applicationsService.applyToJob("user-worker", job.id, {
      note: "Ready to help",
    });

    expect(application).toMatchObject({
      id: "application-1",
      jobId: job.id,
      workerId: workerProfile.id,
    });

    expect(prismaMock.jobApplication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        jobId: job.id,
        workerId: workerProfile.id,
        note: "Ready to help",
        matchScore: expect.any(Number),
      }),
    });
    expect(activitySpy).toHaveBeenCalledWith("user-worker", "APPLY");
    expect(createNotificationForUser).toHaveBeenCalledWith(
      "company-user",
      NotificationType.COMPANY_NEW_APPLICATION,
      expect.objectContaining({
        jobId: job.id,
        applicationId: "application-1",
        workerName: workerProfile.name,
      }),
    );
    activitySpy.mockRestore();
  });

  it("lets worker cancel confirmed application and penalizes late notice", async () => {
    const startSoon = new Date(Date.now() + 8 * 60 * 60 * 1000);
    prismaMock.jobApplication.findUnique.mockResolvedValue({
      id: "application-1",
      workerId: workerProfile.id,
      status: ApplicationStatus.CONFIRMED,
      job: {
        id: job.id,
        company: { userId: "company-user" },
        startsAt: startSoon,
        endsAt: new Date(startSoon.getTime() + 4 * 60 * 60 * 1000),
        title: "Inventory shift",
        noticeWindow: NoticeWindow.H24,
      },
    } as never);

    const activitySpy = vi
      .spyOn(workerService, "incrementWorkerActivityByWorkerId")
      .mockResolvedValue();
    const reliabilitySpy = vi
      .spyOn(workerService, "updateWorkerReliability")
      .mockResolvedValue();

    prismaMock.jobApplication.update.mockResolvedValue({} as never);

    await applicationsService.cancelApplicationByWorker("user-worker", "application-1");

    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
      where: { id: "application-1" },
      data: expect.objectContaining({
        status: ApplicationStatus.WORKER_CANCELED_LATE,
        canceledBy: "WORKER",
        canceledAt: expect.any(Date),
      }),
    });
    expect(activitySpy).toHaveBeenCalledWith(workerProfile.id, "CANCEL");
    expect(reliabilitySpy).toHaveBeenCalledWith(
      workerProfile.id,
      "CANCELLED_LATE",
    );

    activitySpy.mockRestore();
    reliabilitySpy.mockRestore();
  });
});
