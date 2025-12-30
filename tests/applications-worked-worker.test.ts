import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock } from "./setup";
import { confirmWorkedByWorker } from "@/server/services/applications/worked-worker";
import { ApplicationStatus } from "@/types";

describe("worker worked confirmation service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-10T18:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects if application is not owned", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce({
      id: "w1",
      userId: "worker-user",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findUnique.mockResolvedValueOnce({
      id: "a1",
      workerId: "someone-else",
      status: ApplicationStatus.CONFIRMED,
      workerWorkedConfirmedAt: null,
      job: { endsAt: new Date("2030-01-10T16:00:00.000Z") },
    } as never);

    await expect(confirmWorkedByWorker("worker-user", "a1")).rejects.toThrow(
      "Application not found",
    );
  });

  it("rejects if shift not ended", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce({
      id: "w1",
      userId: "worker-user",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findUnique.mockResolvedValueOnce({
      id: "a1",
      workerId: "w1",
      status: ApplicationStatus.CONFIRMED,
      workerWorkedConfirmedAt: null,
      job: { endsAt: new Date("2030-01-10T19:00:00.000Z") },
    } as never);

    await expect(confirmWorkedByWorker("worker-user", "a1")).rejects.toThrow(
      "Shift has not ended yet",
    );
  });

  it("updates confirmation timestamp and optional note", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce({
      id: "w1",
      userId: "worker-user",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findUnique.mockResolvedValueOnce({
      id: "a1",
      workerId: "w1",
      status: ApplicationStatus.CONFIRMED,
      workerWorkedConfirmedAt: null,
      job: { endsAt: new Date("2030-01-10T16:00:00.000Z") },
    } as never);

    prismaMock.jobApplication.update.mockResolvedValueOnce({
      id: "a1",
      workerWorkedConfirmedAt: new Date("2030-01-10T18:00:00.000Z"),
      workerWorkedNote: "ok",
    } as never);

    const result = await confirmWorkedByWorker("worker-user", "a1", " ok ");

    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: expect.objectContaining({
        workerWorkedNote: "ok",
      }),
    });
    expect(result).toEqual(expect.objectContaining({ id: "a1" }));
  });
});

