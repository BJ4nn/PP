import Link from "next/link";
import type { CompanyKpis } from "@/server/services/company-kpis";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format/percent";

type Props = {
  kpis: CompanyKpis;
  basePath: string;
};

function formatScore(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value)}/100`;
}

function cardLabel(value: string, subtext?: string) {
  return (
    <div className="space-y-1">
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      {subtext ? <div className="text-xs text-muted-foreground">{subtext}</div> : null}
    </div>
  );
}

const RANGE_OPTIONS = [
  { days: 7, label: "7 dní" },
  { days: 30, label: "30 dní" },
  { days: 90, label: "90 dní" },
] as const;

export function CompanyKpiCards({ kpis, basePath }: Props) {
  const empty = kpis.neededSlots === 0 && kpis.applicationsTotal === 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Prehľad KPI</h2>
          <p className="text-sm text-muted-foreground">
            Posledných {kpis.rangeDays} dní · {kpis.slaHint}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => {
            const active = option.days === kpis.rangeDays;
            const href = option.days === 30 ? basePath : `${basePath}?range=${option.days}`;
            return (
              <Link
                key={option.days}
                href={href}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold transition",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/60",
                )}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      {empty ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Zatiaľ nie sú dáta na výpočet KPI v tomto období.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">Fill rate</p>
            <div className="mt-2">
              {cardLabel(
                formatPercent(kpis.fillRate),
                `${kpis.confirmedSlots}/${kpis.neededSlots} potvrdených slotov`,
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">Completion proxy</p>
            <div className="mt-2">
              {cardLabel(
                formatPercent(kpis.completionProxy),
                `${kpis.completedConfirmedShifts}/${kpis.confirmedShifts} dokončených potvrdení`,
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">Cancellation rate</p>
            <div className="mt-2">
              {cardLabel(
                formatPercent(kpis.cancellationRate),
                `${kpis.cancellationsTotal}/${kpis.applicationsTotal} storno · worker ${kpis.cancellationsByWorker}, company ${kpis.cancellationsByCompany}`,
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground">Avg. reliability</p>
            <div className="mt-2">
              {cardLabel(
                formatScore(kpis.avgApplicantReliability),
                "Priemer spoľahlivosti uchádzačov",
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
