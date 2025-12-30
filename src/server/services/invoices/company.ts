import { prisma } from "@/server/db/client";
import { getCompanyProfileByUserId } from "@/server/services/company";

export async function listCompanyInvoices(companyUserId: string) {
  const company = await getCompanyProfileByUserId(companyUserId);
  if (!company) throw new Error("Company profile not found");

  return prisma.invoice.findMany({
    where: { companyId: company.id, status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
    include: {
      worker: { select: { name: true, city: true, region: true } },
      lines: { orderBy: { startsAt: "asc" } },
    },
  });
}

export async function getCompanyInvoiceById(companyUserId: string, invoiceId: string) {
  const company = await getCompanyProfileByUserId(companyUserId);
  if (!company) throw new Error("Company profile not found");

  return prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id, status: { not: "DRAFT" } },
    include: {
      worker: { select: { name: true, city: true, region: true } },
      company: { select: { companyName: true, addressCity: true, region: true } },
      lines: { orderBy: { startsAt: "asc" } },
    },
  });
}
