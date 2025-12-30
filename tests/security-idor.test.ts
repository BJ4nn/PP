import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock } from "./setup";
import {
  cancelApplicationByCompany,
  cancelApplicationByWorker,
  updateApplicationStatus,
} from "@/server/services/applications/status";
import { updateJob } from "@/server/services/jobs/company";
import { ApplicationStatus, JobStatus, NoticeWindow } from "@/types";

vi.mock("@/server/services/notifications", () => ({
  createNotificationForUser: vi.fn(),
}));

vi.mock("@/server/services/mailer", () => ({
  sendTransactionalEmail: vi.fn(),
}));

describe("security: IDOR/ownership enforcement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prevents company from canceling another company's application", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findUnique.mockResolvedValueOnce({
      id: "a1",
      status: ApplicationStatus.CONFIRMED,
      workerId: "w1",
      jobId: "j1",
      worker: { id: "w1", userId: "worker-user" },
      job: {
        id: "j1",
        title: "Shift",
        status: JobStatus.OPEN,
        startsAt: new Date("2030-01-02T08:00:00.000Z"),
        endsAt: new Date("2030-01-02T16:00:00.000Z"),
        durationHours: 8,
        noticeWindow: NoticeWindow.H24,
        cancellationCompensationPct: 0,
        hourlyRate: 20,
        contractType: null,
        companyId: "other-company",
        company: { id: "other-company", userId: "other-user" },
      },
    } as never);

    await expect(cancelApplicationByCompany("company-user", "a1")).rejects.toThrow(
      "Application not found",
    );
    expect(prismaMock.jobApplication.update).not.toHaveBeenCalled();
  });

  it("prevents company from updating status of another company's application", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findUnique.mockResolvedValueOnce({
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
        companyId: "other-company",
        company: { id: "other-company", userId: "other-user" },
      },
    } as never);

    await expect(
      updateApplicationStatus("company-user", "a1", { status: ApplicationStatus.CONFIRMED }),
    ).rejects.toThrow("Application not found");
    expect(prismaMock.jobApplication.update).not.toHaveBeenCalled();
  });

  it("prevents worker from canceling another worker's application", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce({
      id: "w1",
      userId: "worker-user",
      name: "Jane",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findUnique.mockResolvedValueOnce({
      id: "a1",
      workerId: "someone-else",
      status: ApplicationStatus.CONFIRMED,
      job: {
        id: "j1",
        title: "Day shift",
        startsAt: new Date("2030-01-03T08:00:00.000Z"),
        endsAt: new Date("2030-01-03T16:00:00.000Z"),
        noticeWindow: NoticeWindow.H24,
        company: { userId: "company-user" },
      },
    } as never);

    await expect(cancelApplicationByWorker("worker-user", "a1")).rejects.toThrow(
      "Application not found",
    );
    expect(prismaMock.jobApplication.update).not.toHaveBeenCalled();
  });

  it("prevents company from updating a job it doesn't own", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
      isApproved: true,
    } as never);

    prismaMock.job.findFirst.mockResolvedValueOnce(null as never);

    await expect(
      updateJob("company-user", "other-job", { title: "X" }),
    ).rejects.toThrow("Job not found");
    expect(prismaMock.job.update).not.toHaveBeenCalled();
  });
});
