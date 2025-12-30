import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ContractType, ExperienceLevel, JobStatus, NoticeWindow, Region } from "@/types";
import { prismaMock } from "./setup";

describe("jobs capacity service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flags late cancellations strictly inside notice window", async () => {
    const { isLateCancellation } = await import("@/server/services/jobs/capacity");
    const now = new Date("2030-01-01T00:00:00.000Z");
    const startsAtSame = new Date("2030-01-02T00:00:00.000Z"); // 24h

    expect(isLateCancellation({ startsAt: startsAtSame, noticeWindow: NoticeWindow.H24 }, now)).toBe(false);

    const startsAtSooner = new Date("2030-01-01T23:59:00.000Z");
    expect(isLateCancellation({ startsAt: startsAtSooner, noticeWindow: NoticeWindow.H24 }, now)).toBe(true);
  });

  it("clamps cancellation compensation between 0 and 100", async () => {
    const { updateJobPolicy } = await import("@/server/services/jobs/capacity");

    prismaMock.companyProfile.findUnique.mockResolvedValue({
      id: "c1",
      companyName: "ACME",
      onboardingComplete: true,
      isApproved: true,
    } as never);
    prismaMock.job.findFirst.mockResolvedValue({
      id: "j1",
      companyId: "c1",
    } as never);
    prismaMock.job.update.mockResolvedValue({ id: "j1" } as never);

    await updateJobPolicy("company-user", "j1", {
      noticeWindow: NoticeWindow.H48,
      cancellationCompensationPct: 120,
    });

    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: "j1" },
      data: { noticeWindow: NoticeWindow.H48, cancellationCompensationPct: 100 },
    });
  });

  it("does not ping workers when updating slots", async () => {
    const { updateJobSlots } = await import("@/server/services/jobs/capacity");

    const company = {
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
      isApproved: true,
    };
    prismaMock.companyProfile.findUnique.mockResolvedValue(company as never);

    const futureStart = new Date("2030-01-03T08:00:00.000Z");
    const job = {
      id: "j1",
      companyId: company.id,
      status: JobStatus.OPEN,
      title: "Urgent shift",
      startsAt: futureStart,
      endsAt: new Date("2030-01-03T16:00:00.000Z"),
      durationHours: 8,
      region: Region.BA,
      requiredVzv: false,
      minExperience: ExperienceLevel.BASIC,
      hourlyRate: 15,
      contractType: ContractType.EMPLOYMENT,
      noticeWindow: NoticeWindow.H24,
      neededWorkers: 1,
      company,
    };

    prismaMock.job.findFirst
      .mockResolvedValueOnce(job as never) // updateJobSlots fetch
      .mockResolvedValueOnce(job as never);

    prismaMock.jobApplication.count.mockResolvedValue(1 as never);
    prismaMock.job.update.mockResolvedValue({ id: "j1", neededWorkers: 2, status: JobStatus.OPEN } as never);

    const result = await updateJobSlots("company-user", "j1", 2);

    expect(result.confirmedCount).toBe(1);
    expect(result.pingedCount).toBe(0);
  });
});
