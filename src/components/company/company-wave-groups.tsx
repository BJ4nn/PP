import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import type { CompanyWorkerGroupRow } from "@/server/services/company-worker-groups";
import { CompanyNarrowCollaborationSettings } from "@/components/company/company-narrow-collaboration-settings";
import type {
  NarrowCollaborationGroupRow,
  NarrowCollaborationSchemeRow,
} from "@/server/services/narrow-collaboration";

type Props = {
  priorityWorkers: CompanyWorkerGroupRow[];
  verifiedWorkers: CompanyWorkerGroupRow[];
  narrowWorkers: CompanyWorkerGroupRow[];
  advancedModeEnabled: boolean;
  cutoffHour: number;
  narrowGroups: NarrowCollaborationGroupRow[];
  narrowSchemes: NarrowCollaborationSchemeRow[];
};

function WorkerItem({ worker }: { worker: CompanyWorkerGroupRow }) {
  return (
    <Link
      href={`/company/workers/${worker.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm hover:border-primary/60 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{worker.name}</p>
        <p className="text-xs text-muted-foreground">
          {worker.city} · Reliability {worker.reliabilityScore}
        </p>
      </div>
      <div className="text-xs text-muted-foreground sm:text-right">
        {worker.lastWorkedAt ? format(worker.lastWorkedAt, "d MMM yyyy") : "Bez historie"}
      </div>
    </Link>
  );
}

function GroupCard({
  title,
  subtitle,
  workers,
  emptyCopy,
}: {
  title: string;
  subtitle: string;
  workers: CompanyWorkerGroupRow[];
  emptyCopy: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/company/workers">Pridat pracovnika</Link>
        </Button>
      </div>
      {workers.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          {emptyCopy}
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {workers.slice(0, 6).map((worker) => (
            <WorkerItem key={worker.id} worker={worker} />
          ))}
          {workers.length > 6 ? (
            <Link
              href="/company/workers"
              className="block text-xs font-semibold text-primary hover:underline"
            >
              Zobrazit dalsich {workers.length - 6}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function CompanyWaveGroups({
  priorityWorkers,
  verifiedWorkers,
  narrowWorkers,
  advancedModeEnabled,
  cutoffHour,
  narrowGroups,
  narrowSchemes,
}: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <GroupCard
        title="1. vlna - prioritna skupina"
        subtitle="Manualne vybrani pracovnici, ktori uz u vas pracovali."
        workers={priorityWorkers}
        emptyCopy="Zatial nemate ziadnych pracovnikov v prioritnej skupine."
      />
      <GroupCard
        title="2. vlna - overeni pracovnici"
        subtitle="Potvrdene odpracovane zmeny (automaticky po 12h)."
        workers={verifiedWorkers}
        emptyCopy="Zatial nemate overenych pracovnikov."
      />
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Uzsia spolupraca
            </p>
            <p className="text-xs text-muted-foreground">
              Pracovnici so schvalenou uzsou spolupracou a skupinovym planovanim.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/company/workers">Pridat pracovnika</Link>
          </Button>
        </div>
        {narrowWorkers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Zatial nemate ziadnych pracovnikov v uzsej spolupraci.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {narrowWorkers.slice(0, 6).map((worker) => (
              <WorkerItem key={worker.id} worker={worker} />
            ))}
            {narrowWorkers.length > 6 ? (
              <Link
                href="/company/workers"
                className="block text-xs font-semibold text-primary hover:underline"
              >
                Zobrazit dalsich {narrowWorkers.length - 6}
              </Link>
            ) : null}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Pracovnik si vyberie schemu a planuje si zmeny dopredu vo svojom rezime
          uzsej spoluprace.
        </p>
        <div className="mt-4">
          <CompanyNarrowCollaborationSettings
            advancedModeEnabled={advancedModeEnabled}
            initialCutoffHour={cutoffHour}
            groups={narrowGroups}
            schemes={narrowSchemes}
          />
        </div>
      </div>
    </section>
  );
}
