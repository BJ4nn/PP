import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/session";
import { ApplicationStatus, JobStatus, JobWaveStage, UserRole, WarehouseType } from "@/types";
import { getJobForCompany } from "@/server/services/jobs";
import { AppShell } from "@/components/layout/app-shell";
import { JobApplicantList } from "@/components/company/job-applicant-list";
import { JobStatusActions } from "@/components/company/job-status-actions";
import { JobPolicyWidget } from "@/components/company/job-policy-widget";
import { JobTermsSection } from "@/components/company/job-terms-section";
import { JobQuickActions } from "@/components/company/job-quick-actions";
import { ExportButtons } from "@/components/company/export-buttons";
import { JobWaveActions } from "@/components/company/job-wave-actions";
import { cn } from "@/lib/utils";

type Params = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Detail zmeny · Warehouse Flex Portal",
};

const statusLabels: Record<JobStatus, string> = {
  [JobStatus.OPEN]: "Otvorená",
  [JobStatus.FULL]: "Obsadená",
  [JobStatus.CLOSED]: "Uzavretá",
  [JobStatus.CANCELLED]: "Zrušená",
};

const statusCopy: Record<JobStatus, string> = {
  [JobStatus.OPEN]:
    "Zmena je viditeľná pracovníkom. Prihlášky sú zoradené podľa zhody.",
  [JobStatus.FULL]:
    "Máte potvrdených dosť ľudí, ale v prípade zrušenia môžete zmenu znovu otvoriť.",
  [JobStatus.CLOSED]:
    "Zmena už prebehla alebo nie je aktívna. Prihlášky sa neakceptujú.",
  [JobStatus.CANCELLED]:
    "Zmena bola zrušená a pracovníci dostali upozornenie – používajte len v nevyhnutných prípadoch.",
};

const warehouseLabels: Record<WarehouseType, string> = {
  [WarehouseType.WAREHOUSE]: "Sklad",
  [WarehouseType.FULFILLMENT]: "Fulfillment centrum",
  [WarehouseType.RETAIL_DISTRIBUTION]: "Retail distribúcia",
  [WarehouseType.PRODUCTION_SUPPORT]: "Výrobná podpora",
  [WarehouseType.OTHER]: "Iné",
};

const statusGuide = Object.entries(statusCopy).map(([status, description]) => ({
  status: status as JobStatus,
  description,
}));

