import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCompanyKpis } from "@/server/services/company-kpis";
import { NoticeWindow } from "@/types";
import { prismaMock } from "./setup";

describe("company KPIs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-10T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes rates safely and summarizes SLA policy", async () => {
    prismaMock.job.aggregate.mockResolvedValue({
      _sum: { neededWorkers: 10 },
      _count: { _all: 2 },
    } as never);

    prismaMock.jobApplication.count
      .mockResolvedValueOnce(6 as never)  // confirmedSlots
      .mockResolvedValueOnce(6 as never)  // confirmedShifts
      .mockResolvedValueOnce(4 as never)  // completedConfirmedShifts
      .mockResolvedValueOnce(20 as never) // applicationsTotal
      .mockResolvedValueOnce(2 as never)  // cancellationsTotal
      .mockResolvedValueOnce(1 as never)  // cancellationsByWorker
      .mockResolvedValueOnce(1 as never); // cancellationsByCompany

    prismaMock.$queryRaw.mockResolvedValue([{ avg_reliability: 7.5 }] as never);

    prismaMock.job.groupBy.mockResolvedValue([
      { noticeWindow: NoticeWindow.H24, cancellationCompensationPct: 50, _count: { _all: 2 } },
    ] as never);

    const result = await getCompanyKpis("c1", 13);

    expect(result.rangeDays).toBe(30);
    expect(result.neededSlots).toBe(10);
    expect(result.confirmedSlots).toBe(6);
    expect(result.fillRate).toBe(0.6);
    expect(result.completionProxy).toBeCloseTo(4 / 6);
    expect(result.cancellationRate).toBe(0.1);
    expect(result.avgApplicantReliability).toBe(7.5);
    expect(result.slaHint).toContain("kompenzácia 50%");
  });

  it("shows a hint when policy differs by job", async () => {
    prismaMock.job.aggregate.mockResolvedValue({
      _sum: { neededWorkers: 0 },
      _count: { _all: 0 },
    } as never);

    prismaMock.jobApplication.count.mockResolvedValue(0 as never);
    prismaMock.$queryRaw.mockResolvedValue([{ avg_reliability: null }] as never);
    prismaMock.job.groupBy.mockResolvedValue([
      { noticeWindow: NoticeWindow.H24, cancellationCompensationPct: 0, _count: { _all: 1 } },
      { noticeWindow: NoticeWindow.H48, cancellationCompensationPct: 50, _count: { _all: 1 } },
    ] as never);

    const result = await getCompanyKpis("c1", 7);
    expect(result.slaHint).toBe("Politika storna sa líši podľa zmeny.");
  });
});

