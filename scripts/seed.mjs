import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { seedDemoMorningShiftsForNextWeek } from "./seed-demo-shifts.mjs";
import { seedDemoWarehouseCompaniesAndShifts } from "./seed-demo-warehouse-companies.mjs";

function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const prisma = new PrismaClient();

async function upsertWorker(prismaClient, { email, profile, passwordHash }) {
  return prismaClient.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "WORKER",
      workerProfile: {
        upsert: {
          update: profile,
          create: profile,
        },
      },
    },
    create: {
      email,
      passwordHash,
      role: "WORKER",
      workerProfile: { create: profile },
    },
  });
}

async function main() {
  const password = process.env.DEV_SEED_PASSWORD || "Heslo123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: "admin@demo.local" },
    update: {
      passwordHash,
      role: "ADMIN",
    },
    create: {
      email: "admin@demo.local",
      passwordHash,
      role: "ADMIN",
    },
  });

  const workerDefs = [
    {
      email: "worker@demo.local",
      profile: {
        name: "Demo Worker",
        phone: "+421900000000",
        city: "Bratislava",
        region: "BA",
        availabilityJson: { daysOfWeek: [], shiftTypes: [] },
        onboardingComplete: true,
        isReady: true,
      },
    },
    {
      email: "worker2@demo.local",
      profile: {
        name: "Demo Worker 2",
        phone: "+421900000002",
        city: "Bratislava",
        region: "BA",
        availabilityJson: { daysOfWeek: [], shiftTypes: [] },
        onboardingComplete: true,
        isReady: true,
      },
    },
    {
      email: "worker3@demo.local",
      profile: {
        name: "Demo Worker 3",
        phone: "+421900000003",
        city: "Senec",
        region: "SENEC",
        availabilityJson: { daysOfWeek: [], shiftTypes: [] },
        onboardingComplete: true,
        isReady: true,
      },
    },
    {
      email: "worker4@demo.local",
      profile: {
        name: "Demo Worker 4",
        phone: "+421900000004",
        city: "Trnava",
        region: "TRNAVA",
        availabilityJson: { daysOfWeek: [], shiftTypes: [] },
        onboardingComplete: true,
        isReady: true,
      },
    },
  ];

  const workerUsers = await Promise.all(
    workerDefs.map((w) =>
      upsertWorker(prisma, { email: w.email, profile: w.profile, passwordHash }),
    ),
  );
  const workerUser = workerUsers.find((u) => u.email === "worker@demo.local");
  const worker2User = workerUsers.find((u) => u.email === "worker2@demo.local");
  if (!workerUser || !worker2User) {
    throw new Error("Failed to seed baseline demo workers");
  }

  const companyUser = await prisma.user.upsert({
    where: { email: "company@demo.local" },
    update: {
      passwordHash,
      role: "COMPANY",
      companyProfile: {
        upsert: {
          update: {
            companyName: "Demo Company s.r.o.",
            contactName: "Demo Contact",
            contactPhone: "+421900000001",
            addressStreet: "Hlavná 1",
            addressCity: "Bratislava",
            addressZip: "81101",
            region: "BA",
            warehouseType: "WAREHOUSE",
            isApproved: true,
            onboardingComplete: true,
          },
          create: {
            companyName: "Demo Company s.r.o.",
            contactName: "Demo Contact",
            contactPhone: "+421900000001",
            addressStreet: "Hlavná 1",
            addressCity: "Bratislava",
            addressZip: "81101",
            region: "BA",
            warehouseType: "WAREHOUSE",
            isApproved: true,
            onboardingComplete: true,
          },
        },
      },
    },
    create: {
      email: "company@demo.local",
      passwordHash,
      role: "COMPANY",
      companyProfile: {
        create: {
          companyName: "Demo Company s.r.o.",
          contactName: "Demo Contact",
          contactPhone: "+421900000001",
          addressStreet: "Hlavná 1",
          addressCity: "Bratislava",
          addressZip: "81101",
          region: "BA",
          warehouseType: "WAREHOUSE",
          isApproved: true,
          onboardingComplete: true,
        },
      },
    },
  });

  const workerProfile = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: workerUser.id },
  });
  const worker2Profile = await prisma.workerProfile.findUniqueOrThrow({
    where: { userId: worker2User.id },
  });
  const companyProfile = await prisma.companyProfile.findUniqueOrThrow({
    where: { userId: companyUser.id },
  });

  await seedDemoMorningShiftsForNextWeek(prisma, companyProfile);
  const extraCompanyEmails = await seedDemoWarehouseCompaniesAndShifts(
    prisma,
    passwordHash,
  );

  const startsAt = new Date();
  startsAt.setHours(8, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setHours(16, 0, 0, 0);

  const existingJob = await prisma.job.findFirst({
    where: {
      companyId: companyProfile.id,
      title: "Demo zmena",
      startsAt,
    },
  });

  const job =
    existingJob ??
    (await prisma.job.create({
      data: {
        companyId: companyProfile.id,
        title: "Demo zmena",
        description: "Demo zmena pre manuálny smoke test (kalendár + prihlášky).",
        locationCity: "Bratislava",
        locationAddress: companyProfile.addressStreet ?? "Hlavná 1",
        region: "BA",
        warehouseType: "WAREHOUSE",
        positionTypes: [],
        startsAt,
        endsAt,
        durationHours: 8,
        hourlyRate: "8.50",
        neededWorkers: 2,
        status: "OPEN",
      },
    }));

  if (existingJob) {
    await prisma.job.update({
      where: { id: existingJob.id },
      data: {
        endsAt,
        durationHours: 8,
        neededWorkers: 2,
        status: "OPEN",
      },
    });
  }

  await prisma.jobApplication.upsert({
    where: { jobId_workerId: { jobId: job.id, workerId: workerProfile.id } },
    update: { status: "PENDING" },
    create: {
      jobId: job.id,
      workerId: workerProfile.id,
      status: "PENDING",
    },
  });

  await prisma.jobApplication.upsert({
    where: { jobId_workerId: { jobId: job.id, workerId: worker2Profile.id } },
    update: { status: "CONFIRMED" },
    create: {
      jobId: job.id,
      workerId: worker2Profile.id,
      status: "CONFIRMED",
    },
  });

  console.log(
    "\nDev DB seeded:\n" +
      `- admin@demo.local / ${password}\n` +
      `- worker@demo.local / ${password}\n` +
      `- worker2@demo.local / ${password}\n` +
      `- worker3@demo.local / ${password}\n` +
      `- worker4@demo.local / ${password}\n` +
      `- company@demo.local / ${password}\n` +
      extraCompanyEmails.map((email) => `- ${email} / ${password}\n`).join(""),
  );
}

await main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
