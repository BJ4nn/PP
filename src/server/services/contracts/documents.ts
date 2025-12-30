import { createHash } from "node:crypto";
import { createNotificationForUser } from "@/server/services/notifications";
import { prisma } from "@/server/db/client";
import type { Prisma } from "@prisma/client";
import { ContractStatus, NotificationType } from "@/types";
import { requireCompanyProfile, requireWorkerProfile } from "@/server/services/applications/shared";
import { renderContractText } from "@/server/services/contracts/render";
import { SYSTEM_DEFAULT_CONTRACT_TEMPLATE } from "@/server/services/contracts/template";

const SIGN_DEADLINE_BUFFER_MS = 60 * 60 * 1000;

function signatureSha256(signature: unknown) {
  return createHash("sha256").update(JSON.stringify(signature)).digest("hex");
}

export async function getOrCreateContractForApplication(applicationId: string) {
  const existing = await prisma.contractDocument.findUnique({
    where: { applicationId },
  });
  if (existing) return existing;

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      worker: true,
      job: { include: { company: true } },
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  const template = await prisma.contractTemplate.findUnique({
    where: { companyId: application.job.companyId },
  });
  const usedTemplate = template?.isActive
    ? template
    : { ...SYSTEM_DEFAULT_CONTRACT_TEMPLATE };

  const titleSnapshot = usedTemplate.title;
  const bodySnapshot = renderContractText({
    company: application.job.company,
    worker: application.worker,
    job: application.job,
    template: usedTemplate,
  });
  const documentSha256 = createHash("sha256")
    .update(`${titleSnapshot}\n\n${bodySnapshot}`)
    .digest("hex");

  const doc = await prisma.contractDocument.create({
    data: {
      companyId: application.job.companyId,
      workerId: application.workerId,
      jobId: application.jobId,
      applicationId: application.id,
      ...(template?.isActive ? { templateId: template.id } : {}),
      status: ContractStatus.PENDING_COMPANY,
      titleSnapshot,
      bodySnapshot,
      documentSha256,
    },
  });

  await createNotificationForUser(
    application.job.company.userId,
    NotificationType.COMPANY_CONTRACT_READY,
    {
      contractId: doc.id,
      jobId: application.jobId,
      applicationId: application.id,
      jobTitle: application.job.title,
      workerName: application.worker.name,
    },
  );

  return doc;
}

export async function listCompanyContracts(companyUserId: string) {
  const company = await requireCompanyProfile(companyUserId);
  return prisma.contractDocument.findMany({
    where: { companyId: company.id },
    include: {
      worker: { select: { id: true, name: true, city: true } },
      job: { select: { id: true, title: true, startsAt: true, endsAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getCompanyContract(companyUserId: string, contractId: string) {
  const company = await requireCompanyProfile(companyUserId);
  const doc = await prisma.contractDocument.findFirst({
    where: { id: contractId, companyId: company.id },
    include: {
      worker: { select: { id: true, name: true, city: true } },
      job: { select: { id: true, title: true, startsAt: true, endsAt: true } },
    },
  });
  if (!doc) throw new Error("Contract not found");
  return doc;
}

export async function listWorkerContracts(workerUserId: string) {
  const worker = await requireWorkerProfile(workerUserId);
  return prisma.contractDocument.findMany({
    where: { workerId: worker.id },
    include: {
      job: { include: { company: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getWorkerContract(workerUserId: string, contractId: string) {
  const worker = await requireWorkerProfile(workerUserId);
  const doc = await prisma.contractDocument.findFirst({
    where: { id: contractId, workerId: worker.id },
    include: {
      job: { include: { company: true } },
    },
  });
  if (!doc) throw new Error("Contract not found");
  return doc;
}

export async function workerSignContract(
  workerUserId: string,
  contractId: string,
  signatureName: string,
  signature: unknown,
  requestMeta?: { ip?: string | null; userAgent?: string | null },
) {
  const worker = await requireWorkerProfile(workerUserId);
  const doc = await prisma.contractDocument.findFirst({
    where: { id: contractId, workerId: worker.id },
    include: { worker: true, job: { include: { company: true } } },
  });
  if (!doc) throw new Error("Contract not found");
  if (doc.status === ContractStatus.VOID) throw new Error("Contract is void");
  if (doc.workerSignedAt) return doc;
  if (!doc.companySignedAt) {
    throw new Error("Contract must be signed by the company first");
  }
  const deadline = doc.job.startsAt.getTime() - SIGN_DEADLINE_BUFFER_MS;
  if (Date.now() >= deadline) {
    throw new Error("Cannot sign after deadline");
  }

  const updated = await prisma.contractDocument.update({
    where: { id: doc.id },
    data: {
      workerSignedAt: new Date(),
      workerSignatureName: signatureName.trim(),
      workerSignatureJson: signature as Prisma.InputJsonValue,
      workerSignatureSha256: signatureSha256(signature),
      workerSignedIp: requestMeta?.ip ?? null,
      workerSignedUserAgent: requestMeta?.userAgent ?? null,
      status: ContractStatus.COMPLETED,
    },
  });

  await createNotificationForUser(
    doc.job.company.userId,
    NotificationType.COMPANY_CONTRACT_COMPLETED,
    {
      contractId: doc.id,
      jobId: doc.jobId,
      applicationId: doc.applicationId,
      jobTitle: doc.job.title,
      workerName: doc.worker.name,
    },
  );

  return updated;
}

export async function companySignContract(
  companyUserId: string,
  contractId: string,
  signatureName: string,
  signature: unknown,
  requestMeta?: { ip?: string | null; userAgent?: string | null },
) {
  const company = await requireCompanyProfile(companyUserId);
  const doc = await prisma.contractDocument.findFirst({
    where: { id: contractId, companyId: company.id },
    include: { job: { include: { company: true } }, worker: true },
  });
  if (!doc) throw new Error("Contract not found");
  if (doc.status === ContractStatus.VOID) throw new Error("Contract is void");
  if (doc.companySignedAt) return doc;

  const deadline = doc.job.startsAt.getTime() - SIGN_DEADLINE_BUFFER_MS;
  if (Date.now() >= deadline) {
    throw new Error("Cannot sign after deadline");
  }

  const nextStatus = doc.workerSignedAt
    ? ContractStatus.COMPLETED
    : ContractStatus.SIGNED_BY_COMPANY;

  const updated = await prisma.contractDocument.update({
    where: { id: doc.id },
    data: {
      companySignedAt: new Date(),
      companySignatureName: signatureName.trim(),
      companySignatureJson: signature as Prisma.InputJsonValue,
      companySignatureSha256: signatureSha256(signature),
      companySignedIp: requestMeta?.ip ?? null,
      companySignedUserAgent: requestMeta?.userAgent ?? null,
      status: nextStatus,
    },
  });

  if (!doc.workerSignedAt) {
    // Worker is already notified on application confirmation (with contractId).
  }

  return updated;
}
