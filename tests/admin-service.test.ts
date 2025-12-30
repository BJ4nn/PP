import { describe, it, expect } from "vitest";
import { getAdminDashboardData } from "@/server/services/admin";
import { prismaMock } from "./setup";

describe("admin service", () => {
  it("aggregates dashboard counts and feed data", async () => {
    prismaMock.workerProfile.count.mockResolvedValue(5 as never);
    prismaMock.companyProfile.count.mockResolvedValue(3 as never);
    prismaMock.job.count.mockResolvedValue(7 as never);
    prismaMock.jobApplication.count
      .mockResolvedValueOnce(20 as never)
      .mockResolvedValueOnce(2 as never);
    prismaMock.jobApplication.aggregate.mockResolvedValue({
      _sum: { compensationAmount: 123 },
    } as never);

    prismaMock.workerProfile.findMany
      .mockResolvedValueOnce([{ id: "worker-1", onboardingComplete: true }] as never)
      .mockResolvedValueOnce([{ id: "ready-1", onboardingComplete: true, isReady: true }] as never);
    prismaMock.companyProfile.findMany
      .mockResolvedValueOnce([{ id: "company-1", onboardingComplete: true }] as never)
      .mockResolvedValueOnce([{ id: "company-pending-1", onboardingComplete: true }] as never);
    prismaMock.job.findMany.mockResolvedValue([{ id: "job-1" }] as never);
    prismaMock.jobApplication.findMany
      .mockResolvedValueOnce([{ id: "application-1" }] as never)
      .mockResolvedValueOnce([{ id: "match-1" }] as never);

    const result = await getAdminDashboardData();

    expect(result.counts).toEqual({
      workers: 5,
      companies: 3,
      openJobs: 7,
      applications: 20,
      lateCancellations: 2,
      compensationTotalEur: 123,
    });
    expect(result.latestWorkers).toHaveLength(1);
    expect(result.latestCompanies).toHaveLength(1);
    expect(result.recentJobs).toHaveLength(1);
    expect(result.recentApplications).toHaveLength(1);
    expect(result.monitor.readyWorkers).toHaveLength(1);
    expect(result.monitor.confirmedMatches).toHaveLength(1);
  });
});
