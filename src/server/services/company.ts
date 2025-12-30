import { prisma } from "@/server/db/client";
import type { CompanyOnboardingInput } from "@/lib/validators/onboarding";

export async function getCompanyProfileByUserId(userId: string) {
  return prisma.companyProfile.findUnique({
    where: { userId },
  });
}

export async function getCompanyProfileById(id: string) {
  return prisma.companyProfile.findUnique({
    where: { id },
  });
}

export async function completeCompanyOnboarding(
  userId: string,
  input: CompanyOnboardingInput,
) {
  return prisma.companyProfile.upsert({
    where: { userId },
    update: {
      companyName: input.companyName,
      ...(input.siteName !== undefined ? { siteName: input.siteName } : {}),
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      addressStreet: input.addressStreet,
      addressCity: input.addressCity,
      addressZip: input.addressZip,
      region: input.region,
      warehouseType: input.warehouseType,
      ...(input.ico !== undefined ? { ico: input.ico } : {}),
      onboardingComplete: true,
    },
    create: {
      userId,
      companyName: input.companyName,
      ...(input.siteName !== undefined ? { siteName: input.siteName } : {}),
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      addressStreet: input.addressStreet,
      addressCity: input.addressCity,
      addressZip: input.addressZip,
      region: input.region,
      warehouseType: input.warehouseType,
      ...(input.ico !== undefined ? { ico: input.ico } : {}),
      onboardingComplete: true,
    },
  });
}

export async function setCompanyApproval({
  companyId,
  approved,
}: {
  companyId: string;
  approved: boolean;
}) {
  return prisma.companyProfile.update({
    where: { id: companyId },
    data: { isApproved: approved },
  });
}

export async function rejectCompanyProfile({ companyId }: { companyId: string }) {
  return prisma.companyProfile.update({
    where: { id: companyId },
    data: {
      isApproved: false,
      onboardingComplete: false,
    },
  });
}

export async function setCompanyAdvancedMode({
  companyId,
  enabled,
}: {
  companyId: string;
  enabled: boolean;
}) {
  return prisma.companyProfile.update({
    where: { id: companyId },
    data: { advancedModeEnabled: enabled },
  });
}

export async function updateCompanyNarrowCollaborationCutoff(
  userId: string,
  cutoffHour: number,
) {
  const company = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true, onboardingComplete: true, advancedModeEnabled: true },
  });
  if (!company || !company.onboardingComplete) {
    throw new Error("Company profile not found");
  }
  if (!company.advancedModeEnabled) {
    throw new Error("Advanced mode nie je aktivny.");
  }

  return prisma.companyProfile.update({
    where: { id: company.id },
    data: { narrowCollaborationCutoffHour: cutoffHour },
  });
}
