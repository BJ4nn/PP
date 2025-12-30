import { prisma } from "@/server/db/client";
import { requireCompanyProfile } from "@/server/services/applications/shared";
import type { UpsertContractTemplateInput } from "@/lib/validators/contracts";

export const SYSTEM_DEFAULT_CONTRACT_TEMPLATE = {
  title: "Objednávka práce (Beta)",
  intro:
    "Tento dokument slúži ako jednoduché potvrdenie podmienok na konkrétnu smenu.\n" +
    "Portál poskytuje nástroj na vytvorenie a archiváciu; zmluvné strany sú firma a pracovník.",
  workplaceRules:
    "Dostavte sa prosím 10 minút vopred.\n" +
    "Prineste si potrebné doklady a riaďte sa pokynmi zodpovednej osoby.",
  customTerms:
    "Odmena je dohodnutá ako hodinová sadzba uvedená pri smene.\n" +
    "Prípadné storno pravidlá sa riadia nastaveniami smeny (notice).",
};

export async function getCompanyContractTemplate(companyUserId: string) {
  const company = await requireCompanyProfile(companyUserId);
  const existing = await prisma.contractTemplate.findUnique({
    where: { companyId: company.id },
  });
  return existing ?? { ...SYSTEM_DEFAULT_CONTRACT_TEMPLATE, id: null, companyId: company.id, isActive: true };
}

export async function upsertCompanyContractTemplate(
  companyUserId: string,
  input: UpsertContractTemplateInput,
) {
  const company = await requireCompanyProfile(companyUserId);
  const data = {
    title: input.title,
    intro: input.intro?.trim() || null,
    workplaceRules: input.workplaceRules?.trim() || null,
    customTerms: input.customTerms?.trim() || null,
    isActive: input.isActive ?? true,
  };

  return prisma.contractTemplate.upsert({
    where: { companyId: company.id },
    create: { companyId: company.id, ...data },
    update: data,
  });
}
