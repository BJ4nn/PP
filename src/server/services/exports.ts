import { prisma } from "@/server/db/client";
import { ApplicationStatus } from "@/types";
import { requireCompany } from "@/server/services/jobs/shared";
import { toCsv } from "@/server/utils/csv";
import { format } from "date-fns";

type ExportScope =
  | { type: "job"; jobId: string }
  | { type: "range"; rangeDays: number };

function parseRangeDays(value: string | null) {
  const n = Number(value);
  return [7, 30, 90].includes(n) ? n : 30;
}

function getScope(url: URL): ExportScope {
  const jobId = url.searchParams.get("jobId");
  if (jobId) return { type: "job", jobId };
  return { type: "range", rangeDays: parseRangeDays(url.searchParams.get("range")) };
}

function dateWindow(scope: ExportScope) {
  const now = new Date();
  if (scope.type === "job") return { gte: undefined, lte: undefined, now };
  const start = new Date(now.getTime() - scope.rangeDays * 24 * 60 * 60 * 1000);
  return { gte: start, lte: now, now };
}

export async function getCompanyHoursCsv(companyUserId: string, requestUrl: string) {
  const company = await requireCompany(companyUserId, { ensureApproved: false });
  const url = new URL(requestUrl);
  const scope = getScope(url);
  const window = dateWindow(scope);
  const now = window.now;

  const applications = await prisma.jobApplication.findMany({
    where: {
      status: ApplicationStatus.CONFIRMED,
      job: {
        companyId: company.id,
        ...(scope.type === "job" ? { id: scope.jobId } : {}),
        ...(scope.type === "range" && window.gte && window.lte
          ? { startsAt: { gte: window.gte, lte: window.lte } }
          : {}),
        endsAt: { lt: now },
      },
    },
    include: {
      worker: true,
      job: true,
    },
    orderBy: [{ job: { startsAt: "desc" } }, { createdAt: "desc" }],
    take: 50000,
  });

  const headers = [
    "jobId",
    "jobTitle",
    "startsAt",
    "endsAt",
    "durationHours",
    "workerId",
    "workerName",
    "estimatedEarningsEur",
  ];

  const rows = applications.map((app) => [
    app.jobId,
    app.job.title,
    format(app.job.startsAt, "yyyy-MM-dd HH:mm"),
    format(app.job.endsAt, "yyyy-MM-dd HH:mm"),
    app.job.durationHours ?? "",
    app.workerId,
    app.worker.name,
    app.estimatedEarningsEur ?? "",
  ]);

  return toCsv(headers, rows);
}

export async function getCompanyBonusesCsv(companyUserId: string, requestUrl: string) {
  const company = await requireCompany(companyUserId, { ensureApproved: false });
  const url = new URL(requestUrl);
  const scope = getScope(url);
  const window = dateWindow(scope);
  const now = window.now;

  const applications = await prisma.jobApplication.findMany({
    where: {
      status: ApplicationStatus.CONFIRMED,
      job: {
        companyId: company.id,
        ...(scope.type === "job" ? { id: scope.jobId } : {}),
        ...(scope.type === "range" && window.gte && window.lte
          ? { startsAt: { gte: window.gte, lte: window.lte } }
          : {}),
        endsAt: { lt: now },
      },
    },
    include: {
      worker: true,
      job: true,
    },
    orderBy: [{ job: { startsAt: "desc" } }, { createdAt: "desc" }],
    take: 50000,
  });

  const headers = [
    "jobId",
    "jobTitle",
    "startsAt",
    "workerId",
    "workerName",
    "urgentBonusEur",
    "bundleBonusEur",
    "totalBonusEur",
  ];

  const rows = applications.map((app) => {
    const urgent = app.job.isUrgent ? app.job.urgentBonusEur ?? 0 : 0;
    const bundle = app.job.isBundle ? app.job.bundleBonusEur ?? 0 : 0;
    const total = urgent + bundle;
    return [
      app.jobId,
      app.job.title,
      format(app.job.startsAt, "yyyy-MM-dd HH:mm"),
      app.workerId,
      app.worker.name,
      urgent,
      bundle,
      Math.round(total * 100) / 100,
    ];
  });

  return toCsv(headers, rows);
}
