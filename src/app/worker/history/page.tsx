import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { requireRole } from "@/lib/auth/session";
import { ApplicationStatus, UserRole } from "@/types";
import { getWorkerProfileByUserId } from "@/server/services/worker";
import { listWorkerApplications } from "@/server/services/applications";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "História · Warehouse Flex Portal",
};

type HistoryRow = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  workedConfirmedAt: Date | null;
  workerRatingStars: number | null;
  estimatedEarningsEur: number | null;
  compensationAmount: number;
  job: {
    title: string;
    startsAt: Date;
    endsAt: Date;
    durationHours: number;
    hourlyRate: unknown;
    urgentBonusEur: number | null;
    locationCity: string;
    region: string;
    company: {
      companyName: string;
    };
  };
};

const statusLabels: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: "Čaká na schválenie",
  [ApplicationStatus.CONFIRMED]: "Potvrdené",
  [ApplicationStatus.REJECTED]: "Zamietnuté",
  [ApplicationStatus.CANCELLED_BY_WORKER]: "Zrušené pracovníkom",
  [ApplicationStatus.CANCELLED_BY_COMPANY]: "Zrušené firmou",
  [ApplicationStatus.WORKER_CANCELED_LATE]: "Neskoré zrušenie (pracovník)",
  [ApplicationStatus.COMPANY_CANCELED_LATE]: "Neskoré zrušenie (firma)",
};

const statusClass: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-700",
  CANCELLED_BY_WORKER: "bg-gray-200 text-gray-600",
  CANCELLED_BY_COMPANY: "bg-gray-200 text-gray-600",
  WORKER_CANCELED_LATE: "bg-rose-100 text-rose-900",
  COMPANY_CANCELED_LATE: "bg-rose-100 text-rose-900",
};

function formatMoneyEur(value: number) {
  return `€${value.toFixed(2)}`;
}

function calcEarningsEur(row: HistoryRow) {
  if (row.estimatedEarningsEur !== null) return row.estimatedEarningsEur;
  const hourly = Number(row.job.hourlyRate);
  if (!Number.isFinite(hourly)) return null;
  const base = hourly * row.job.durationHours;
  const urgent = row.job.urgentBonusEur ?? 0;
  return base + urgent;
}

export default async function WorkerHistoryPage() {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) redirect("/worker/onboarding");

  const applications = (await listWorkerApplications(session.user.id)) as HistoryRow[];
  const worked = applications
    .filter((app) => app.workedConfirmedAt)
    .sort(
      (a, b) =>
        (b.workedConfirmedAt?.getTime() ?? 0) - (a.workedConfirmedAt?.getTime() ?? 0),
    );

  const earnings = worked
    .map((row) => calcEarningsEur(row))
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const totalEarnings = earnings.reduce((sum, v) => sum + v, 0);
  const totalHours = worked.reduce((sum, v) => sum + (v.job.durationHours ?? 0), 0);

  return (
    <AppShell
      title="História"
      subtitle="Odpracované zmeny, zárobky a prehľad prihlášok."
      homeHref="/worker/dashboard"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Odpracované zmeny
              </h2>
              <p className="text-sm text-muted-foreground">
                {worked.length === 0
                  ? "Zatiaľ nemáte potvrdené odpracované zmeny."
                  : `${worked.length} zmien · ${totalHours}h · ${formatMoneyEur(totalEarnings)}`}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/worker/calendar">Otvoriť kalendár</Link>
            </Button>
          </div>

          {worked.length === 0 ? null : (
            <div className="mt-4 space-y-3">
              {worked.slice(0, 20).map((row) => {
                const earned = calcEarningsEur(row);
                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-primary">
                          {row.job.company.companyName}
                        </p>
                        <p className="text-base font-semibold text-foreground">
                          {row.job.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(row.job.startsAt, "d MMM yyyy HH:mm")} ·{" "}
                          {row.job.durationHours}h · {row.job.locationCity},{" "}
                          {row.job.region}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Potvrdené odpracovanie:{" "}
                          {format(row.workedConfirmedAt!, "d MMM HH:mm")}
                          {row.workerRatingStars ? ` · Hodnotenie: ${row.workerRatingStars}/5` : ""}
                          {earned !== null ? ` · Zárobok: ${formatMoneyEur(earned)}` : ""}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/worker/jobs/${row.jobId}`}>Detail</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
              {worked.length > 20 ? (
                <p className="text-xs text-muted-foreground">
                  Zobrazených prvých 20 záznamov.
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                História prihlášok
              </h2>
              <p className="text-sm text-muted-foreground">
                {applications.length === 0
                  ? "Zatiaľ nemáte žiadne prihlášky."
                  : `Spolu prihlášok: ${applications.length}`}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/worker/jobs">Nájsť smenu</Link>
            </Button>
          </div>

          {applications.length === 0 ? null : (
            <div className="mt-4 space-y-3">
              {applications.slice(0, 30).map((application) => (
                <div
                  key={application.id}
                  className="rounded-2xl border border-border bg-background/60 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-semibold text-primary">
                        {application.job.company.companyName}
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {application.job.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(application.job.startsAt, "d MMM yyyy HH:mm")} ·{" "}
                        {application.job.locationCity}, {application.job.region}
                      </p>
                      {application.status === ApplicationStatus.COMPANY_CANCELED_LATE &&
                      (application.compensationAmount ?? 0) > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          Kompenzácia: {formatMoneyEur(Number(application.compensationAmount))}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClass[application.status]}`}
                      >
                        {statusLabels[application.status]}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/worker/jobs/${application.jobId}`}>Detail</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {applications.length > 30 ? (
                <p className="text-xs text-muted-foreground">
                  Zobrazených prvých 30 záznamov.
                </p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

