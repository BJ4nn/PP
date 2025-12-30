import { prisma } from "@/server/db/client";
import { sendTransactionalEmail } from "@/server/services/mailer";

export const WORKER_CANCEL_DEADLINE_HOURS = 6;

export async function requireWorkerProfile(userId: string) {
  const worker = await prisma.workerProfile.findUnique({
    where: { userId },
  });
  if (!worker) {
    throw new Error("Worker profile not found");
  }
  if (!worker.onboardingComplete) {
    throw new Error("Worker onboarding incomplete");
  }
  return worker;
}

export async function requireCompanyProfile(userId: string) {
  const company = await prisma.companyProfile.findUnique({
    where: { userId },
  });
  if (!company) {
    throw new Error("Company profile not found");
  }
  if (!company.onboardingComplete) {
    throw new Error("Company onboarding incomplete");
  }
  return company;
}

export async function sendEmailToUser(
  userId: string,
  subject: string,
  text: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (user?.email) {
    await sendTransactionalEmail({ to: user.email, subject, text });
  }
}

