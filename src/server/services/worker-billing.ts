import { prisma } from "@/server/db/client";
import type { WorkerBillingInput } from "@/lib/validators/worker-billing";
import { requireWorkerProfile } from "@/server/services/applications/shared";

export async function getWorkerBillingByUserId(userId: string) {
  const worker = await requireWorkerProfile(userId);
  return {
    billingName: worker.billingName ?? worker.name,
    billingStreet: worker.billingStreet ?? "",
    billingZip: worker.billingZip ?? "",
    billingIban: worker.billingIban ?? "",
    billingIco: worker.billingIco ?? null,
    hasTradeLicense: worker.hasTradeLicense,
    city: worker.city,
    region: worker.region,
  };
}

export async function updateWorkerBilling(userId: string, input: WorkerBillingInput) {
  const worker = await requireWorkerProfile(userId);
  return prisma.workerProfile.update({
    where: { id: worker.id },
    data: {
      billingName: input.billingName,
      billingStreet: input.billingStreet,
      billingZip: input.billingZip,
      billingIban: input.billingIban,
      billingIco: input.billingIco ?? null,
    },
  });
}

