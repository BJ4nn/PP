import { describe, it, expect } from "vitest";
import {
  allowedExperienceLevels,
  calculateEndsAt,
  hasRequiredExperience,
  requireCompany,
  requireWorker,
} from "@/server/services/jobs/shared";
import { ExperienceLevel } from "@/types";
import { prismaMock } from "./setup";

describe("jobs shared helpers", () => {
  it("calculates endsAt using duration hours", () => {
    const startsAt = new Date("2024-01-01T08:00:00.000Z");
    expect(calculateEndsAt(startsAt, 8).toISOString()).toBe("2024-01-01T16:00:00.000Z");
  });

  it("computes experience requirements and allowed levels", () => {
    expect(hasRequiredExperience(ExperienceLevel.ADVANCED, ExperienceLevel.BASIC)).toBe(true);
    expect(hasRequiredExperience(ExperienceLevel.BASIC, ExperienceLevel.ADVANCED)).toBe(false);
    expect(allowedExperienceLevels(ExperienceLevel.INTERMEDIATE)).toEqual([
      ExperienceLevel.NONE,
      ExperienceLevel.BASIC,
      ExperienceLevel.INTERMEDIATE,
    ]);
  });

  it("requireWorker rejects missing or incomplete onboarding", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce(null as never);
    await expect(requireWorker("u1")).rejects.toThrow("Worker profile not found");

    prismaMock.workerProfile.findUnique.mockResolvedValueOnce({
      onboardingComplete: false,
    } as never);
    await expect(requireWorker("u1")).rejects.toThrow("Finish worker onboarding first");
  });

  it("requireCompany enforces onboarding and approval by default", async () => {
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce(null as never);
    await expect(requireCompany("c1")).rejects.toThrow("Company profile not found");

    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      onboardingComplete: false,
      isApproved: true,
    } as never);
    await expect(requireCompany("c1")).rejects.toThrow("Finish company onboarding first");

    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      onboardingComplete: true,
      isApproved: false,
    } as never);
    await expect(requireCompany("c1")).rejects.toThrow("Company profile not approved");

    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      onboardingComplete: true,
      isApproved: false,
    } as never);
    await expect(requireCompany("c1", { ensureApproved: false })).resolves.toBeTruthy();
  });
});

