import { describe, it, expect } from "vitest";
import { prismaMock } from "./setup";
import { getCompanyWorkerGroups } from "@/server/services/company-worker-groups";

describe("company worker groups service", () => {
  it("returns empty groups when no relations exist", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "company-1",
      onboardingComplete: true,
    } as never);
    prismaMock.workerCompanyRelation.findMany.mockResolvedValueOnce([] as never);

    const result = await getCompanyWorkerGroups("user-1");

    expect(result.priorityWorkers).toEqual([]);
    expect(result.narrowWorkers).toEqual([]);
  });

  it("builds priority and narrow groups with normalized worker data", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "company-1",
      onboardingComplete: true,
    } as never);

    prismaMock.workerCompanyRelation.findMany.mockResolvedValueOnce([
      {
        workerId: "worker-1",
        isPriority: true,
        isNarrowCollaboration: false,
        worker: {
          id: "worker-1",
          name: " ",
          city: null,
          reliabilityScore: null,
        },
      },
      {
        workerId: "worker-2",
        isPriority: true,
        isNarrowCollaboration: true,
        worker: {
          id: "worker-2",
          name: "Eva",
          city: "BA",
          reliabilityScore: 8,
        },
      },
    ] as never);

    prismaMock.jobApplication.findMany.mockResolvedValueOnce([
      {
        workerId: "worker-1",
        job: { endsAt: new Date("2030-01-02T08:00:00.000Z") },
      },
    ] as never);

    const result = await getCompanyWorkerGroups("user-1");

    expect(result.priorityWorkers).toEqual(
      expect.arrayContaining([
        {
          id: "worker-1",
          name: "Nezname meno",
          city: "Nezname mesto",
          reliabilityScore: 0,
          lastWorkedAt: new Date("2030-01-02T08:00:00.000Z"),
        },
        {
          id: "worker-2",
          name: "Eva",
          city: "BA",
          reliabilityScore: 8,
          lastWorkedAt: null,
        },
      ]),
    );
    expect(result.narrowWorkers).toEqual([
      {
        id: "worker-2",
        name: "Eva",
        city: "BA",
        reliabilityScore: 8,
        lastWorkedAt: null,
      },
    ]);
  });
});
