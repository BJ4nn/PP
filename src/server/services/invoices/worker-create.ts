import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { requireWorkerProfile } from "@/server/services/applications/shared";
import type { CreateInvoiceInput } from "@/lib/validators/invoices";
import { createInvoiceNumber, createVariableSymbol } from "./numbering";

type InvoiceLineData = {
  applicationId: string;
  jobTitle: string;
  startsAt: Date;
  endsAt: Date;
  hours: number;
  amountEur: number;
};

type InvoiceDraftInput = {
  worker: Awaited<ReturnType<typeof requireWorkerProfile>>;
  workerUser: { email: string | null } | null;
  companyId: string;
  linesData: InvoiceLineData[];
  totalEur: number;
  issuedAt: Date;
  dueAt: Date;
  period?: { month: number; year: number };
};

const amountForApplication = (app: { estimatedEarningsEur: number | null; job: { hourlyRate: unknown; durationHours: number | null } }) =>
  typeof app.estimatedEarningsEur === "number"
    ? app.estimatedEarningsEur
    : Math.round(Number(app.job.hourlyRate) * (app.job.durationHours ?? 0));

const buildInvoiceLines = (applications: Array<{
  id: string;
  estimatedEarningsEur: number | null;
  job: { title: string; startsAt: Date; endsAt: Date; durationHours: number | null; hourlyRate: unknown };
}>) =>
  applications
    .slice()
    .sort((a, b) => a.job.startsAt.getTime() - b.job.startsAt.getTime())
    .map((app) => ({
      applicationId: app.id,
      jobTitle: app.job.title,
      startsAt: app.job.startsAt,
      endsAt: app.job.endsAt,
      hours: app.job.durationHours ?? 0,
      amountEur: amountForApplication(app),
    }));

const buildInvoiceMeta = (input: {
  worker: Awaited<ReturnType<typeof requireWorkerProfile>>;
  workerUser: { email: string | null } | null;
  buyer:
    | {
        companyName: string;
        addressStreet: string;
        addressCity: string;
        addressZip: string;
        region: string;
        ico: string | null;
      }
    | null;
  variableSymbol: string;
  period?: { month: number; year: number };
}) => ({
  supplier: {
    name: input.worker.billingName ?? input.worker.name,
    street: input.worker.billingStreet ?? null,
    city: input.worker.city,
    zip: input.worker.billingZip ?? null,
    region: input.worker.region,
    email: input.workerUser?.email ?? null,
    phone: input.worker.phone ?? null,
    iban: input.worker.billingIban ?? null,
    ico: input.worker.billingIco ?? null,
    note: "Neplatca DPH",
  },
  buyer: input.buyer
    ? {
        name: input.buyer.companyName,
        street: input.buyer.addressStreet,
        city: input.buyer.addressCity,
        zip: input.buyer.addressZip,
        region: input.buyer.region,
        ico: input.buyer.ico ?? null,
      }
    : null,
  payment: {
    method: "BANK_TRANSFER",
    variableSymbol: input.variableSymbol,
  },
  period: input.period ?? null,
});

async function createInvoiceDraft(
  tx: Prisma.TransactionClient,
  input: InvoiceDraftInput,
) {
  let invoiceNumber = createInvoiceNumber(input.issuedAt);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await tx.invoice.findFirst({ where: { invoiceNumber } });
    if (!existing) break;
    invoiceNumber = createInvoiceNumber(input.issuedAt);
  }

  const variableSymbol = createVariableSymbol(input.issuedAt);

  const buyer = await tx.companyProfile.findUnique({
    where: { id: input.companyId },
    select: {
      companyName: true,
      addressStreet: true,
      addressCity: true,
      addressZip: true,
      region: true,
      ico: true,
    },
  });

  const meta = buildInvoiceMeta({
    worker: input.worker,
    workerUser: input.workerUser,
    buyer,
    variableSymbol,
    ...(input.period ? { period: input.period } : {}),
  });

  const invoice = await tx.invoice.create({
    data: {
      workerId: input.worker.id,
      companyId: input.companyId,
      invoiceNumber,
      status: "DRAFT",
      issuedAt: input.issuedAt,
      dueAt: input.dueAt,
      currency: "EUR",
      totalEur: input.totalEur,
      meta: meta as never,
    },
  });

  await tx.invoiceLine.createMany({
    data: input.linesData.map((line) => ({
      invoiceId: invoice.id,
      ...line,
    })),
  });

  return tx.invoice.findUniqueOrThrow({
    where: { id: invoice.id },
    include: { company: { select: { companyName: true } } },
  });
}

