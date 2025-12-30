import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { UserRole, ExperienceLevel, Region } from "@/types";
import { getCompanyWorkerProfile } from "@/server/services/company-workers";
import { getCompanyNarrowCollaborationSettings } from "@/server/services/narrow-collaboration";
import { AppShell } from "@/components/layout/app-shell";
import { CompanyWorkerRelationPanel } from "@/components/company/company-worker-relation-panel";

export const metadata: Metadata = {
  title: "Profil pracovníka · Warehouse Flex Portal",
};

const experienceLabels: Record<ExperienceLevel, string> = {
  [ExperienceLevel.NONE]: "Bez požiadavky",
  [ExperienceLevel.BASIC]: "Základná prax",
  [ExperienceLevel.INTERMEDIATE]: "Skúsený",
  [ExperienceLevel.ADVANCED]: "Senior / vedúci",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CompanyWorkerDetailPage({ params }: Props) {
  const session = await requireRole(UserRole.COMPANY);
  const { id } = await params;
  const worker = await getCompanyWorkerProfile(session.user.id, id);

  if (!worker) {
    redirect("/company/workers");
  }

  const narrowSettings = await getCompanyNarrowCollaborationSettings(session.user.id);

  return (
    <AppShell
      title={worker.name ?? "Profil pracovníka"}
      subtitle={`${worker.city ?? ""} ${worker.region ?? ""}`}
      homeHref="/company/dashboard"
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{worker.user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefón</p>
              <p className="font-medium">{worker.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Región</p>
              <p className="font-medium">
                {worker.region ?? Region.BA}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Skúsenosť</p>
              <p className="font-medium">
                {worker.experienceLevel
                  ? experienceLabels[worker.experienceLevel]
                  : "Neuvedené"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">VZV / BOZP / Hygiena</p>
              <p className="font-medium flex flex-wrap gap-2 text-xs text-muted-foreground">
                {worker.hasVZV ? <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">VZV</span> : null}
                {worker.hasBOZP ? <span className="rounded-full bg-muted px-2 py-1">BOZP</span> : null}
                {worker.hasFoodCard ? <span className="rounded-full bg-muted px-2 py-1">Hyg. preukaz</span> : null}
                {!worker.hasVZV && !worker.hasBOZP && !worker.hasFoodCard ? "Neuvedené" : null}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Min. hodinová sadzba</p>
              <p className="font-medium">
                {worker.minHourlyRate ? `€${Number(worker.minHourlyRate).toFixed(2)}/h` : "Neuvedené"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spoľahlivosť</p>
              <p className="font-medium">{worker.reliabilityScore ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktivita</p>
              <p className="font-medium">{worker.activityScore ?? 0}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Ďalšie detaily (história zmien, dochádzka) budú dostupné v ostrej prevádzke.
          </div>
        </div>

        <CompanyWorkerRelationPanel
          workerId={worker.id}
          initialPriority={worker.relation.isPriority}
          initialNarrow={worker.relation.isNarrowCollaboration}
          initialNarrowGroupId={worker.relation.narrowGroupId ?? null}
          hasWorked={worker.hasWorked}
          narrowGroups={narrowSettings.groups}
        />
      </div>
    </AppShell>
  );
}
