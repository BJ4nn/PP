import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { getCompanyProfileByUserId } from "@/server/services/company";
import { getCompanyWorkersData } from "@/server/services/company-workers";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Pracovníci · Warehouse Flex Portal",
};

export const dynamic = "force-dynamic";

type WorkerRow = {
  id: string;
  name: string;
  city: string;
  reliabilityScore: number;
  lastWorkedAt: Date;
};

function WorkerLine({ worker, badge }: { worker: WorkerRow; badge?: string }) {
  return (
    <Link
      href={`/company/workers/${worker.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-background px-4 py-3 hover:border-primary/60 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {worker.name}
          </p>
          {badge ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {worker.city} · Reliability {worker.reliabilityScore}
        </p>
      </div>
      <div className="sm:text-right">
        <p className="text-xs font-semibold text-foreground">
          {format(worker.lastWorkedAt, "d MMM yyyy")}
        </p>
        <p className="text-[10px] text-muted-foreground">posledná zmena</p>
      </div>
    </Link>
  );
}

export default async function CompanyWorkersPage() {
  const session = await requireRole(UserRole.COMPANY);
  const profile = await getCompanyProfileByUserId(session.user.id);
  if (!profile?.onboardingComplete) redirect("/company/onboarding");

  const data = await getCompanyWorkersData(session.user.id);

  const verifiedById = new Set(data.verifiedWorkers.map((w) => w.id));
  const combined = data.workersWorked.map((w) => ({
    ...w,
    isVerified: verifiedById.has(w.id),
  }));

  return (
    <AppShell
      title="Pracovníci"
      subtitle="Zoznam ľudí, ktorí už mali potvrdenú zmenu vo vašej firme."
      homeHref="/company/dashboard"
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Overení pracovníci
              </h2>
              <p className="text-sm text-muted-foreground">
                Odpracované zmeny, ktoré ste už odklikli ({data.verifiedWorkers.length})
              </p>
            </div>
          </div>
          {data.verifiedWorkers.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Zatiaľ ste nepotvrdili žiadne odpracované zmeny.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {data.verifiedWorkers.map((worker) => (
                <WorkerLine key={worker.id} worker={worker} badge="Overený" />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Pracovali u nás
              </h2>
              <p className="text-sm text-muted-foreground">
                Potvrdené zmeny, ktoré už skončili ({data.workersWorked.length})
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/company/jobs">Otvoriť zmeny</Link>
            </Button>
          </div>
          {combined.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Zatiaľ tu nie sú žiadni pracovníci.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {combined.map((worker) => (
                <WorkerLine
                  key={worker.id}
                  worker={worker}
                  {...(worker.isVerified ? { badge: "Overený" } : {})}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
