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
import { WorkerApplicationCancelButton } from "@/components/worker/application-cancel-button";
import { WorkerWorkedConfirmCard } from "@/components/worker/worker-worked-confirm-card";

export const metadata: Metadata = {
  title: "Nahodené smeny · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

type AssignedRow = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  workedConfirmedAt: Date | null;
  workerWorkedConfirmedAt: Date | null;
  shiftEnded: boolean;
  contractDocument?: { id: string; workerSignedAt: Date | null } | null;
  job: {
    title: string;
    startsAt: Date;
    endsAt: Date;
    durationHours: number;
    locationCity: string;
    region: string;
    company: {
      companyName: string;
    };
  };
};

export default async function WorkerAssignedPage() {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) redirect("/worker/onboarding");

  const applications = (await listWorkerApplications(session.user.id)) as AssignedRow[];
  const now = new Date();
  const assigned = applications
    .filter((app) => app.status === ApplicationStatus.CONFIRMED)
    .filter((app) => app.job.endsAt.getTime() >= now.getTime())
    .sort((a, b) => a.job.startsAt.getTime() - b.job.startsAt.getTime());

  return (
    <AppShell
      title="Nahodené smeny"
      subtitle="Potvrdené smeny, ktoré vás čakajú. Tu vybavíte aj odhlásenie."
      homeHref="/worker/dashboard"
      actions={
        <Button asChild variant="outline">
          <Link href="/worker/jobs">Nájsť smenu</Link>
        </Button>
      }
    >
      {assigned.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Zatiaľ nemáte žiadne potvrdené budúce smeny.
        </div>
      ) : (
        <div className="space-y-3">
          {assigned.map((app) => (
            <div
              key={app.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {app.job.company.companyName}
                  </p>
                  <h2 className="text-lg font-semibold text-foreground">
                    {app.job.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {app.job.locationCity}, {app.job.region} ·{" "}
                    {format(app.job.startsAt, "d MMM yyyy HH:mm")} ·{" "}
                    {app.job.durationHours}h
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/worker/jobs/${app.jobId}`}>Detail</Link>
                  </Button>
                  {app.contractDocument && !app.contractDocument.workerSignedAt ? (
                    <Button asChild size="sm">
                      <Link href={`/worker/contracts/${app.contractDocument.id}`}>
                        Podpísať zmluvu (Beta)
                      </Link>
                    </Button>
                  ) : null}
                  <WorkerApplicationCancelButton
                    applicationId={app.id}
                    status={app.status}
                  />
                </div>
              </div>
              <WorkerWorkedConfirmCard
                applicationId={app.id}
                shiftEnded={app.shiftEnded}
                workedConfirmedAtIso={app.workedConfirmedAt ? app.workedConfirmedAt.toISOString() : null}
                workerWorkedConfirmedAtIso={
                  app.workerWorkedConfirmedAt ? app.workerWorkedConfirmedAt.toISOString() : null
                }
              />
            </div>
          ))}
          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Tip: ak chceš vidieť rozpis podľa dní, použi kalendár.
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/worker/calendar">Otvoriť kalendár</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
