import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { CompanyOnboardingForm } from "@/components/company/company-onboarding-form";
import { AppShell } from "@/components/layout/app-shell";
import type { CompanyOnboardingInput } from "@/lib/validators/onboarding";

export const metadata: Metadata = {
  title: "Profil skladu · Warehouse Flex Portal",
};

export default async function CompanyOnboardingPage() {
  const session = await requireRole(UserRole.COMPANY);
  const profile = await getCompanyProfileByUserId(session.user.id);

  let initialValues: CompanyOnboardingInput | undefined;
  if (profile) {
    initialValues = {
      companyName: profile.companyName ?? "",
      siteName: profile.siteName ?? "",
      ico: profile.ico ?? "",
      addressStreet: profile.addressStreet ?? "",
      addressCity: profile.addressCity ?? "",
      addressZip: profile.addressZip ?? "",
      contactName: profile.contactName ?? "",
      contactPhone: profile.contactPhone ?? "",
      warehouseType: profile.warehouseType,
      region: profile.region,
    };
  }

  return (
    <AppShell
      title="Nastavenie profilu skladu"
      subtitle="Uveďte kontaktné údaje, aby pracovníci vedeli, kam majú ísť. Údaje môžete neskôr upraviť."
      homeHref="/company/dashboard"
    >
      <CompanyOnboardingForm initialValues={initialValues} />
    </AppShell>
  );
}
