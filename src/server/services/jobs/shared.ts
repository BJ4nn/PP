import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { ExperienceLevel } from "@/types";

export const EXPERIENCE_ORDER: ExperienceLevel[] = [
  ExperienceLevel.NONE,
  ExperienceLevel.BASIC,
  ExperienceLevel.INTERMEDIATE,
  ExperienceLevel.ADVANCED,
];

export async function requireCompany(
  userId: string,
  options?: { ensureApproved?: boolean },
) {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Company profile not found");
  }
  if (!profile.onboardingComplete) {
    throw new Error("Finish company onboarding first");
  }
  if (options?.ensureApproved !== false && !profile.isApproved) {
    throw new Error("Company profile not approved");
  }

  return profile;
}

export async function requireWorker(userId: string) {
  const profile = await prisma.workerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new Error("Worker profile not found");
  }
  if (!profile.onboardingComplete) {
    throw new Error("Finish worker onboarding first");
  }

  return profile;
}

export function calculateEndsAt(startsAt: Date, durationHours: number) {
  return new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);
}

export function hasRequiredExperience(
  workerLevel: ExperienceLevel,
  required?: ExperienceLevel | null,
) {
  if (!required) return true;
  return (
    EXPERIENCE_ORDER.indexOf(workerLevel) >= EXPERIENCE_ORDER.indexOf(required)
  );
}

export function allowedExperienceLevels(level: ExperienceLevel) {
  const idx = EXPERIENCE_ORDER.indexOf(level);
  return EXPERIENCE_ORDER.slice(0, idx + 1);
}

export type WorkerForScoring = Awaited<ReturnType<typeof requireWorker>>;

export type JobForScoring = Prisma.JobGetPayload<{
  include: { company: true };
}>;

