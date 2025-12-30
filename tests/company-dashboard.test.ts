import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCompanyDashboardData } from "@/server/services/company-dashboard";
import { prismaMock } from "./setup";
import { ApplicationStatus, JobStatus } from "@/types";

describe("company dashboard service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-20T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds month calendar stats and worker lists", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      onboardingComplete: true,
    } as never);

    prismaMock.job.findMany.mockResolvedValueOnce([
      {
        id: "j1",
        title: "Shift A",
        status: JobStatus.OPEN,
        startsAt: new Date("2030-01-05T08:00:00.000Z"),
        endsAt: new Date("2030-01-05T16:00:00.000Z"),
        neededWorkers: 3,
      },
      {
        id: "j2",
        title: "Shift B",
        status: JobStatus.FULL,
        startsAt: new Date("2030-01-06T08:00:00.000Z"),
        endsAt: new Date("2030-01-06T16:00:00.000Z"),
        neededWorkers: 1,
      },
    ] as never);

    prismaMock.jobApplication.findMany
      .mockResolvedValueOnce([
        { jobId: "j1", status: ApplicationStatus.PENDING },
        { jobId: "j1", status: ApplicationStatus.CONFIRMED },
        { jobId: "j2", status: ApplicationStatus.CONFIRMED },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "a-work-1",
          workerId: "w1",
          worker: { id: "w1", name: "Jane", city: "BA", reliabilityScore: 10 },
          job: { endsAt: new Date("2030-01-10T16:00:00.000Z") },
        },
        {
          id: "a-work-2",
          workerId: "w1",
          worker: { id: "w1", name: "Jane", city: "BA", reliabilityScore: 10 },
          job: { endsAt: new Date("2030-01-08T16:00:00.000Z") },
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "a-verified",
          workerId: "w2",
          worker: { id: "w2", name: "John", city: "BA", reliabilityScore: 7 },
          job: { endsAt: new Date("2030-01-09T16:00:00.000Z") },
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: "a-pending",
          workerId: "w3",
          worker: { id: "w3", name: "Eva", city: "BA", reliabilityScore: 12 },
          job: {
            id: "j-old",
            title: "Old shift",
            startsAt: new Date("2030-01-10T08:00:00.000Z"),
            endsAt: new Date("2030-01-10T16:00:00.000Z"),
            status: JobStatus.CLOSED,
          },
        },
      ] as never);

    const result = await getCompanyDashboardData("company-user", {
      monthKey: "2030-01",
    });

    expect(result.monthKey).toBe("2030-01");
    expect(result.days.find((d) => d.dateKey === "2030-01-05")).toEqual(
      expect.objectContaining({
        neededWorkers: 3,
        applicantsCount: 2,
        confirmedCount: 1,
        missingCount: 2,
      }),
    );

    expect(result.workersWorked).toEqual([
      expect.objectContaining({ id: "w1", lastWorkedAt: new Date("2030-01-10T16:00:00.000Z") }),
    ]);
    expect(result.verifiedWorkers).toEqual([
      expect.objectContaining({ id: "w2" }),
    ]);
    expect(result.pendingWorkedConfirmations).toHaveLength(1);
    expect(result.pendingWorkedConfirmations[0]).toEqual(
      expect.objectContaining({
        applicationId: "a-pending",
        worker: expect.objectContaining({ id: "w3" }),
        job: expect.objectContaining({ id: "j-old" }),
      }),
    );
  });
});

