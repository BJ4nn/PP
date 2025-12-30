import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { getCompanyContractTemplate } from "@/server/services/contracts";
import { AppShell } from "@/components/layout/app-shell";
import { ContractTemplateForm } from "@/components/company/contract-template-form";

export const metadata: Metadata = {
  title: "Šablóna zmluvy (Beta) · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

export default async function CompanyContractTemplatePage() {
  const session = await requireRole(UserRole.COMPANY);
  const profile = await getCompanyProfileByUserId(session.user.id);
  if (!profile?.onboardingComplete) redirect("/company/onboarding");

  const template = await getCompanyContractTemplate(session.user.id);

  return (
    <AppShell
      title="Šablóna zmluvy (Beta)"
      subtitle="Upravte text, ktorý sa automaticky vloží do zmluvy medzi firmou a pracovníkom."
      homeHref="/company/contracts"
    >
      <ContractTemplateForm
        initialTemplate={{
          title: template.title,
          intro: template.intro ?? "",
          workplaceRules: template.workplaceRules ?? "",
          customTerms: template.customTerms ?? "",
          isActive: template.isActive ?? true,
        }}
      />
    </AppShell>
  );
}

