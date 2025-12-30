import { format } from "date-fns";

type WorkerRow = {
  id: string;
  name: string;
  city: string;
  reliabilityScore: number;
  lastWorkedAt: Date;
};

type Props = {
  workersWorked: WorkerRow[];
  verifiedWorkers: WorkerRow[];
};

function workerLine(worker: WorkerRow) {
  return (
    <div
      key={worker.id}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {worker.name}
        </p>
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
    </div>
  );
}

export function CompanyWorkerHistoryLists({ workersWorked, verifiedWorkers }: Props) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pracovali u nás</h2>
          <p className="text-sm text-muted-foreground">
            Potvrdené zmeny, ktoré už skončili ({workersWorked.length})
          </p>
        </div>
        {workersWorked.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Zatiaľ tu nie sú žiadni pracovníci.
          </div>
        ) : (
          <div className="space-y-2">
            {workersWorked.slice(0, 12).map(workerLine)}
            {workersWorked.length > 12 ? (
              <div className="text-xs text-muted-foreground">
                +{workersWorked.length - 12} ďalších
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Overení</h2>
          <p className="text-sm text-muted-foreground">
            Odpracované zmeny, ktoré ste už odklikli ({verifiedWorkers.length})
          </p>
        </div>
        {verifiedWorkers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Zatiaľ ste nepotvrdili žiadne odpracované zmeny.
          </div>
        ) : (
          <div className="space-y-2">
            {verifiedWorkers.slice(0, 12).map(workerLine)}
            {verifiedWorkers.length > 12 ? (
              <div className="text-xs text-muted-foreground">
                +{verifiedWorkers.length - 12} ďalších
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
