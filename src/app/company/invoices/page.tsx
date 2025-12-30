import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { listCompanyInvoices } from "@/server/services/invoices/company";
import { AppShell } from "@/components/layout/app-shell";
import { CompanyInvoicesList } from "@/components/company/invoices/company-invoices-list";

export const metadata: Metadata = {
  title: "Prijaté faktúry · Firma · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

export default async function CompanyInvoicesPage() {
  const session = await requireRole(UserRole.COMPANY);
  const profile = await getCompanyProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) {
    redirect("/company/onboarding");
  }

  const invoices = await listCompanyInvoices(session.user.id);

  return (
    <AppShell
      title="Prijaté faktúry (Beta)"
      subtitle="Prehľad faktúr od pracovníkov."
      homeHref="/company/dashboard"
    >
      <CompanyInvoicesList invoices={invoices} />
    </AppShell>
  );
}
