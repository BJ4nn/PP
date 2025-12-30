import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { getCompanyInvoiceById } from "@/server/services/invoices/company";
import { InvoiceDocument } from "@/components/invoices/invoice-document";

export const metadata: Metadata = {
  title: "Detail faktúry · Firma · Warehouse Flex Portal",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CompanyInvoiceDetailPage({ params }: Props) {
  const session = await requireRole(UserRole.COMPANY);
  const { id } = await params;

  const invoice = await getCompanyInvoiceById(session.user.id, id);
  if (!invoice) notFound();

  return (
    <AppShell
      title={`Faktúra ${invoice.invoiceNumber}`}
      subtitle={`${invoice.worker.name} · €${invoice.totalEur}`}
      homeHref="/company/invoices"
    >
      <InvoiceDocument invoice={invoice} />
    </AppShell>
  );
}
