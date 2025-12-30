import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createJobSchema, updateJobSchema } from "@/lib/validators/jobs";
import { ContractType, NoticeWindow, Region, WarehouseType } from "@/types";

const basePayload = {
  title: "Picker shift",
  description: "Help with picking and packing orders.",
  locationCity: "Bratislava",
  locationAddress: "Nivy 5, Bratislava",
  region: Region.BA,
  warehouseType: WarehouseType.WAREHOUSE,
  startsAt: new Date("2030-01-01T08:00:00.000Z"),
  durationHours: 8,
  hourlyRate: 12,
  requiredVzv: false,
  neededWorkers: 3,
  noticeWindow: NoticeWindow.H24,
  contractType: ContractType.EMPLOYMENT,
};

describe("jobs validators", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("requires confirmBy for urgent job creation", () => {
    const parsed = createJobSchema.safeParse({
      ...basePayload,
      isUrgent: true,
      urgentBonusEur: 5,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "confirmBy")).toBe(true);
  });

  it("rejects urgent confirmBy in the past", () => {
    const parsed = createJobSchema.safeParse({
      ...basePayload,
      isUrgent: true,
      urgentBonusEur: 5,
      confirmBy: new Date("2029-12-31T23:00:00.000Z"),
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "confirmBy")).toBe(true);
  });

  it("rejects urgent-only fields when isUrgent is false", () => {
    const parsed = createJobSchema.safeParse({
      ...basePayload,
      isUrgent: false,
      urgentBonusEur: 5,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "urgentBonusEur")).toBe(true);
  });

  it("requires bundle thresholds and incentives when isBundle is true", () => {
    const noThreshold = createJobSchema.safeParse({
      ...basePayload,
      isBundle: true,
      bundleBonusEur: 10,
    });
    expect(noThreshold.success).toBe(false);

    const noIncentive = createJobSchema.safeParse({
      ...basePayload,
      isBundle: true,
      bundleMinDays: 3,
    });
    expect(noIncentive.success).toBe(false);
  });

  it("rejects bundle-only fields when isBundle is false", () => {
    const parsed = createJobSchema.safeParse({
      ...basePayload,
      isBundle: false,
      bundleMinDays: 3,
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "isBundle")).toBe(true);
  });

  it("requires at least one field for update", () => {
    const parsed = updateJobSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("rejects confirmBy update without setting isUrgent", () => {
    const parsed = updateJobSchema.safeParse({
      confirmBy: new Date("2030-01-01T06:00:00.000Z"),
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error.issues.some((issue) => issue.path.join(".") === "confirmBy")).toBe(true);
  });
});
