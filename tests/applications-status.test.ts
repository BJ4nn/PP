import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  cancelApplicationByCompany,
  cancelApplicationByWorker,
  updateApplicationStatus,
} from "@/server/services/applications/status";
import * as workerService from "@/server/services/worker";
import { prismaMock } from "./setup";
import {
  ApplicationStatus,
  CanceledBy,
  JobStatus,
  NoticeWindow,
  NotificationType,
} from "@/types";

vi.mock("@/server/services/notifications", () => ({
  createNotificationForUser: vi.fn(),
}));

vi.mock("@/server/services/mailer", () => ({
  sendTransactionalEmail: vi.fn(),
}));

describe("applications status service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("confirms an application when there are no overlaps and notifies worker", async () => {
    const { createNotificationForUser } = await import("@/server/services/notifications");
    const { sendTransactionalEmail } = await import("@/server/services/mailer");

    prismaMock.companyProfile.findUnique.mockResolvedValue({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findUnique.mockResolvedValue({
      id: "a1",
      status: ApplicationStatus.PENDING,
      workerId: "w1",
      jobId: "j1",
      worker: { id: "w1", userId: "worker-user" },
      job: {
        id: "j1",
        status: JobStatus.OPEN,
        title: "Picker shift",
        startsAt: new Date("2030-01-03T08:00:00.000Z"),
        endsAt: new Date("2030-01-03T16:00:00.000Z"),
        companyId: "c1",
        company: { id: "c1" },
      },
    } as never);

    prismaMock.jobApplication.findFirst.mockResolvedValue(null as never);
    prismaMock.jobApplication.update.mockResolvedValue({ id: "a1", status: ApplicationStatus.CONFIRMED } as never);
    prismaMock.user.findUnique.mockResolvedValue({ email: "worker@example.com" } as never);

    vi.spyOn(workerService, "incrementWorkerActivityByWorkerId").mockResolvedValue();
    vi.spyOn(workerService, "updateWorkerReliability").mockResolvedValue();

    await updateApplicationStatus("company-user", "a1", {
      status: ApplicationStatus.CONFIRMED,
    });

    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { status: ApplicationStatus.CONFIRMED },
    });
    expect(workerService.incrementWorkerActivityByWorkerId).toHaveBeenCalledWith("w1", "CONFIRM");
    expect(workerService.updateWorkerReliability).toHaveBeenCalledWith("w1", "CONFIRMED_SHIFT");
    expect(createNotificationForUser).toHaveBeenCalledWith(
      "worker-user",
      NotificationType.WORKER_APPLICATION_CONFIRMED,
      expect.objectContaining({ jobId: "j1", applicationId: "a1", companyName: "ACME" }),
    );
    expect(sendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "worker@example.com",
        subject: "Your shift was confirmed",
      }),
    );
  });

  it("rejects confirmation when worker has overlapping confirmed shift", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findUnique.mockResolvedValue({
      id: "a1",
      status: ApplicationStatus.PENDING,
      workerId: "w1",
      jobId: "j1",
      worker: { id: "w1", userId: "worker-user" },
      job: {
        id: "j1",
        status: JobStatus.OPEN,
        title: "Picker shift",
        startsAt: new Date("2030-01-03T08:00:00.000Z"),
        endsAt: new Date("2030-01-03T16:00:00.000Z"),
        companyId: "c1",
        company: { id: "c1" },
      },
    } as never);

    prismaMock.jobApplication.findFirst.mockResolvedValue({ id: "overlap" } as never);

    await expect(
      updateApplicationStatus("company-user", "a1", { status: ApplicationStatus.CONFIRMED }),
    ).rejects.toThrow("Worker already confirmed for overlapping shift");
    expect(prismaMock.jobApplication.update).not.toHaveBeenCalled();
  });

  it("cancels late confirmed application by company and computes compensation", async () => {
    const { createNotificationForUser } = await import("@/server/services/notifications");

    prismaMock.companyProfile.findUnique.mockResolvedValue({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
    } as never);

    const startsAt = new Date("2030-01-01T02:00:00.000Z"); // 2h from now (late for H24)
    prismaMock.jobApplication.findUnique.mockResolvedValue({
      id: "a1",
      status: ApplicationStatus.CONFIRMED,
      workerId: "w1",
      jobId: "j1",
      worker: { id: "w1", userId: "worker-user" },
      job: {
        id: "j1",
        title: "Night shift",
        status: JobStatus.OPEN,
        startsAt,
        endsAt: new Date("2030-01-01T06:00:00.000Z"),
        durationHours: 4,
        noticeWindow: NoticeWindow.H24,
        cancellationCompensationPct: 50,
        hourlyRate: 20,
        contractType: null,
        companyId: "c1",
        company: { id: "c1" },
      },
    } as never);

    prismaMock.jobApplication.update.mockResolvedValue({} as never);

    await cancelApplicationByCompany("company-user", "a1");

    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: expect.objectContaining({
        status: ApplicationStatus.COMPANY_CANCELED_LATE,
        canceledBy: CanceledBy.COMPANY,
        compensationAmount: 40,
      }),
    });

    expect(createNotificationForUser).toHaveBeenCalledWith(
      "worker-user",
      NotificationType.WORKER_APPLICATION_CANCELED_LATE_BY_COMPANY,
      expect.objectContaining({ compensationAmount: 40 }),
    );
  });

  it("lets worker cancel confirmed application when not late (no reliability penalty)", async () => {
    const { createNotificationForUser } = await import("@/server/services/notifications");

    prismaMock.workerProfile.findUnique.mockResolvedValue({
      id: "w1",
      userId: "worker-user",
      name: "Jane",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findUnique.mockResolvedValue({
      id: "a1",
      workerId: "w1",
      status: ApplicationStatus.CONFIRMED,
      job: {
        id: "j1",
        title: "Day shift",
        startsAt: new Date("2030-01-03T08:00:00.000Z"), // 56h from now
        endsAt: new Date("2030-01-03T16:00:00.000Z"),
        noticeWindow: NoticeWindow.H24,
        company: { userId: "company-user" },
      },
    } as never);

    prismaMock.jobApplication.update.mockResolvedValue({} as never);

    const reliabilitySpy = vi
      .spyOn(workerService, "updateWorkerReliability")
      .mockResolvedValue();
    const activitySpy = vi
      .spyOn(workerService, "incrementWorkerActivityByWorkerId")
      .mockResolvedValue();

    await cancelApplicationByWorker("worker-user", "a1");

    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: expect.objectContaining({
        status: ApplicationStatus.CANCELLED_BY_WORKER,
        canceledBy: CanceledBy.WORKER,
      }),
    });
    expect(reliabilitySpy).not.toHaveBeenCalled();
    expect(activitySpy).toHaveBeenCalledWith("w1", "CANCEL");
    expect(createNotificationForUser).toHaveBeenCalledWith(
      "company-user",
      NotificationType.COMPANY_APPLICATION_CANCELED_BY_WORKER,
      expect.objectContaining({ applicationId: "a1", workerName: "Jane" }),
    );

    reliabilitySpy.mockRestore();
    activitySpy.mockRestore();
  });
});
