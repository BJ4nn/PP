import { prisma } from "@/server/db/client";
import type { WorkerOnboardingInput } from "@/lib/validators/onboarding";
import type { WorkerPreferencesInput } from "@/lib/validators/worker-preferences";
import { ContractType } from "@/types";

export async function getWorkerProfileByUserId(userId: string) {
  return prisma.workerProfile.findUnique({
    where: { userId },
  });
}

export async function getWorkerProfileById(id: string) {
  return prisma.workerProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
    },
  });
}

export function getWorkerActivityLabel({
  activityScore,
  reliabilityScore,
}: {
  activityScore?: number | null;
  reliabilityScore?: number | null;
}) {
  const normalizedActivity = activityScore ?? 0;
  const normalizedReliability = reliabilityScore ?? 0;
  const combined = normalizedActivity + normalizedReliability;

  if (combined >= 50) return "Very high";
  if (combined >= 25) return "High";
  if (combined >= 12) return "Medium";
  return combined > 0 ? "Low" : "New";
}

export async function completeWorkerOnboarding(
  userId: string,
  input: WorkerOnboardingInput,
) {
  const hasTrade = input.hasTradeLicense === true;
  const preferredContractType =
    input.preferredContractType === ContractType.TRADE_LICENSE && !hasTrade
      ? null
      : input.preferredContractType ?? null;

  return prisma.workerProfile.upsert({
    where: { userId },
    update: {
      name: input.fullName,
      phone: input.phone,
      city: input.city,
      region: input.region,
      hasTradeLicense: input.hasTradeLicense,
      experienceLevel: input.experienceLevel,
      hasVZV: input.hasVzv,
      hasBOZP: input.hasBozp,
      hasFoodCard: input.hasFoodCard,
      hasCar: input.hasCar,
      availabilityJson: input.availability,
      preferredContractType,
      minHourlyRate: input.minHourlyRate ?? null,
      minHourlyRateEmployment: input.minHourlyRateEmployment ?? null,
      onboardingComplete: true,
    },
    create: {
      userId,
      name: input.fullName,
      phone: input.phone,
      city: input.city,
      region: input.region,
      hasTradeLicense: input.hasTradeLicense,
      experienceLevel: input.experienceLevel,
      hasVZV: input.hasVzv,
      hasBOZP: input.hasBozp,
      hasFoodCard: input.hasFoodCard,
      hasCar: input.hasCar,
      availabilityJson: input.availability,
      preferredContractType,
      minHourlyRate: input.minHourlyRate ?? null,
      minHourlyRateEmployment: input.minHourlyRateEmployment ?? null,
      onboardingComplete: true,
    },
  });
}

const ACTIVITY_DELTAS = {
  LOGIN: 0,
  APPLY: 1,
  CONFIRM: 2,
  CANCEL: -2,
  READY_TOGGLE: 0,
} as const;

type ActivityEvent = keyof typeof ACTIVITY_DELTAS;

async function incrementActivity(where: { userId?: string; id?: string }, event: ActivityEvent) {
  const identifier = where.userId ? { userId: where.userId } : where.id ? { id: where.id } : null;
  if (!identifier) return;

  await prisma.workerProfile.updateMany({
    where: identifier,
    data: {
      activityScore: { increment: ACTIVITY_DELTAS[event] },
      lastActiveAt: new Date(),
    },
  });
}

const RELIABILITY_DELTAS = {
  CONFIRMED_SHIFT: 2,
  CANCELLED_LATE: -5,
} as const;

type ReliabilityEvent = keyof typeof RELIABILITY_DELTAS;

export async function updateWorkerReliability(
  workerId: string,
  event: ReliabilityEvent,
) {
  await prisma.workerProfile.update({
    where: { id: workerId },
    data: {
      reliabilityScore: { increment: RELIABILITY_DELTAS[event] },
      lastActiveAt: new Date(),
    },
  });
}

export async function incrementWorkerActivityByUserId(
  userId: string,
  event: ActivityEvent,
) {
  await incrementActivity({ userId }, event);
}

export async function incrementWorkerActivityByWorkerId(
  workerId: string,
  event: ActivityEvent,
) {
  await incrementActivity({ id: workerId }, event);
}

export async function setWorkerReadyState(userId: string, isReady: boolean) {
  const now = new Date();
  await prisma.workerProfile.update({
    where: { userId },
    data: {
      isReady,
      lastReadyAt: isReady ? now : null,
      lastActiveAt: now,
    },
  });
  await incrementWorkerActivityByUserId(userId, "READY_TOGGLE");
}

export async function getWorkerPreferences(userId: string) {
  const profile = await prisma.workerProfile.findUnique({
    where: { userId },
    select: {
      preferredContractType: true,
      minHourlyRate: true,
      minHourlyRateEmployment: true,
    },
  });
  if (!profile) {
    throw new Error("Worker profile not found");
  }
  return profile;
}

export async function updateWorkerPreferences(
  userId: string,
  input: WorkerPreferencesInput,
) {
  const existing = await prisma.workerProfile.findUnique({
    where: { userId },
    select: { hasTradeLicense: true },
  });
  if (!existing) {
    throw new Error("Worker profile not found");
  }

  if (
    input.preferredContractType === ContractType.TRADE_LICENSE &&
    !existing.hasTradeLicense
  ) {
    throw new Error("Nemáte nastavenú živnosť, nemôžete preferovať živnosť.");
  }

  return prisma.workerProfile.update({
    where: { userId },
    data: {
      ...(input.preferredContractType !== undefined
        ? { preferredContractType: input.preferredContractType }
        : {}),
      ...(input.minHourlyRate !== undefined ? { minHourlyRate: input.minHourlyRate } : {}),
      ...(input.minHourlyRateEmployment !== undefined
        ? { minHourlyRateEmployment: input.minHourlyRateEmployment }
        : {}),
    },
    select: {
      preferredContractType: true,
      minHourlyRate: true,
      minHourlyRateEmployment: true,
    },
  });
}

// Backwards compatible exports (older UI/routes may still import these)
export const getWorkerPrefsByUserId = getWorkerPreferences;
export const updateWorkerPrefs = updateWorkerPreferences;
