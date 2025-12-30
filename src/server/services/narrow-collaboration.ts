import { prisma } from "@/server/db/client";
import { DayOfWeek, ShiftType } from "@/types";
import { requireCompanyProfile } from "@/server/services/applications/shared";
import { requireNarrowCollaboration } from "@/server/services/worker-companies";
import { listOpenJobsForWorker } from "@/server/services/jobs";
import { applyToJob } from "@/server/services/applications";

export type NarrowCollaborationGroupRow = {
  id: string;
  name: string;
  maxAdvanceWeeks: number;
  workerCount: number;
};

export type NarrowCollaborationSchemeRow = {
  id: string;
  name: string;
  daysOfWeek: DayOfWeek[];
};

export async function getCompanyNarrowCollaborationSettings(companyUserId: string) {
  const company = await requireCompanyProfile(companyUserId);

  const [groups, schemes] = await Promise.all([
    prisma.companyNarrowCollaborationGroup.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { workerRelations: true } } },
    }),
    prisma.companyNarrowCollaborationScheme.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      maxAdvanceWeeks: group.maxAdvanceWeeks,
      workerCount: group._count.workerRelations,
    })),
    schemes: schemes.map((scheme) => ({
      id: scheme.id,
      name: scheme.name,
      daysOfWeek: scheme.daysOfWeek as DayOfWeek[],
    })),
  };
}

export async function createCompanyNarrowCollaborationGroup(
  companyUserId: string,
  input: { name: string; maxAdvanceWeeks: number },
) {
  const company = await requireCompanyProfile(companyUserId);
  return prisma.companyNarrowCollaborationGroup.create({
    data: {
      companyId: company.id,
      name: input.name,
      maxAdvanceWeeks: input.maxAdvanceWeeks,
    },
  });
}

export async function deleteCompanyNarrowCollaborationGroup(
  companyUserId: string,
  groupId: string,
) {
  const company = await requireCompanyProfile(companyUserId);
  const group = await prisma.companyNarrowCollaborationGroup.findFirst({
    where: { id: groupId, companyId: company.id },
  });
  if (!group) {
    throw new Error("Skupina nebola nájdená.");
  }
  return prisma.companyNarrowCollaborationGroup.delete({
    where: { id: group.id },
  });
}

export async function createCompanyNarrowCollaborationScheme(
  companyUserId: string,
  input: { name: string; daysOfWeek: DayOfWeek[] },
) {
  const company = await requireCompanyProfile(companyUserId);
  return prisma.companyNarrowCollaborationScheme.create({
    data: {
      companyId: company.id,
      name: input.name,
      daysOfWeek: input.daysOfWeek,
    },
  });
}

export async function deleteCompanyNarrowCollaborationScheme(
  companyUserId: string,
  schemeId: string,
) {
  const company = await requireCompanyProfile(companyUserId);
  const scheme = await prisma.companyNarrowCollaborationScheme.findFirst({
    where: { id: schemeId, companyId: company.id },
  });
  if (!scheme) {
    throw new Error("Schéma nebola nájdená.");
  }
  return prisma.companyNarrowCollaborationScheme.delete({
    where: { id: scheme.id },
  });
}

type NarrowCollaborationScheduleResult = {
  appliedCount: number;
  alreadyAppliedCount: number;
  skippedCount: number;
};

const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;

function getShiftTypeForStart(startsAt: Date) {
  const hour = startsAt.getHours();
  if (hour < MORNING_END_HOUR) return ShiftType.MORNING;
  if (hour < AFTERNOON_END_HOUR) return ShiftType.AFTERNOON;
  return ShiftType.NIGHT;
}

function getDayOfWeekKey(date: Date): DayOfWeek {
  const day = date.getDay();
  if (day === 0) return DayOfWeek.SUN;
  if (day === 1) return DayOfWeek.MON;
  if (day === 2) return DayOfWeek.TUE;
  if (day === 3) return DayOfWeek.WED;
  if (day === 4) return DayOfWeek.THU;
  if (day === 5) return DayOfWeek.FRI;
  return DayOfWeek.SAT;
}

function getRangeStart(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getRangeEnd(start: Date, weeks: number) {
  const end = new Date(start);
  end.setDate(end.getDate() + weeks * 7);
  return end;
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isBeforeCutoff(startsAt: Date, cutoffHour: number, now: Date) {
  const deadline = new Date(startsAt);
  deadline.setDate(deadline.getDate() - 1);
  deadline.setHours(cutoffHour, 0, 0, 0);
  return now.getTime() <= deadline.getTime();
}

export async function applyNarrowCollaborationSchedule(
  workerUserId: string,
  companyId: string,
  input: { schemeId: string; shiftType: ShiftType; weeks: number },
): Promise<NarrowCollaborationScheduleResult> {
  const worker = await requireNarrowCollaboration(workerUserId, companyId);
  const relation = await prisma.workerCompanyRelation.findUnique({
    where: { companyId_workerId: { companyId, workerId: worker.id } },
    select: { isNarrowCollaboration: true, narrowGroupId: true },
  });
  if (!relation?.isNarrowCollaboration) {
    throw new Error("Užšia spolupráca nie je pre túto firmu povolená.");
  }

  const [group, scheme, company] = await Promise.all([
    relation.narrowGroupId
      ? prisma.companyNarrowCollaborationGroup.findFirst({
          where: { id: relation.narrowGroupId, companyId },
        })
      : null,
    prisma.companyNarrowCollaborationScheme.findFirst({
      where: { id: input.schemeId, companyId },
    }),
    prisma.companyProfile.findFirst({
      where: { id: companyId },
      select: { advancedModeEnabled: true, narrowCollaborationCutoffHour: true },
    }),
  ]);

  if (!group) {
    throw new Error("Firma vám zatiaľ nepriradila skupinu užšej spolupráce.");
  }
  if (input.weeks > group.maxAdvanceWeeks) {
    throw new Error("Zvolený rozsah presahuje limit skupiny.");
  }
  if (!scheme) {
    throw new Error("Schéma nie je dostupná.");
  }
  if (!company) {
    throw new Error("Firma nebola nájdená.");
  }

  const now = new Date();
  const cutoffHour = company.advancedModeEnabled
    ? company.narrowCollaborationCutoffHour ?? 12
    : 12;
  const rangeStart = getRangeStart(now);
  const rangeEnd = getRangeEnd(rangeStart, input.weeks);

  const jobs = await listOpenJobsForWorker(workerUserId, { companyId });
  const eligible = jobs
    .filter((job) => job.startsAt >= rangeStart && job.startsAt < rangeEnd)
    .filter((job) => scheme.daysOfWeek.includes(getDayOfWeekKey(job.startsAt)))
    .filter((job) => getShiftTypeForStart(job.startsAt) === input.shiftType)
    .filter((job) => isBeforeCutoff(job.startsAt, cutoffHour, now))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const selectedByDay = new Map<string, typeof jobs[number]>();
  for (const job of eligible) {
    const dayKey = getLocalDateKey(job.startsAt);
    if (selectedByDay.has(dayKey)) continue;
    selectedByDay.set(dayKey, job);
  }

  let appliedCount = 0;
  let alreadyAppliedCount = 0;
  let skippedCount = 0;

  for (const job of selectedByDay.values()) {
    try {
      await applyToJob(workerUserId, job.id, {});
      appliedCount += 1;
    } catch (error) {
      const message = (error as Error).message;
      if (message.toLowerCase().includes("already applied")) {
        alreadyAppliedCount += 1;
      } else {
        skippedCount += 1;
      }
    }
  }

  return { appliedCount, alreadyAppliedCount, skippedCount };
}
