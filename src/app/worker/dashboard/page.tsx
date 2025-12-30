import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/session";
import { NoticeWindow, UserRole, WarehouseType } from "@/types";
import { getWorkerProfileByUserId, getWorkerActivityLabel } from "@/server/services/worker";
import { listOpenJobsForWorker } from "@/server/services/jobs";
import { listWorkerApplications } from "@/server/services/applications";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { WorkerReadyToggle } from "@/components/worker/ready-toggle";
import { WorkerDashboardWarnings } from "@/components/worker/worker-dashboard-warnings";
import { WorkerApplicationCancelButton } from "@/components/worker/application-cancel-button";
import { getEligibleInvoiceItemsForWorker, listWorkerInvoices } from "@/server/services/invoices/worker";

export const metadata: Metadata = {
  title: "Panel pracovníka · Warehouse Flex Portal",
};

const warehouseLabels: Record<WarehouseType, string> = {
  [WarehouseType.WAREHOUSE]: "Sklad",
  [WarehouseType.FULFILLMENT]: "Fulfillment centrum",
  [WarehouseType.RETAIL_DISTRIBUTION]: "Retail distribúcia",
  [WarehouseType.PRODUCTION_SUPPORT]: "Výrobná podpora",
  [WarehouseType.OTHER]: "Iné",
};

const noticeLabels: Record<NoticeWindow, string> = {
  [NoticeWindow.H12]: "Notice: 12h",
  [NoticeWindow.H24]: "Notice: 24h",
  [NoticeWindow.H48]: "Notice: 48h",
};

export default async function WorkerDashboardPage() {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);

  if (!profile || !profile.onboardingComplete) {
    redirect("/worker/onboarding");
  }

  const jobs = await listOpenJobsForWorker(session.user.id);
  const topJobs = jobs.slice(0, 3);
  const applications = await listWorkerApplications(session.user.id);
  const confirmed = applications.filter(
    (app) => app.status === "CONFIRMED",
  );
  const [eligibleInvoices, workerInvoices] = await Promise.all([
    getEligibleInvoiceItemsForWorker(session.user.id),
    listWorkerInvoices(session.user.id),
  ]);
  const now = new Date();
  const confirmedUpcoming = confirmed
    .filter((app) => app.job.startsAt > now)
    .sort((a, b) => a.job.startsAt.getTime() - b.job.startsAt.getTime());
  const activityLabel = getWorkerActivityLabel({
    activityScore: profile.activityScore,
    reliabilityScore: profile.reliabilityScore,
  });

  return (
    <AppShell
      title={`Ahoj, ${profile.name}`}
      subtitle="Tu sa zobrazia odporúčané zmeny a stav vašich prihlášok."
      homeHref="/worker/dashboard"
      variant="hero"
    >
      <div className="space-y-6">
        <WorkerDashboardWarnings
          isReady={profile.isReady}
        />
        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Stav profilu</p>
              <p className="text-lg font-semibold text-foreground">
                {profile.onboardingComplete ? "Pripravený" : "Rozpracovaný"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Región</p>
              <p className="text-lg font-semibold text-foreground">
                {profile.region}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Signál priority</p>
              <p className="text-lg font-semibold text-foreground">
                {activityLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                Vyššia aktivita a spoľahlivosť posúva váš profil vyššie.
              </p>
            </div>
          </div>
          <div id="ready">
            <WorkerReadyToggle initialReady={profile.isReady} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/70 p-6 text-center">
              <p className="text-base font-medium text-muted-foreground">
                Na tomto mieste budú viditeľné ponuky z vášho regiónu a s
                vhodnými požiadavkami.
              </p>
              <p className="text-sm text-muted-foreground">
                Držte sa v režime „Som pripravený“ a budujete tým svoju
                spoľahlivosť.
              </p>
            </div>
            <div
              id="assigned"
              className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-sm text-emerald-900"
            >
              <p className="text-base font-semibold">Nahodené zmeny (potvrdené)</p>
              {confirmedUpcoming.length === 0 ? (
                <p className="mt-2">
                  Zatiaľ nemáte žiadne potvrdené budúce zmeny. Keď vás firma potvrdí,
                  uvidíte ich tu a môžete si ich spravovať.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {confirmedUpcoming.slice(0, 5).map((app) => (
                    <div
                      key={app.id}
                      className="rounded-xl border border-emerald-200 bg-white/80 p-3 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {app.job.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {app.job.company.companyName} · {app.job.locationAddress},{" "}
                        {app.job.locationCity}, {app.job.region}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(app.job.startsAt, "d MMM HH:mm")} ·{" "}
                        {app.job.durationHours}h
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/worker/jobs/${app.jobId}`}>Detail</Link>
                        </Button>
                        <WorkerApplicationCancelButton
                          applicationId={app.id}
                          status={app.status}
                        />
                      </div>
                    </div>
                  ))}
                  {confirmedUpcoming.length > 5 ? (
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/worker/calendar">Zobraziť všetky</Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 text-sm">
              <p className="text-base font-semibold text-foreground">Faktúry (Beta)</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pripravené na fakturáciu:{" "}
                <span className="font-semibold text-foreground">
                  {eligibleInvoices.reduce((sum, g) => sum + g.items.length, 0)}
                </span>
                {" · "}moje faktúry:{" "}
                <span className="font-semibold text-foreground">
                  {workerInvoices.length}
                </span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/worker/invoices">Otvoriť faktúry</Link>
                </Button>
              </div>
            </div>
          </div>
          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Dostupné smeny · odporúčané ponuky
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/worker/jobs">Otvoriť dostupné smeny</Link>
              </Button>
            </div>
            {topJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200/80 p-4 text-sm text-muted-foreground">
                Zatiaľ tu nie sú žiadne vhodné ponuky. Nechajte režim „Som
                pripravený“ zapnutý a nové zmeny sa zobrazia hneď, ako ich
                sklady zverejnia.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {topJobs.map((job) => (
                  <div
                    key={job.id}
                    className="space-y-2 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold text-primary">
                      {job.company.companyName}
                    </p>
                    <h3 className="text-lg font-semibold text-foreground">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {job.locationAddress}, {job.locationCity}, {job.region} ·{" "}
                      {format(job.startsAt, "d MMM yyyy HH:mm")} ·{" "}
                      {job.durationHours}h · €
                      {Number(job.effectiveHourlyRate ?? job.hourlyRate).toFixed(2)}/h
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-muted px-3 py-1">
                        {warehouseLabels[job.warehouseType]}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1">
                        {noticeLabels[job.noticeWindow]}
                      </span>
                      {job.cancellationCompensationPct > 0 ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                          Kompenzácia {job.cancellationCompensationPct}%
                        </span>
                      ) : null}
                      {job.requiredVzv ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                          Potrebné VZV
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                    <Button asChild size="sm">
                      <Link href={`/worker/jobs/${job.id}`}>
                        Detail a prihlásiť sa
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </AppShell>
  );
}
