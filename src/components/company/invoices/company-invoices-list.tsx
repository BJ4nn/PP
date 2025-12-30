import Link from "next/link";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  status: string;
  issuedAt: Date;
  dueAt: Date;
  totalEur: number;
  worker: { name: string; city: string; region: string };
};

function labelStatus(status: string) {
  if (status === "SENT") return "Odoslaná";
  if (status === "PAID") return "Zaplatená";
  if (status === "VOID") return "Stornovaná";
  if (status === "DRAFT") return "Rozpracovaná";
  return status;
}

export function CompanyInvoicesList({ invoices }: { invoices: InvoiceListItem[] }) {
  if (invoices.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        Zatiaľ nemáte žiadne prijaté faktúry.
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Faktúry</h2>
      <div className="mt-4 space-y-2">
        {invoices.map((inv) => (
          <Link
            key={inv.id}
            href={`/company/invoices/${inv.id}`}
            className="block rounded-2xl border border-border bg-background p-4 hover:border-primary/60"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {inv.invoiceNumber} · {inv.worker.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inv.worker.city}, {inv.worker.region} · vystavené{" "}
                  {format(inv.issuedAt, "d MMM yyyy", { locale: sk })} · splatnosť{" "}
                  {format(inv.dueAt, "d MMM yyyy", { locale: sk })}
                </p>
              </div>
              <p className="text-xs font-semibold text-foreground">
                €{inv.totalEur} · {labelStatus(inv.status)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
