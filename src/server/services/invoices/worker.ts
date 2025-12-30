import { prisma } from "@/server/db/client";
import { requireWorkerProfile } from "@/server/services/applications/shared";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { createVariableSymbol } from "./numbering";

type EligibleInvoiceItem = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  startsAtIso: string;
  endsAtIso: string;
  hours: number;
  amountEur: number;
};

export type WorkerEligibleInvoicesByCompany = Array<{
  companyId: string;
  companyName: string;
  items: EligibleInvoiceItem[];
  totalEur: number;
}>;

export async function listWorkerInvoices(workerUserId: string) {
  const worker = await requireWorkerProfile(workerUserId);
  return prisma.invoice.findMany({
    where: { workerId: worker.id },
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { companyName: true } },
      lines: { orderBy: { startsAt: "asc" } },
    },
  });
}

export async function getWorkerInvoiceById(workerUserId: string, invoiceId: string) {
  const worker = await requireWorkerProfile(workerUserId);
  return prisma.invoice.findFirst({
    where: { id: invoiceId, workerId: worker.id },
    include: {
      company: { select: { companyName: true, addressCity: true, region: true } },
      worker: { select: { name: true, city: true, region: true } },
      lines: { orderBy: { startsAt: "asc" } },
    },
  });
}

export async function getEligibleInvoiceItemsForWorker(
  workerUserId: string,
): Promise<WorkerEligibleInvoicesByCompany> {
  const worker = await requireWorkerProfile(workerUserId);

  const applications = await prisma.jobApplication.findMany({
    where: {
      workerId: worker.id,
      status: "CONFIRMED",
      workedConfirmedAt: { not: null },
      invoiceLine: null,
    },
    include: {
      job: {
        include: {
          company: { select: { id: true, companyName: true } },
        },
      },
    },
    orderBy: { workedConfirmedAt: "desc" },
    take: 100,
  });

  const byCompany = new Map<
    string,
    { companyId: string; companyName: string; items: EligibleInvoiceItem[]; totalEur: number }
  >();

  for (const app of applications) {
    const companyId = app.job.company.id;
    const companyName = app.job.company.companyName;
    const amountEur =
      typeof app.estimatedEarningsEur === "number"
        ? app.estimatedEarningsEur
        : Math.round(Number(app.job.hourlyRate) * (app.job.durationHours ?? 0));

    const entry =
      byCompany.get(companyId) ??
      {
        companyId,
        companyName,
        items: [],
        totalEur: 0,
      };

    entry.items.push({
      applicationId: app.id,
      jobId: app.jobId,
      jobTitle: app.job.title,
      startsAtIso: app.job.startsAt.toISOString(),
      endsAtIso: app.job.endsAt.toISOString(),
      hours: app.job.durationHours ?? 0,
      amountEur,
    });
    entry.totalEur += amountEur;
    byCompany.set(companyId, entry);
  }

  return Array.from(byCompany.values()).sort((a, b) =>
    a.companyName.localeCompare(b.companyName, "sk"),
  );
}

type InvoiceLineSummary = {
  endsAt: Date;
};

export async function sendWorkerInvoice(workerUserId: string, invoiceId: string) {
  const worker = await requireWorkerProfile(workerUserId);

  if (!worker.billingName || !worker.billingStreet || !worker.billingZip || !worker.billingIban) {
    throw new Error("Doplňte fakturačné údaje (meno, adresa, IBAN) v sekcii Fakturácia.");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, workerId: worker.id },
    include: {
      company: {
        select: {
          companyName: true,
          addressStreet: true,
          addressCity: true,
          addressZip: true,
          region: true,
          ico: true,
        },
      },
      lines: { select: { endsAt: true } },
    },
  });
  if (!invoice) throw new Error("Invoice not found");
  if (invoice.status !== "DRAFT") {
    throw new Error("Invoice is already sent");
  }

  const notBefore = getInvoiceSendNotBefore(invoice.lines);
  if (notBefore && new Date() < notBefore) {
    throw new Error(
      `Faktúru je možné odoslať najskôr ${format(notBefore, "d MMM yyyy", { locale: sk })}.`,
    );
  }

  const workerUser = await prisma.user.findUnique({
    where: { id: workerUserId },
    select: { email: true },
  });
  const existingMeta = (invoice.meta ?? {}) as Record<string, unknown>;
  const payment = (existingMeta.payment ?? {}) as Record<string, unknown>;
  const variableSymbol =
    typeof payment.variableSymbol === "string" && payment.variableSymbol.length > 0
      ? payment.variableSymbol
      : createVariableSymbol(invoice.issuedAt);

  const meta = {
    supplier: {
      name: worker.billingName,
      street: worker.billingStreet,
      city: worker.city,
      zip: worker.billingZip,
      region: worker.region,
      email: workerUser?.email ?? null,
      phone: worker.phone ?? null,
      iban: worker.billingIban,
      ico: worker.billingIco ?? null,
      note: "Neplatca DPH",
    },
    buyer: {
      name: invoice.company.companyName,
      street: invoice.company.addressStreet,
      city: invoice.company.addressCity,
      zip: invoice.company.addressZip,
      region: invoice.company.region,
      ico: invoice.company.ico ?? null,
    },
    payment: {
      method: "BANK_TRANSFER",
      variableSymbol,
    },
  } as const;

  return prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "SENT", meta: meta as never },
  });
}

export { createInvoiceForWorker, createMonthlyInvoicesForWorker } from "./worker-create";

function getInvoiceSendNotBefore(lines: InvoiceLineSummary[]) {
  if (lines.length === 0) return null;
  const lastEnd = lines.reduce(
    (latest, line) => (line.endsAt > latest ? line.endsAt : latest),
    lines[0].endsAt,
  );
  return new Date(lastEnd.getFullYear(), lastEnd.getMonth() + 1, 1);
}
