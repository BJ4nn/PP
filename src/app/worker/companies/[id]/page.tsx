import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { getWorkerProfileByUserId } from "@/server/services/worker";
import { getWorkerCompanySummary } from "@/server/services/worker-companies";
import { listOpenJobsForWorker } from "@/server/services/jobs";
import { WorkerJobCard } from "@/components/worker/job-card";
import { WorkerNarrowCollaborationPlanner } from "@/components/worker/worker-narrow-collaboration-planner";

export const metadata: Metadata = {
  title: "Uzsia spolupraca - Warehouse Flex Portal",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkerCompanyJobsPage({ params }: Props) {
  const session = await requireRole(UserRole.WORKER);
  const resolvedParams = await params;
  const profile = await getWorkerProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) redirect("/worker/onboarding");

  const summary = await getWorkerCompanySummary(session.user.id, resolvedParams.id);
  if (!summary) redirect("/worker/companies");
  if (!summary.isNarrowCollaboration) redirect("/worker/companies?error=narrow");

  const cutoffHour = summary.advancedModeEnabled
    ? summary.narrowCollaborationCutoffHour ?? 12
    : 12;

  const maxAdvanceWeeks = summary.narrowCollaborationGroup?.maxAdvanceWeeks ?? 1;
  const jobs = await listOpenJobsForWorker(session.user.id, {
    companyId: summary.companyId,
  });
  const sortedJobs = [...jobs].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + maxAdvanceWeeks * 7);
  const visibleJobs = sortedJobs.filter((job) => {
    if (job.startsAt < rangeStart || job.startsAt >= rangeEnd) return false;
    const deadline = new Date(job.startsAt);
    deadline.setDate(deadline.getDate() - 1);
    deadline.setHours(cutoffHour, 0, 0, 0);
    return now.getTime() <= deadline.getTime();
  });

  return (
    <AppShell
      title={summary.companyName}
      subtitle={`Uzsia spolupraca - ${summary.city}, ${summary.region}`}
      homeHref="/worker/companies"
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          Zobrazene su iba smeny z tejto firmy, ktore su dostupne pre vas.
        </div>
        <WorkerNarrowCollaborationPlanner
          companyId={summary.companyId}
          group={summary.narrowCollaborationGroup ?? null}
          schemes={summary.narrowCollaborationSchemes ?? []}
          cutoffHour={cutoffHour}
        />
        {visibleJobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Momentalne nie su dostupne ziadne smeny od tejto firmy.
          </div>
        ) : (
          visibleJobs.map((job) => (
            <WorkerJobCard
              key={job.id}
              job={{
                id: job.id,
                title: job.title,
                description: job.description,
                locationCity: job.locationCity,
                locationAddress: job.locationAddress,
                region: job.region,
                warehouseType: job.warehouseType,
                startsAt: job.startsAt.toISOString(),
                durationHours: job.durationHours,
                hourlyRate: job.hourlyRate.toString(),
                ...(job.effectiveHourlyRate !== undefined
                  ? { effectiveHourlyRate: job.effectiveHourlyRate }
                  : {}),
                requiredVzv: job.requiredVzv,
                isUrgent: job.isUrgent,
                urgentBonusEur: job.urgentBonusEur ?? null,
                confirmBy: job.confirmBy ? job.confirmBy.toISOString() : null,
                isBundle: job.isBundle,
                bundleMinHours: job.bundleMinHours ?? null,
                bundleMinDays: job.bundleMinDays ?? null,
                bundleBonusEur: job.bundleBonusEur ?? null,
                bundleHourlyRateEur: job.bundleHourlyRateEur
                  ? job.bundleHourlyRateEur.toString()
                  : null,
                contractType: job.contractType ?? null,
                noticeWindow: job.noticeWindow,
                cancellationCompensationPct: job.cancellationCompensationPct ?? 0,
                relevanceScore: job.relevanceScore,
                inviteStage: job.inviteStage,
                isFavoriteCompany: job.isFavoriteCompany,
                isVerifiedCompany: job.isVerifiedCompany,
                isPriorityCompany: job.isPriorityCompany,
                company: { companyName: summary.companyName },
              }}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}
