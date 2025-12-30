import type { Metadata } from "next";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { ApplicationStatus, UserRole } from "@/types";
import { listWorkerApplications } from "@/server/services/applications";
import { AppShell } from "@/components/layout/app-shell";
import { WorkerApplicationCancelButton } from "@/components/worker/application-cancel-button";

const statusClass: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-700",
  CANCELLED_BY_WORKER: "bg-gray-200 text-gray-600",
  CANCELLED_BY_COMPANY: "bg-gray-200 text-gray-600",
  WORKER_CANCELED_LATE: "bg-rose-100 text-rose-900",
  COMPANY_CANCELED_LATE: "bg-rose-100 text-rose-900",
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

export const metadata: Metadata = {
  title: "Moje prihlášky · Warehouse Flex Portal",
};

export default async function WorkerApplicationsPage() {
  const session = await requireRole(UserRole.WORKER);
  let applications;
  try {
    applications = await listWorkerApplications(session.user.id);
  } catch {
    redirect("/worker/onboarding");
  }
  if (!applications) return null;

  return (
    <AppShell
      title="Moje prihlášky"
      subtitle="Sledujte potvrdené zmeny a vybavujte odhlásenia."
      homeHref="/worker/dashboard"
    >
      <div className="space-y-4">
        {applications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Zatiaľ ste sa neprihlásili na žiadnu zmenu. Prezrite si dostupné
            ponuky a prihláste sa na tie, ktoré vám vyhovujú.
          </div>
        ) : (
          applications.map((application) => (
            <div
              key={application.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {application.job.company.companyName}
                  </p>
                  <h2 className="text-lg font-semibold text-foreground">
                    {application.job.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {application.job.locationCity}, {application.job.region} ·{" "}
                    {format(application.job.startsAt, "d MMM HH:mm")}
                  </p>
                </div>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClass[application.status]}`}
                >
                  {statusLabels[application.status]}
                </span>
              </div>
              {application.status === ApplicationStatus.COMPANY_CANCELED_LATE &&
              (application.compensationAmount ?? 0) > 0 ? (
                <p className="mt-3 text-sm font-semibold text-foreground">
                  Kompenzácia: €{Number(application.compensationAmount).toFixed(2)}
                </p>
              ) : null}
              <div className="mt-3">
                <WorkerApplicationCancelButton
                  applicationId={application.id}
                  status={application.status as ApplicationStatus}
                />
              </div>
              {application.note ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Vaša poznámka: {application.note}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