export async function createInvoiceForWorker(
  workerUserId: string,
  input: CreateInvoiceInput,
) {
  const worker = await requireWorkerProfile(workerUserId);
  const dueDays = input.dueDays ?? 14;
  const now = new Date();
  const dueAt = new Date(now.getTime() + dueDays * 24 * 60 * 60 * 1000);

  const workerUser = await prisma.user.findUnique({
    where: { id: workerUserId },
    select: { email: true },
  });

  const applications = await prisma.jobApplication.findMany({
    where: {
      id: { in: input.applicationIds },
      workerId: worker.id,
      status: "CONFIRMED",
      workedConfirmedAt: { not: null },
      invoiceLine: null,
    },
    include: {
      job: { include: { company: { select: { id: true } } } },
    },
  });

  if (applications.length !== input.applicationIds.length) {
    throw new Error("Niektoré smeny nie sú dostupné na fakturáciu.");
  }

  const companyIds = Array.from(new Set(applications.map((a) => a.job.company.id)));
  if (companyIds.length !== 1) {
    throw new Error("Vybrané smeny musia patriť jednej firme.");
  }

  const linesData = buildInvoiceLines(applications);
  const totalEur = linesData.reduce((sum, line) => sum + line.amountEur, 0);

  return prisma.$transaction(async (tx) =>
    createInvoiceDraft(tx, {
      worker,
      workerUser,
      companyId: companyIds[0]!,
      linesData,
      totalEur,
      issuedAt: now,
      dueAt,
    }),
  );
}

export async function createMonthlyInvoicesForWorker(
  workerUserId: string,
  selection?: { month: number; year: number },
) {
  const worker = await requireWorkerProfile(workerUserId);
  const now = new Date();
  const { start, end, month, year } = getMonthlyRange(now, selection);

  const applications = await prisma.jobApplication.findMany({
    where: {
      workerId: worker.id,
      status: "CONFIRMED",
      workedConfirmedAt: { not: null },
      invoiceLine: null,
      job: { endsAt: { gte: start, lt: end } },
    },
    include: {
      job: { include: { company: { select: { id: true, companyName: true } } } },
    },
    orderBy: { job: { startsAt: "asc" } },
    take: 500,
  });

  if (applications.length === 0) {
    throw new Error("Za vybraný mesiac nemáte žiadne smeny pripravené na fakturáciu.");
  }

  const workerUser = await prisma.user.findUnique({
    where: { id: workerUserId },
    select: { email: true },
  });

  const grouped = new Map<string, typeof applications>();
  for (const app of applications) {
    const companyId = app.job.company.id;
    const current = grouped.get(companyId) ?? [];
    current.push(app);
    grouped.set(companyId, current);
  }

  const dueAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const created = [] as Array<{ id: string; companyName: string }>;

    for (const group of grouped.values()) {
      const companyId = group[0]?.job.company.id;
      const companyName = group[0]?.job.company.companyName;
      if (!companyId || !companyName) continue;

      const linesData = buildInvoiceLines(group);
      const totalEur = linesData.reduce((sum, line) => sum + line.amountEur, 0);

      const invoice = await createInvoiceDraft(tx, {
        worker,
        workerUser,
        companyId,
        linesData,
        totalEur,
        issuedAt: now,
        dueAt,
        period: { month, year },
      });

      created.push({ id: invoice.id, companyName });
    }

    if (created.length === 0) {
      throw new Error("Za vybraný mesiac nemáte žiadne smeny pripravené na fakturáciu.");
    }

    return { created, month, year };
  });
}

function getMonthlyRange(
  now: Date,
  selection?: { month: number; year: number },
) {
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!selection) {
    const prevMonthStart = new Date(
      currentMonthStart.getFullYear(),
      currentMonthStart.getMonth() - 1,
      1,
    );
    const prevMonthEnd = new Date(
      currentMonthStart.getFullYear(),
      currentMonthStart.getMonth(),
      1,
    );
    return {
      start: prevMonthStart,
      end: prevMonthEnd,
      month: prevMonthStart.getMonth() + 1,
      year: prevMonthStart.getFullYear(),
    };
  }

  const { month, year } = selection;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  if (monthEnd > currentMonthStart) {
    throw new Error("Faktúry je možné vytvoriť len za ukončené mesiace.");
  }

  return {
    start: monthStart,
    end: monthEnd,
    month,
    year,
  };
}
