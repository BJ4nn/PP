export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { prisma } from "@/server/db/client";
import { JobStatus, UserRole } from "@/types";
import { getCanonicalCity } from "@/lib/locations";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const worker = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
    select: { hasVZV: true },
  });
  if (!worker) {
    return NextResponse.json({ error: "Worker profile not found" }, { status: 404 });
  }

  const now = new Date();
  const jobs = await prisma.job.findMany({
    where: {
      status: JobStatus.OPEN,
      company: { isApproved: true, onboardingComplete: true },
      startsAt: { gte: now },
      ...(worker.hasVZV ? {} : { requiredVzv: false }),
      AND: [{ OR: [{ confirmBy: null }, { confirmBy: { gt: now } }] }],
    },
    select: { locationCity: true },
    distinct: ["locationCity"],
  });

  const cities = jobs
    .map((j) => j.locationCity)
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    .map((c) => getCanonicalCity(c))
    .sort((a, b) => a.localeCompare(b, "sk"));

  return NextResponse.json({ cities });
}
