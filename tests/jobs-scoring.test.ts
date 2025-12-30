import { describe, it, expect } from "vitest";
import { scoreWorkerForJob } from "@/server/services/jobs/scoring";
import { ContractType, ExperienceLevel, NoticeWindow, Region } from "@/types";

const company = {
  id: "c1",
  userId: "company-user",
  companyName: "ACME",
  onboardingComplete: true,
  isApproved: true,
};

describe("jobs scoring", () => {
  it("penalizes missing required VZV and clamps score to [0, 100]", () => {
    const worker = {
      region: Region.BA,
      hasVZV: false,
      experienceLevel: ExperienceLevel.NONE,
      activityScore: 0,
      reliabilityScore: 0,
      minHourlyRate: null,
      minHourlyRateEmployment: null,
      hasTradeLicense: false,
      preferredContractType: null,
    };

    const job = {
      region: Region.BA,
      requiredVzv: true,
      minExperience: ExperienceLevel.BASIC,
      hourlyRate: 12,
      contractType: ContractType.EMPLOYMENT,
      noticeWindow: NoticeWindow.H24,
      isUrgent: false,
      isBundle: false,
      company,
    };

    const score = scoreWorkerForJob({ worker: worker as never, job: job as never });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(50);
  });

  it("boosts urgent jobs for reliable workers", () => {
    const worker = {
      region: Region.BA,
      hasVZV: true,
      experienceLevel: ExperienceLevel.ADVANCED,
      activityScore: 10,
      reliabilityScore: 20,
      minHourlyRateEmployment: 10,
      hasTradeLicense: false,
      preferredContractType: ContractType.EMPLOYMENT,
    };

    const baseJob = {
      region: Region.BA,
      requiredVzv: false,
      minExperience: ExperienceLevel.BASIC,
      hourlyRate: 15,
      contractType: ContractType.EMPLOYMENT,
      noticeWindow: NoticeWindow.H24,
      isBundle: false,
      company,
    };

    const normal = scoreWorkerForJob({ worker: worker as never, job: { ...baseJob, isUrgent: false } as never });
    const urgent = scoreWorkerForJob({ worker: worker as never, job: { ...baseJob, isUrgent: true } as never });
    expect(urgent).toBeGreaterThan(normal);
  });

  it("applies bundle penalty when worker does not meet availability thresholds", () => {
    const worker = {
      region: Region.BA,
      hasVZV: true,
      experienceLevel: ExperienceLevel.ADVANCED,
      activityScore: 10,
      reliabilityScore: 10,
      minHourlyRateEmployment: 10,
      hasTradeLicense: false,
      preferredContractType: ContractType.EMPLOYMENT,
      availabilityJson: { daysOfWeek: ["MON"], shiftTypes: ["MORNING"] },
    };

    const job = {
      region: Region.BA,
      requiredVzv: false,
      minExperience: null,
      hourlyRate: 15,
      contractType: ContractType.EMPLOYMENT,
      noticeWindow: NoticeWindow.H24,
      isUrgent: false,
      isBundle: true,
      bundleMinDays: 3,
      bundleMinHours: null,
      durationHours: 8,
      company,
    };

    const score = scoreWorkerForJob({ worker: worker as never, job: job as never });
    expect(score).toBeLessThan(80);
  });
});
