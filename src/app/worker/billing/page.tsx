import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getWorkerProfileByUserId } from "@/server/services/worker";
import { getWorkerBillingByUserId } from "@/server/services/worker-billing";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { WorkerBillingForm } from "@/components/worker/worker-billing-form";
import type { WorkerBillingInput } from "@/lib/validators/worker-billing";

export const metadata: Metadata = {
  title: "Fakturácia · Pracovník · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

export default async function WorkerBillingPage() {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) {
    redirect("/worker/onboarding");
  }

  const billing = await getWorkerBillingByUserId(session.user.id);

  const initialValues: WorkerBillingInput = {
    billingName: billing.billingName,
    billingStreet: billing.billingStreet,
    billingZip: billing.billingZip,
    billingIban: billing.billingIban,
    billingIco: billing.billingIco,
  };

  return (
    <AppShell
      title="Fakturácia (Beta)"
      subtitle="Doplňte údaje, ktoré sa zobrazia na faktúrach."
      homeHref="/worker/dashboard"
      actions={
        <Button asChild variant="outline">
          <Link href="/worker/invoices">Späť na faktúry</Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          Tip: tieto údaje sa použijú ako „Dodávateľ“ na faktúre. Firma bude uvedená ako „Odberateľ“.
        </div>
        <WorkerBillingForm
          initialValues={initialValues}
          hasTradeLicense={billing.hasTradeLicense}
        />
      </div>
    </AppShell>
  );
}

