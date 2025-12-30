import { format } from "date-fns";
import type { AdminDashboardData } from "@/app/admin/admin-types";

type Props = {
  monitor: AdminDashboardData["monitor"];
};

type Match = AdminDashboardData["monitor"]["confirmedMatches"][number];

function groupMatchesByWorker(matches: Match[]) {
  const map = new Map<string, Match[]>();
  for (const match of matches) {
    const list = map.get(match.worker.id);
    if (list) list.push(match);
    else map.set(match.worker.id, [match]);
  }
  return map;
}

function groupMatchesByCompany(matches: Match[]) {
  const map = new Map<string, Match[]>();
  for (const match of matches) {
    const list = map.get(match.job.company.id);
    if (list) list.push(match);
    else map.set(match.job.company.id, [match]);
  }
  return map;
}

export function AdminMonitorColumns({ monitor }: Props) {
  const matchesByWorker = groupMatchesByWorker(monitor.confirmedMatches);
  const matchesByCompany = groupMatchesByCompany(monitor.confirmedMatches);

  const companiesSorted = [...monitor.companies].sort((a, b) => {
    const am = matchesByCompany.get(a.id)?.length ?? 0;
    const bm = matchesByCompany.get(b.id)?.length ?? 0;
    if (am !== bm) return bm - am;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Voľní pracovníci
            </h2>
            <p className="text-sm text-muted-foreground">
              Označení ako pripravení ({monitor.readyWorkers.length})
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            Ready
          </span>
        </div>

        {monitor.readyWorkers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Zatiaľ nie je žiadny pracovník označený ako ready.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {monitor.readyWorkers.slice(0, 24).map((worker) => {
              const matches = matchesByWorker.get(worker.id) ?? [];
              const first = matches[0];
              return (
                <div
                  key={worker.id}
                  className="rounded-2xl border border-border/70 bg-background p-4"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {worker.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {worker.city}, {worker.region} · Aktivita{" "}
                        {worker.activityScore} · Spoľahlivosť {worker.reliabilityScore}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready{" "}
                      {worker.lastReadyAt
                        ? format(worker.lastReadyAt, "d MMM HH:mm")
                        : "—"}
                    </p>
                  </div>

                  {first ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900">
                      <p className="font-semibold">Match (potvrdené)</p>
                      <p className="mt-1">
                        {first.job.company.companyName} · {first.job.title} ·{" "}
                        {format(first.job.startsAt, "d MMM HH:mm")}
                      </p>
                      {matches.length > 1 ? (
                        <p className="mt-1 text-[11px] text-emerald-800">
                          +{matches.length - 1} ďalších potvrdených zmien
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Zatiaľ bez potvrdenej smeny (len ready signál).
                    </p>
                  )}
                </div>
              );
            })}
            {monitor.readyWorkers.length > 24 ? (
              <p className="pt-2 text-xs text-muted-foreground">
                Zobrazených 24 záznamov.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Firmy</h2>
            <p className="text-sm text-muted-foreground">
              Onboarding dokončený ({monitor.companies.length})
            </p>
          </div>
        </div>

        {companiesSorted.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Zatiaľ tu nie sú žiadne firmy.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {companiesSorted.slice(0, 24).map((company) => {
              const matches = matchesByCompany.get(company.id) ?? [];
              const shown = matches.slice(0, 2);
              return (
                <div
                  key={company.id}
                  className="rounded-2xl border border-border/70 bg-background p-4"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {company.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {company.addressCity}, {company.region} ·{" "}
                        {company.isApproved ? "Schválená" : "Čaká na schválenie"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Match: {matches.length}
                    </span>
                  </div>

                  {shown.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {shown.map((match) => (
                        <div
                          key={match.id}
                          className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground"
                        >
                          <p className="font-semibold">
                            {match.worker.name} · potvrdený
                          </p>
                          <p className="text-muted-foreground">
                            {match.job.title} ·{" "}
                            {format(match.job.startsAt, "d MMM HH:mm")}
                          </p>
                        </div>
                      ))}
                      {matches.length > shown.length ? (
                        <p className="text-[11px] text-muted-foreground">
                          +{matches.length - shown.length} ďalších potvrdených matchov
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Zatiaľ bez potvrdeného matchu s ready pracovníkom.
                    </p>
                  )}
                </div>
              );
            })}
            {companiesSorted.length > 24 ? (
              <p className="pt-2 text-xs text-muted-foreground">
                Zobrazených 24 záznamov.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
