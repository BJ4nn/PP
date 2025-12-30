import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getWorkerProfileByUserId } from "@/server/services/worker";
import { AppShell } from "@/components/layout/app-shell";
import { JobFeedClient } from "@/components/worker/job-feed-client";
import { WorkerReadyToggle } from "@/components/worker/ready-toggle";

export const metadata: Metadata = {
  title: "Marketplace · Warehouse Flex Portal",
};

export default async function WorkerJobsPage() {
  const session = await requireRole(UserRole.WORKER);
  const profile = await getWorkerProfileByUserId(session.user.id);
  if (!profile || !profile.onboardingComplete) redirect("/worker/onboarding");

  return (
    <AppShell
      title="Dostupné smeny"
      subtitle="Defaultne vidíte ponuky z celého Slovenska; vyberte mesto pre zúženie."
      homeHref="/worker/dashboard"
    >
      <div className="mb-4">
        <WorkerReadyToggle initialReady={profile.isReady} />
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Poradie závisí od zhody regiónu, certifikátov, dostupnosti a preferencií. Ak chcete len
        blízke ponuky, vyberte mesto v lokalite.
      </p>
      <JobFeedClient />
    </AppShell>
  );
}
