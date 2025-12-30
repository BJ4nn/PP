import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { format, subMonths } from "date-fns";
import { sk } from "date-fns/locale";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getWorkerProfileByUserId } from "@/server/services/worker";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { WorkerMonthlyInvoiceButton } from "@/components/worker/invoices/worker-monthly-invoice-button";
import {
  getEligibleInvoiceItemsForWorker,
  listWorkerInvoices,
} from "@/server/services/invoices/worker";
import { WorkerInvoicesPanel } from "@/components/worker/invoices/worker-invoices-panel";

export const metadata: Metadata = {
  title: "Faktúry · Pracovník · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

export default async function WorkerInvoicesPage() {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) {
    redirect("/worker/onboarding");
  }

  const [eligible, invoices] = await Promise.all([
    getEligibleInvoiceItemsForWorker(session.user.id),
    listWorkerInvoices(session.user.id),
  ]);

  const invoiceClient = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    status: inv.status,
    issuedAt: inv.issuedAt,
    dueAt: inv.dueAt,
    totalEur: inv.totalEur,
    company: inv.company,
  }));
  const now = new Date();
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const date = subMonths(now, index + 1);
    return {
      label: format(date, "LLLL yyyy", { locale: sk }),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  });

  return (
    <AppShell
      title="Faktúry (Beta)"
      subtitle="Vytvorte a sledujte faktúry za odpracované smeny."
      homeHref="/worker/dashboard"
      actions={
        <Button asChild variant="outline">
          <Link href="/worker/dashboard">Späť na panel</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Mesačné faktúry</h2>
              <p className="text-sm text-muted-foreground">
                Systém rozdelí smeny podľa firiem a vytvorí samostatné faktúry.
              </p>
            </div>
            <WorkerMonthlyInvoiceButton options={monthOptions} />
          </div>
        </section>
        <WorkerInvoicesPanel eligible={eligible} invoices={invoiceClient} />
      </div>
    </AppShell>
  );
}
