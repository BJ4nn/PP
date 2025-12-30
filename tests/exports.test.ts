import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCompanyBonusesCsv, getCompanyHoursCsv } from "@/server/services/exports";
import { ApplicationStatus, NoticeWindow, Region } from "@/types";
import { prismaMock } from "./setup";
import { format } from "date-fns";

describe("exports service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-10T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports confirmed hours CSV with formatted timestamps", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
      isApproved: false,
    } as never);

    const startsAt = new Date("2030-01-09T08:00:00.000Z");
    const endsAt = new Date("2030-01-09T16:00:00.000Z");

    prismaMock.jobApplication.findMany.mockResolvedValue([
      {
        jobId: "j1",
        workerId: "w1",
        estimatedEarningsEur: 123.45,
        status: ApplicationStatus.CONFIRMED,
        worker: { id: "w1", name: "Jane" },
        job: {
          id: "j1",
          title: "Picker shift",
          startsAt,
          endsAt,
          durationHours: 8,
          noticeWindow: NoticeWindow.H24,
          region: Region.BA,
        },
      },
    ] as never);

    const csv = await getCompanyHoursCsv(
      "company-user",
      "https://example.test/api/company/exports/hours?range=7",
    );

    expect(prismaMock.jobApplication.findMany).toHaveBeenCalled();
    expect(csv).toContain("jobId,jobTitle,startsAt,endsAt,durationHours,workerId,workerName,estimatedEarningsEur\n");
    expect(csv).toContain(
      `j1,Picker shift,${format(startsAt, "yyyy-MM-dd HH:mm")},${format(endsAt, "yyyy-MM-dd HH:mm")},8,w1,Jane,123.45\n`,
    );
  });

  it("exports bonuses CSV and computes totals", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
      isApproved: false,
    } as never);

    const startsAt = new Date("2030-01-09T08:00:00.000Z");
    prismaMock.jobApplication.findMany.mockResolvedValue([
      {
        jobId: "j1",
        workerId: "w1",
        status: ApplicationStatus.CONFIRMED,
        worker: { id: "w1", name: "Jane" },
        job: {
          id: "j1",
          title: "Urgent bundled shift",
          startsAt,
          endsAt: new Date("2030-01-09T16:00:00.000Z"),
          durationHours: 8,
          isUrgent: true,
          urgentBonusEur: 10,
          isBundle: true,
          bundleBonusEur: 5,
          noticeWindow: NoticeWindow.H24,
          region: Region.BA,
        },
      },
    ] as never);

    const csv = await getCompanyBonusesCsv(
      "company-user",
      "https://example.test/api/company/exports/bonuses?range=7",
    );

    expect(prismaMock.jobApplication.findMany).toHaveBeenCalled();
    expect(csv).toContain("jobId,jobTitle,startsAt,workerId,workerName,urgentBonusEur,bundleBonusEur,totalBonusEur\n");

    const total = 10 + 5;
    expect(csv).toContain(
      `j1,Urgent bundled shift,${format(startsAt, "yyyy-MM-dd HH:mm")},w1,Jane,10,5,${total}\n`,
    );
  });

  it("neutralizes spreadsheet formula injection in exported CSV strings", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValue({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
      isApproved: false,
    } as never);

    const startsAt = new Date("2030-01-09T08:00:00.000Z");
    const endsAt = new Date("2030-01-09T16:00:00.000Z");

    prismaMock.jobApplication.findMany.mockResolvedValue([
      {
        jobId: "j1",
        workerId: "w1",
        estimatedEarningsEur: 123.45,
        status: ApplicationStatus.CONFIRMED,
        worker: { id: "w1", name: "=1+1" },
        job: {
          id: "j1",
          title: "@malicious",
          startsAt,
          endsAt,
          durationHours: 8,
          noticeWindow: NoticeWindow.H24,
          region: Region.BA,
        },
      },
    ] as never);

    const csv = await getCompanyHoursCsv(
      "company-user",
      "https://example.test/api/company/exports/hours?range=7",
    );

    expect(csv).toContain("j1,'@malicious");
    expect(csv).toContain("w1,'=1+1");
  });
});
