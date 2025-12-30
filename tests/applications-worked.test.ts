import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { confirmWorkedShiftsForCompany } from "@/server/services/applications/worked";
import { prismaMock } from "./setup";
import { ApplicationStatus } from "@/types";

describe("applications worked confirmation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("confirms worked shifts in bulk and optionally sets rating", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findMany.mockResolvedValueOnce([
      { id: "a1" },
      { id: "a2" },
    ] as never);

    prismaMock.jobApplication.updateMany.mockResolvedValueOnce({ count: 2 } as never);

    const result = await confirmWorkedShiftsForCompany("company-user", {
      applicationIds: ["a1", "a2", "a3"],
      ratingStars: 5,
    });

    expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["a1", "a2", "a3"] },
          status: ApplicationStatus.CONFIRMED,
          workedConfirmedAt: null,
        }),
      }),
    );

    expect(prismaMock.jobApplication.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["a1", "a2"] } },
      data: expect.objectContaining({
        workedConfirmedAt: new Date("2030-01-10T12:00:00.000Z"),
        workerRatingStars: 5,
      }),
    });

    expect(result).toEqual({ updatedCount: 2, updatedIds: ["a1", "a2"] });
  });

  it("does nothing when there are no eligible applications", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findMany.mockResolvedValueOnce([] as never);

    const result = await confirmWorkedShiftsForCompany("company-user", {
      applicationIds: ["a1"],
    });

    expect(prismaMock.jobApplication.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ updatedCount: 0, updatedIds: [] });
  });
});

