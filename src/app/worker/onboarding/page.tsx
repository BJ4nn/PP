import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getWorkerProfileByUserId } from "@/server/services/worker";
import { WorkerOnboardingForm } from "@/components/worker/worker-onboarding-form";
import { AppShell } from "@/components/layout/app-shell";
import type { WorkerOnboardingInput } from "@/lib/validators/onboarding";

export const metadata: Metadata = {
  title: "Profil pracovníka · Warehouse Flex Portal",
};

export default async function WorkerOnboardingPage() {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);

  let initialValues: WorkerOnboardingInput | undefined;
  if (profile) {
    const rawAvailability = profile.availabilityJson as
      | WorkerOnboardingInput["availability"]
      | undefined
      | null;
    const availability: WorkerOnboardingInput["availability"] = {
      daysOfWeek: Array.isArray(rawAvailability?.daysOfWeek)
        ? rawAvailability.daysOfWeek
        : [],
      shiftTypes: Array.isArray(rawAvailability?.shiftTypes)
        ? rawAvailability.shiftTypes
        : [],
    };
    initialValues = {
      fullName: profile.name ?? "",
      phone: profile.phone ?? "",
      city: profile.city ?? "",
      region: profile.region,
      hasTradeLicense: profile.hasTradeLicense,
      experienceLevel: profile.experienceLevel,
      hasVzv: profile.hasVZV,
      hasBozp: profile.hasBOZP,
      hasFoodCard: profile.hasFoodCard,
      hasCar: profile.hasCar,
      availability,
      preferredContractType: profile.preferredContractType ?? null,
      minHourlyRate: profile.minHourlyRate
        ? Number(profile.minHourlyRate)
        : undefined,
      minHourlyRateEmployment: profile.minHourlyRateEmployment
        ? Number(profile.minHourlyRateEmployment)
        : undefined,
    };
  }

  return (
    <AppShell
      title="Nastavenie profilu pracovníka"
      subtitle="Vyplňte svoje skúsenosti a preferencie. Dá sa to kedykoľvek upraviť."
      homeHref="/worker/dashboard"
    >
      <WorkerOnboardingForm initialValues={initialValues} />
    </AppShell>
  );
}