export default async function JobDetailPage({ params }: Params) {
  const session = await requireRole(UserRole.COMPANY);
  const { id } = await params;
  let job;
  try {
    job = await getJobForCompany(session.user.id, id);
  } catch {
    redirect("/company/onboarding");
  }
  if (!job) {
    redirect("/company/jobs");
  }

  const applicants = job.applications.map((app) => ({
    ...app,
    matchScore: Number(app.matchScore),
    worker: {
      ...app.worker,
      reliabilityScore: app.worker.reliabilityScore ?? 0,
      activityScore: app.worker.activityScore ?? 0,
      minHourlyRate: app.worker.minHourlyRate
        ? Number(app.worker.minHourlyRate)
        : undefined,
    },
  }));
  const confirmedCount = job.applications.filter(
    (app) => app.status === ApplicationStatus.CONFIRMED,
  ).length;
  const pendingApplicants = job.applications
    .filter((app) => app.status === ApplicationStatus.PENDING)
    .slice(0, 6)
    .map((app) => ({
      id: app.id,
      workerName: app.worker.name,
      matchScore: Number(app.matchScore),
    }));

  return (
    <AppShell
      title={job.title}
      subtitle={`${job.locationAddress}, ${job.locationCity}, ${job.region} · ${format(job.startsAt, "d MMM yyyy HH:mm")}`}
      homeHref="/company/dashboard"
    >
      <div className="space-y-8">
        <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <JobPolicyWidget
            jobId={job.id}
            noticeWindow={job.noticeWindow}
            cancellationCompensationPct={job.cancellationCompensationPct}
          />
          <div className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <JobStatusActions jobId={job.id} status={job.status as JobStatus} />
              <p className="mt-2 text-xs text-muted-foreground">
                {statusCopy[job.status as JobStatus]}
              </p>
            </div>
            <JobQuickActions
              jobId={job.id}
              status={job.status as JobStatus}
              neededWorkers={job.neededWorkers}
              confirmedCount={confirmedCount}
              pendingApplicants={pendingApplicants}
            />
            <JobWaveActions
              jobId={job.id}
              waveStage={job.waveStage as JobWaveStage}
              waveStartedAt={job.waveStartedAt.toISOString()}
              isActive={job.status === JobStatus.OPEN}
            />
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Exporty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                CSV výstupy pre mzdy (potvrdené zmeny, ktoré už skončili).
              </p>
              <div className="mt-3">
                <ExportButtons jobId={job.id} />
              </div>
            </div>
          </div>
        </section>

        <JobTermsSection
          job={{
            isUrgent: job.isUrgent,
            urgentBonusEur: job.urgentBonusEur,
            confirmBy: job.confirmBy,
            isBundle: job.isBundle,
            bundleMinHours: job.bundleMinHours,
            bundleMinDays: job.bundleMinDays,
            bundleBonusEur: job.bundleBonusEur,
            bundleHourlyRateEur: job.bundleHourlyRateEur,
            contractType: job.contractType,
            noticeWindow: job.noticeWindow,
            cancellationCompensationPct: job.cancellationCompensationPct,
            requiredVzv: job.requiredVzv,
            minExperience: job.minExperience,
          }}
        />

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Detaily zmeny</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Typ prevádzky</dt>
              <dd className="font-medium">{warehouseLabels[job.warehouseType] ?? job.warehouseType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Adresa zmeny</dt>
              <dd className="font-medium">
                {job.locationAddress}, {job.locationCity}, {job.region}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Trvanie</dt>
              <dd className="font-medium">{job.durationHours} h</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Hodinová sadzba</dt>
              <dd className="font-medium">
                €{Number(job.hourlyRate).toFixed(2)}/h
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Počet pracovníkov</dt>
              <dd className="font-medium">{job.neededWorkers}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stav</dt>
              <dd className="font-medium">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {statusLabels[job.status as JobStatus]}
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  {statusCopy[job.status as JobStatus]}
                </p>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted-foreground whitespace-pre-line">
            {job.description}
          </p>
          <div className="mt-6 space-y-4 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
            <p className="text-sm font-semibold text-foreground">
              Sprievodca stavmi
            </p>
            <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
              {statusGuide.map((item) => (
                <div
                  key={item.status}
                  className="rounded-2xl border border-border/80 bg-background/60 p-3"
                >
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      item.status === JobStatus.OPEN
                        ? "bg-emerald-100 text-emerald-900"
                        : item.status === JobStatus.FULL
                          ? "bg-blue-100 text-blue-900"
                          : item.status === JobStatus.CLOSED
                            ? "bg-gray-200 text-gray-700"
                            : "bg-rose-100 text-rose-900",
                    )}
                  >
                    {statusLabels[item.status]}
                  </span>
                  <p className="mt-2 leading-relaxed text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
              <p className="font-semibold text-amber-900">
                Tip pre rušenie zmien
              </p>
              <p className="text-sm">
                Ak je to možné, dajte vedieť aspoň 24–48 hodín vopred. Potvrdení
                pracovníci s príjmom rátajú, preto rušte len v prípade
                skutočnej zmeny plánu.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Prihlášky
            </h2>
            <p className="text-sm text-muted-foreground">
              {job.applications.length} uchádzačov
            </p>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Usporiadanie zohľadňuje zhodu (zručnosti, pripravenosť, sadzbu) aj
            históriu spoľahlivosti, aby boli odporúčaní pracovníci vždy navrchu.
          </p>
          <JobApplicantList applicants={applicants} />
        </section>
      </div>
    </AppShell>
  );
}
