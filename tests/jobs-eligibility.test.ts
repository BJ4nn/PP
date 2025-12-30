import { describe, it, expect } from "vitest";
import {
  getEffectivePayForWorker,
  isJobCompatibleWithWorker,
  workerMeetsBundle,
  workerMeetsFlexConditions,
  workerMeetsNoticeWindow,
} from "@/server/services/jobs/worker-eligibility";
import { ContractType } from "@/types";

describe("jobs eligibility", () => {
  it("enforces bundle minimum days/hours from availability", () => {
    const job = {
      isBundle: true,
      bundleMinDays: 3,
      bundleMinHours: 24,
      durationHours: 8,
    };

    const workerOk = {
      availabilityJson: { daysOfWeek: ["MON", "TUE", "WED"], shiftTypes: ["MORNING"] },
    };
    const workerNotEnoughDays = {
      availabilityJson: { daysOfWeek: ["MON", "TUE"], shiftTypes: ["MORNING"] },
    };
    const workerNotEnoughHours = {
      availabilityJson: { daysOfWeek: ["MON", "TUE", "WED"], shiftTypes: ["MORNING"] },
    };

    expect(workerMeetsBundle(job as never, workerOk as never)).toBe(true);
    expect(workerMeetsBundle(job as never, workerNotEnoughDays as never)).toBe(false);

    const jobMoreHours = { ...job, bundleMinDays: null, bundleMinHours: 32 };
    expect(workerMeetsBundle(jobMoreHours as never, workerNotEnoughHours as never)).toBe(false);
  });

  it("always allows notice window", () => {
    expect(workerMeetsNoticeWindow()).toBe(true);
  });

  it("computes effective pay by selecting best valid contract offer", () => {
    const job = {
      isBundle: false,
      hourlyRate: 10,
      contractType: null,
      payEmployment: 11,
      payTradeLicense: 12,
    };

    const worker = {
      hasTradeLicense: true,
      preferredContractType: null,
      minHourlyRateEmployment: 12,
      minHourlyRate: 12,
    };

    const offer = getEffectivePayForWorker(job as never, worker as never);
    expect(offer).toEqual({ contractType: ContractType.TRADE_LICENSE, hourlyRate: 12 });
  });

  it("returns null pay when all offers are below the worker minimum", () => {
    const job = {
      isBundle: false,
      hourlyRate: 10,
      contractType: ContractType.EMPLOYMENT,
    };

    const worker = {
      hasTradeLicense: false,
      minHourlyRateEmployment: 20,
      minHourlyRate: null,
    };

    expect(getEffectivePayForWorker(job as never, worker as never)).toBeNull();
    expect(isJobCompatibleWithWorker(job as never, worker as never)).toBe(false);
    expect(workerMeetsFlexConditions(worker as never, job as never).minRateMatch).toBe(false);
  });

  it("rejects trade-license jobs for workers without trade license", () => {
    const job = {
      isBundle: false,
      hourlyRate: 12,
      contractType: ContractType.TRADE_LICENSE,
    };

    const worker = {
      hasTradeLicense: false,
      minHourlyRate: null,
    };

    const flex = workerMeetsFlexConditions(worker as never, job as never);
    expect(flex.contractMatch).toBe(false);
    expect(flex.all).toBe(false);
  });
});
