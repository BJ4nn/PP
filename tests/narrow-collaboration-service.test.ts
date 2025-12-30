import { describe, it, expect } from "vitest";
import { prismaMock } from "./setup";
import {
  createCompanyNarrowCollaborationGroup,
  createCompanyNarrowCollaborationScheme,
  deleteCompanyNarrowCollaborationGroup,
  deleteCompanyNarrowCollaborationScheme,
  getCompanyNarrowCollaborationSettings,
} from "@/server/services/narrow-collaboration";
import { DayOfWeek } from "@/types";

describe("narrow collaboration service", () => {
  it("maps groups and schemes for company settings", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "company-1",
      onboardingComplete: true,
    } as never);

    prismaMock.companyNarrowCollaborationGroup.findMany.mockResolvedValueOnce([
      {
        id: "group-1",
        name: "Stabilný tím",
        maxAdvanceWeeks: 2,
        _count: { workerRelations: 3 },
      },
    ] as never);

    prismaMock.companyNarrowCollaborationScheme.findMany.mockResolvedValueOnce([
      {
        id: "scheme-1",
        name: "Týždeň",
        daysOfWeek: [DayOfWeek.MON, DayOfWeek.FRI],
      },
    ] as never);

    const result = await getCompanyNarrowCollaborationSettings("user-1");

    expect(result.groups).toEqual([
      {
        id: "group-1",
        name: "Stabilný tím",
        maxAdvanceWeeks: 2,
        workerCount: 3,
      },
    ]);
    expect(result.schemes).toEqual([
      {
        id: "scheme-1",
        name: "Týždeň",
        daysOfWeek: [DayOfWeek.MON, DayOfWeek.FRI],
      },
    ]);
  });

  it("creates and deletes narrow collaboration groups", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue({
      id: "company-1",
      onboardingComplete: true,
    } as never);

    prismaMock.companyNarrowCollaborationGroup.create.mockResolvedValueOnce({
      id: "group-2",
      name: "Nová skupina",
      maxAdvanceWeeks: 1,
    } as never);

    const created = await createCompanyNarrowCollaborationGroup("user-1", {
      name: "Nová skupina",
      maxAdvanceWeeks: 1,
    });

    expect(prismaMock.companyNarrowCollaborationGroup.create).toHaveBeenCalledWith({
      data: {
        companyId: "company-1",
        name: "Nová skupina",
        maxAdvanceWeeks: 1,
      },
    });
    expect(created).toEqual(
      expect.objectContaining({ id: "group-2", name: "Nová skupina" }),
    );

    prismaMock.companyNarrowCollaborationGroup.findFirst.mockResolvedValueOnce({
      id: "group-2",
      companyId: "company-1",
    } as never);
    prismaMock.companyNarrowCollaborationGroup.delete.mockResolvedValueOnce({
      id: "group-2",
    } as never);

    const deleted = await deleteCompanyNarrowCollaborationGroup(
      "user-1",
      "group-2",
    );

    expect(prismaMock.companyNarrowCollaborationGroup.delete).toHaveBeenCalledWith({
      where: { id: "group-2" },
    });
    expect(deleted).toEqual(expect.objectContaining({ id: "group-2" }));
  });

  it("creates and deletes narrow collaboration schemes", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue({
      id: "company-1",
      onboardingComplete: true,
    } as never);

    prismaMock.companyNarrowCollaborationScheme.create.mockResolvedValueOnce({
      id: "scheme-2",
      name: "Víkend",
      daysOfWeek: [DayOfWeek.SAT],
    } as never);

    const created = await createCompanyNarrowCollaborationScheme("user-1", {
      name: "Víkend",
      daysOfWeek: [DayOfWeek.SAT],
    });

    expect(prismaMock.companyNarrowCollaborationScheme.create).toHaveBeenCalledWith({
      data: {
        companyId: "company-1",
        name: "Víkend",
        daysOfWeek: [DayOfWeek.SAT],
      },
    });
    expect(created).toEqual(
      expect.objectContaining({ id: "scheme-2", name: "Víkend" }),
    );

    prismaMock.companyNarrowCollaborationScheme.findFirst.mockResolvedValueOnce({
      id: "scheme-2",
      companyId: "company-1",
    } as never);
    prismaMock.companyNarrowCollaborationScheme.delete.mockResolvedValueOnce({
      id: "scheme-2",
    } as never);

    const deleted = await deleteCompanyNarrowCollaborationScheme(
      "user-1",
      "scheme-2",
    );

    expect(prismaMock.companyNarrowCollaborationScheme.delete).toHaveBeenCalledWith({
      where: { id: "scheme-2" },
    });
    expect(deleted).toEqual(expect.objectContaining({ id: "scheme-2" }));
  });
});
