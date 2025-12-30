import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { SendInvoiceButton } from "@/components/worker/invoices/send-invoice-button";
import { getWorkerInvoiceById } from "@/server/services/invoices/worker";
import { InvoiceDocument } from "@/components/invoices/invoice-document";

export const metadata: Metadata = {
  title: "Detail faktúry · Pracovník · Warehouse Flex Portal",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkerInvoiceDetailPage({ params }: Props) {
  const session = await requireRole(UserRole.WORKER);
  const { id } = await params;

  const invoice = await getWorkerInvoiceById(session.user.id, id);
  if (!invoice) notFound();

  return (
    <AppShell
      title={`Faktúra ${invoice.invoiceNumber}`}
      subtitle={`${invoice.company.companyName} · €${invoice.totalEur}`}
      homeHref="/worker/invoices"
      actions={
        <Button asChild variant="outline">
          <Link href="/worker/invoices">Späť na faktúry</Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {invoice.status === "DRAFT" ? (
          <div className="rounded-3xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Faktúra je rozpracovaná. Pred odoslaním skontrolujte fakturačné údaje a potom ju odošlite firme.
            <p className="mt-2 text-xs text-muted-foreground">
              Odoslanie je možné najskôr 1. deň nasledujúceho mesiaca.
            </p>
            <div className="mt-3">
              <SendInvoiceButton invoiceId={invoice.id} />
            </div>
          </div>
        ) : null}
        <InvoiceDocument invoice={invoice} />
      </div>
    </AppShell>
  );
}
