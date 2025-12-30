import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { JobWaveStage, UserRole } from "@/types";
import { listCompanyJobs } from "@/server/services/jobs";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { getCompanyKpis } from "@/server/services/company-kpis";
import { getCompanyWorkersData } from "@/server/services/company-workers";
import { getCompanyWorkerGroups } from "@/server/services/company-worker-groups";
import { getCompanyNarrowCollaborationSettings } from "@/server/services/narrow-collaboration";
import { AppShell } from "@/components/layout/app-shell";
import { CompanyKpiCards } from "@/components/company/company-kpi-cards";
import { ExportButtons } from "@/components/company/export-buttons";
import { CompanyWaveGroups } from "@/components/company/company-wave-groups";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatHourlyRateEur } from "@/lib/format/money";

export const metadata: Metadata = {
  title: "Zmeny firmy · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

const statusBadge: Record<string, string> = {
  OPEN: "text-green-600 bg-green-100",
  FULL: "text-blue-600 bg-blue-100",
  CLOSED: "text-gray-600 bg-gray-200",
  CANCELLED: "text-red-600 bg-red-100",
};

const statusLabels: Record<string, string> = {
  OPEN: "Otvorená",
  FULL: "Obsadená",
  CLOSED: "Uzavretá",
  CANCELLED: "Zrušená",
};

const waveLabels: Record<JobWaveStage, string> = {
  [JobWaveStage.WAVE1]: "1. vlna",
  [JobWaveStage.WAVE2]: "2. vlna",
  [JobWaveStage.PUBLIC]: "3. vlna",
};

type Props = {
  searchParams: Promise<{ range?: string }>;
};

export default async function CompanyJobsPage({ searchParams }: Props) {
  const session = await requireRole(UserRole.COMPANY);
  const resolvedParams = await searchParams;
  const rangeRaw = resolvedParams?.range ? Number(resolvedParams.range) : 30;

  let jobs;
  try {
    jobs = await listCompanyJobs(session.user.id);
  } catch {
    redirect("/company/onboarding");
  }
  if (!jobs) return null;

  const company = await getCompanyProfileByUserId(session.user.id);
  if (!company?.onboardingComplete) redirect("/company/onboarding");
  const awaitingApproval = !company.isApproved;
  const kpis = await getCompanyKpis(company.id, rangeRaw);
  const workersData = await getCompanyWorkersData(session.user.id);
  const groups = await getCompanyWorkerGroups(session.user.id);
  const narrowSettings = await getCompanyNarrowCollaborationSettings(session.user.id);

  return (
    <AppShell
      title="Ponuky zmien"
      subtitle="Spravujte plánované zmeny a sledujte aktivitu prihlášok."
      homeHref="/company/dashboard"
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button asChild disabled={awaitingApproval}>
            <Link href="/company/jobs/new">Vytvoriť ponuku zmeny</Link>
          </Button>
        </div>
        <CompanyKpiCards kpis={kpis} basePath="/company/jobs" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vlny a skupiny</h2>
          <p className="text-sm text-muted-foreground">
            Spravujte prioritne a uzsie skupiny pre rozosielanie ponuk.
          </p>
        </div>
        <CompanyWaveGroups
          priorityWorkers={groups.priorityWorkers}
          verifiedWorkers={workersData.verifiedWorkers}
          narrowWorkers={groups.narrowWorkers}
          advancedModeEnabled={company.advancedModeEnabled ?? false}
          cutoffHour={company.narrowCollaborationCutoffHour ?? 12}
          narrowGroups={narrowSettings.groups}
          narrowSchemes={narrowSettings.schemes}
        />
        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Exporty (CSV)</p>
              <p className="text-xs text-muted-foreground">
                Potvrdené zmeny, ktoré už skončili · posledných {kpis.rangeDays} dní
              </p>
            </div>
            <ExportButtons rangeDays={kpis.rangeDays} />
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Zatiaľ nemáte žiadne zmeny. Zverejnite prvú ponuku a začnite
            prijímať prihlášky.
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/company/jobs/${job.id}`}
                className="block rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:border-primary"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {job.locationAddress}, {job.locationCity}, {job.region}
                    </p>
                    <h2 className="text-lg font-semibold text-foreground">
                      {job.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {format(job.startsAt, "d MMM, HH:mm")} ·{" "}
                      {job.durationHours}h · {formatHourlyRateEur(Number(job.hourlyRate))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Obsadenosť: {job.confirmedCount}/{job.neededWorkers}
                      {job.missingCount > 0 ? ` · Chýba ${job.missingCount}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-sm md:items-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[job.status] ?? "bg-gray-200 text-gray-600"}`}
                    >
                      {statusLabels[job.status] ?? job.status}
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                      {waveLabels[(job.waveStage as JobWaveStage) ?? JobWaveStage.WAVE1]}
                    </span>
                    <p className="text-muted-foreground">
                      Prihlášky: {job._count.applications}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
