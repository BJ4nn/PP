import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prismaMock } from "./setup";
import {
  getCompanyWorkerProfile,
  getCompanyWorkersData,
  updateCompanyWorkerRelation,
} from "@/server/services/company-workers";

describe("company workers service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("summarizes worked and verified workers", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "company-1",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findMany
      .mockResolvedValueOnce([
        {
          workerId: "worker-1",
          worker: { id: "worker-1", name: "Eva", city: "BA", reliabilityScore: 9 },
          job: { endsAt: new Date("2030-01-05T08:00:00.000Z") },
        },
        {
          workerId: "worker-1",
          worker: { id: "worker-1", name: "Eva", city: "BA", reliabilityScore: 9 },
          job: { endsAt: new Date("2030-01-03T08:00:00.000Z") },
        },
        {
          workerId: "worker-2",
          worker: { id: "worker-2", name: "Tom", city: "TT", reliabilityScore: 6 },
          job: { endsAt: new Date("2030-01-04T08:00:00.000Z") },
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          workerId: "worker-2",
          worker: { id: "worker-2", name: "Tom", city: "TT", reliabilityScore: 6 },
          job: { endsAt: new Date("2030-01-04T08:00:00.000Z") },
        },
      ] as never);

    const result = await getCompanyWorkersData("user-1");

    expect(result.workersWorked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "worker-1",
          lastWorkedAt: new Date("2030-01-05T08:00:00.000Z"),
        }),
        expect.objectContaining({
          id: "worker-2",
          lastWorkedAt: new Date("2030-01-04T08:00:00.000Z"),
        }),
      ]),
    );
    expect(result.verifiedWorkers).toEqual([
      expect.objectContaining({
        id: "worker-2",
        lastWorkedAt: new Date("2030-01-04T08:00:00.000Z"),
      }),
    ]);
  });

  it("returns worker profile with default relation", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "company-1",
      onboardingComplete: true,
    } as never);

    prismaMock.workerProfile.findFirst.mockResolvedValueOnce({
      id: "worker-1",
      name: "Eva",
      city: "BA",
      reliabilityScore: 7,
      user: { email: "eva@example.com" },
    } as never);

    prismaMock.workerCompanyRelation.findUnique.mockResolvedValueOnce(null as never);
    prismaMock.jobApplication.findFirst.mockResolvedValueOnce(null as never);

    const result = await getCompanyWorkerProfile("user-1", "worker-1");

    expect(result?.user?.email).toBe("eva@example.com");
    expect(result?.relation).toEqual({
      isPriority: false,
      isNarrowCollaboration: false,
    });
    expect(result?.hasWorked).toBe(false);
  });

  it("rejects relation updates when worker has no confirmed shifts", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "company-1",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findFirst.mockResolvedValueOnce(null as never);

    await expect(
      updateCompanyWorkerRelation("user-1", "worker-1", { isPriority: true }),
    ).rejects.toThrow("Pracovník ešte nemá potvrdenú odpracovanú zmenu.");
  });

  it("upserts relation with narrow group assignment", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "company-1",
      onboardingComplete: true,
    } as never);

    prismaMock.jobApplication.findFirst.mockResolvedValueOnce({
      id: "app-1",
    } as never);

    prismaMock.companyNarrowCollaborationGroup.findFirst.mockResolvedValueOnce({
      id: "group-1",
      companyId: "company-1",
    } as never);

    prismaMock.workerCompanyRelation.upsert.mockResolvedValueOnce({
      id: "relation-1",
      workerId: "worker-1",
      companyId: "company-1",
      isPriority: true,
      isNarrowCollaboration: true,
      narrowGroupId: "group-1",
    } as never);

    const updated = await updateCompanyWorkerRelation("user-1", "worker-1", {
      isPriority: true,
      isNarrowCollaboration: true,
      narrowGroupId: "group-1",
    });

    expect(prismaMock.workerCompanyRelation.upsert).toHaveBeenCalledWith({
      where: {
        companyId_workerId: { companyId: "company-1", workerId: "worker-1" },
      },
      update: {
        isPriority: true,
        isNarrowCollaboration: true,
        narrowGroupId: "group-1",
      },
      create: {
        companyId: "company-1",
        workerId: "worker-1",
        isPriority: true,
        isNarrowCollaboration: true,
        narrowGroupId: "group-1",
      },
    });
    expect(updated).toEqual(expect.objectContaining({ id: "relation-1" }));
  });
});
