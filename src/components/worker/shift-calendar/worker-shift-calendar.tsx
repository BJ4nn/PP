"use client";

import Link from "next/link";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { WorkerJobCard } from "@/components/worker/job-card";
import type {
  WorkerCalendarDayClient,
  WorkerCalendarMyShiftClient,
} from "@/server/services/worker-calendar";
import { addMonths, buildHref, getMonthStartOffset, monthShortLabel } from "./calendar-utils";

type Props = {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  days: WorkerCalendarDayClient[];
  basePath: string;
  extraQuery?: Record<string, string | undefined>;
  initialSelectedDateKey?: string;
};

export function WorkerShiftCalendar({
  monthKey,
  monthLabel,
  days,
  basePath,
  extraQuery,
  initialSelectedDateKey,
}: Props) {
  const prevMonth = addMonths(monthKey, -1);
  const nextMonth = addMonths(monthKey, 1);
  const offset = getMonthStartOffset(monthKey);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    initialSelectedDateKey ?? null,
  );

  const selectedDay = useMemo(
    () => (selectedDateKey ? days.find((d) => d.dateKey === selectedDateKey) ?? null : null),
    [days, selectedDateKey],
  );

  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Kalendár smien</h2>
          <p className="text-sm text-muted-foreground">
            Rozkliknite deň a zobrazia sa dostupné ponuky (a vaše potvrdené zmeny).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/60"
            href={buildHref(basePath, prevMonth, extraQuery)}
          >
            ← {monthShortLabel(prevMonth)}
          </Link>
          <div className="rounded-full border border-border bg-muted/40 px-4 py-2 text-xs font-semibold text-foreground">
            {monthLabel}
          </div>
          <Link
            className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/60"
            href={buildHref(basePath, nextMonth, extraQuery)}
          >
            {monthShortLabel(nextMonth)} →
          </Link>
        </div>
      </div>

      <div className="sm:overflow-x-auto sm:pb-2">
        <div className="space-y-2 sm:min-w-[620px]">
          <div className="hidden grid-cols-7 gap-2 text-xs font-semibold text-muted-foreground sm:grid">
            {["Po", "Ut", "St", "Št", "Pi", "So", "Ne"].map((label) => (
              <div key={label} className="px-2">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
            {Array.from({ length: offset }).map((_, idx) => (
              <div
                key={`pad-${idx}`}
                className="hidden min-h-[104px] rounded-2xl border border-border/40 bg-muted/20 sm:block"
              />
            ))}
            {days.map((day) => {
              const date = new Date(`${day.dateKey}T00:00:00Z`);
              const isSelected = selectedDateKey === day.dateKey;
              const hasAny = day.availableCount > 0 || day.myCount > 0;
              const dayLabel = format(date, "EEE", { locale: sk });

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() =>
                    setSelectedDateKey((prev) => (prev === day.dateKey ? null : day.dateKey))
                  }
                  className={cn(
                    "min-h-[72px] rounded-2xl border border-border bg-background p-3 text-left transition sm:min-h-[104px]",
                    "hover:border-primary/60 hover:bg-muted/10",
                    isSelected ? "border-primary ring-2 ring-primary/20" : null,
                  )}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <div className="text-sm font-semibold text-foreground">
                        {format(date, "d")}
                      </div>
                      <div className="text-xs uppercase text-muted-foreground sm:hidden">
                        {dayLabel}
                      </div>
                    </div>
                    {day.myCount > 0 ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                        Moje {day.myCount}
                      </span>
                    ) : null}
                  </div>

                  {hasAny ? (
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                      <div className="rounded-lg bg-muted/40 px-2 py-1">
                        Ponuky {day.availableCount}
                      </div>
                      <div className="rounded-lg bg-muted/40 px-2 py-1">
                        Moje {day.myCount}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-muted-foreground">—</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDay ? (
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">
              {format(new Date(`${selectedDay.dateKey}T00:00:00Z`), "d MMMM yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">
              Ponuky {selectedDay.availableCount} · moje zmeny {selectedDay.myCount}
            </p>
          </div>

          {selectedDay.myShifts.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-semibold text-foreground">Moje potvrdené zmeny</p>
              <div className="mt-2 grid gap-2">
                {selectedDay.myShifts.map((shift) => (
                  <MyShiftCard key={shift.applicationId} shift={shift} />
                ))}
              </div>
            </div>
          ) : null}

          {selectedDay.availableJobs.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-semibold text-foreground">Dostupné ponuky</p>
              <div className="mt-3 grid gap-3">
                {selectedDay.availableJobs.map((job) => (
                  <WorkerJobCard
                    key={job.id}
                    job={{
                      id: job.id,
                      title: job.title,
                      description: job.description,
                      locationCity: job.locationCity,
                      locationAddress: job.locationAddress,
                      region: job.region,
                      warehouseType: job.warehouseType as never,
                      startsAt: job.startsAtIso,
                      durationHours: job.durationHours,
                      hourlyRate: job.hourlyRate,
                      ...(job.effectiveHourlyRate !== undefined
                        ? { effectiveHourlyRate: job.effectiveHourlyRate }
                        : {}),
                      requiredVzv: job.requiredVzv,
                      isUrgent: job.isUrgent,
                      urgentBonusEur: job.urgentBonusEur,
                      confirmBy: job.confirmByIso,
                      isBundle: job.isBundle,
                      bundleMinHours: job.bundleMinHours,
                      bundleMinDays: job.bundleMinDays,
                      bundleBonusEur: job.bundleBonusEur,
                      bundleHourlyRateEur: job.bundleHourlyRateEur,
                      contractType: job.contractType as never,
                      noticeWindow: job.noticeWindow,
                      cancellationCompensationPct: job.cancellationCompensationPct,
                      relevanceScore: job.relevanceScore,
                      inviteStage: job.inviteStage,
                      isFavoriteCompany: job.isFavoriteCompany,
                      isVerifiedCompany: job.isVerifiedCompany,
                      isPriorityCompany: job.isPriorityCompany,
                      company: job.company,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              V tento deň nie sú žiadne dostupné ponuky.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Vyberte deň v kalendári.
        </div>
      )}
    </section>
  );
}

function MyShiftCard({ shift }: { shift: WorkerCalendarMyShiftClient }) {
  const startsAt = new Date(shift.startsAtIso);
  const endsAt = new Date(shift.endsAtIso);
  return (
    <div className="rounded-2xl border border-border bg-muted/10 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {shift.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {shift.companyName} · {shift.locationAddress}, {shift.locationCity},{" "}
            {shift.region}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(startsAt, "HH:mm")}–{format(endsAt, "HH:mm")}
          </p>
        </div>
        <Link
          className={cn(
            "rounded-full border border-border px-3 py-2 text-xs font-semibold",
            "text-muted-foreground hover:border-primary/60",
          )}
          href={`/worker/jobs/${shift.jobId}`}
        >
          Otvoriť detail
        </Link>
      </div>
    </div>
  );
}
