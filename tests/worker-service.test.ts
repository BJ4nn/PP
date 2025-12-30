import { describe, it, expect } from "vitest";
import * as workerService from "@/server/services/worker";
import { ExperienceLevel, Region, DayOfWeek, ShiftType, ContractType } from "@/types";
import { prismaMock } from "./setup";

const sampleInput = {
  fullName: "Jane Worker",
  phone: "+421900111222",
  city: "Bratislava",
  region: Region.BA,
  hasTradeLicense: true,
  experienceLevel: ExperienceLevel.INTERMEDIATE,
  hasVzv: true,
  hasBozp: false,
  hasFoodCard: true,
  availability: {
    daysOfWeek: [DayOfWeek.MON, DayOfWeek.THU],
    shiftTypes: [ShiftType.MORNING, ShiftType.NIGHT],
  },
  hasCar: true,
  minHourlyRate: 12,
};

describe("worker service", () => {
  it("maps activity/reliability scores to human labels", () => {
    expect(workerService.getWorkerActivityLabel({})).toBe("New");
    expect(
      workerService.getWorkerActivityLabel({ activityScore: 5, reliabilityScore: 4 }),
    ).toBe("Low");
    expect(
      workerService.getWorkerActivityLabel({ activityScore: 10, reliabilityScore: 5 }),
    ).toBe("Medium");
    expect(
      workerService.getWorkerActivityLabel({ activityScore: 20, reliabilityScore: 10 }),
    ).toBe("High");
    expect(
      workerService.getWorkerActivityLabel({ activityScore: 30, reliabilityScore: 30 }),
    ).toBe("Very high");
  });

  it("upserts worker onboarding data and converts numeric fields", async () => {
    const upsertResult = { id: "worker-1" };
    prismaMock.workerProfile.upsert.mockResolvedValueOnce(upsertResult);

    const result = await workerService.completeWorkerOnboarding("user-1", sampleInput);

    expect(result).toBe(upsertResult);
    expect(prismaMock.workerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        update: expect.objectContaining({
          name: sampleInput.fullName,
          minHourlyRate: sampleInput.minHourlyRate,
          onboardingComplete: true,
        }),
      }),
    );
  });

  it("drops trade-license contract preference when worker has no trade license", async () => {
    prismaMock.workerProfile.upsert.mockResolvedValueOnce({ id: "worker-2" } as never);

    await workerService.completeWorkerOnboarding("user-2", {
      ...sampleInput,
      hasTradeLicense: false,
      preferredContractType: ContractType.TRADE_LICENSE,
    } as never);

    expect(prismaMock.workerProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          hasTradeLicense: false,
          preferredContractType: null,
        }),
        create: expect.objectContaining({
          hasTradeLicense: false,
          preferredContractType: null,
        }),
      }),
    );
  });

  it("increments worker activity by user id", async () => {
    await workerService.incrementWorkerActivityByUserId("user-99", "APPLY");
    expect(prismaMock.workerProfile.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-99" },
      data: {
        activityScore: { increment: 1 },
        lastActiveAt: expect.any(Date),
      },
    });
  });

  it("increments worker activity by worker id", async () => {
    await workerService.incrementWorkerActivityByWorkerId("worker-99", "CONFIRM");
    expect(prismaMock.workerProfile.updateMany).toHaveBeenCalledWith({
      where: { id: "worker-99" },
      data: {
        activityScore: { increment: 2 },
        lastActiveAt: expect.any(Date),
      },
    });
  });

  it("updates reliability score", async () => {
    await workerService.updateWorkerReliability("worker-10", "CONFIRMED_SHIFT");
    expect(prismaMock.workerProfile.update).toHaveBeenCalledWith({
      where: { id: "worker-10" },
      data: {
        reliabilityScore: { increment: 2 },
        lastActiveAt: expect.any(Date),
      },
    });
  });

  it("updates ready state and records activity", async () => {
    prismaMock.workerProfile.updateMany.mockClear();
    await workerService.setWorkerReadyState("user-55", true);

    expect(prismaMock.workerProfile.update).toHaveBeenCalledWith({
      where: { userId: "user-55" },
      data: {
        isReady: true,
        lastReadyAt: expect.any(Date),
        lastActiveAt: expect.any(Date),
      },
    });
    expect(prismaMock.workerProfile.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-55" },
      data: {
        activityScore: { increment: 0 },
        lastActiveAt: expect.any(Date),
      },
    });
  });

  it("rejects trade-license preference update if worker has no trade license", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce({
      hasTradeLicense: false,
    } as never);

    await expect(
      workerService.updateWorkerPreferences("user-1", {
        preferredContractType: ContractType.TRADE_LICENSE,
      } as never),
    ).rejects.toThrow("Nemáte nastavenú živnosť");
  });

  it("updates only provided preference fields", async () => {
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce({
      hasTradeLicense: true,
    } as never);
    prismaMock.workerProfile.update.mockResolvedValueOnce({
      preferredContractType: ContractType.EMPLOYMENT,
      minHourlyRate: 12,
      minHourlyRateEmployment: null,
    } as never);

    await workerService.updateWorkerPreferences("user-1", { minHourlyRate: 12 });

    expect(prismaMock.workerProfile.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { minHourlyRate: 12 },
      select: expect.any(Object),
    });
  });
});
