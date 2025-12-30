"use client";

import Link from "next/link";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { addMonths, buildHref, getMonthStartOffset, monthShortLabel } from "./calendar-utils";
import type { CalendarDayClient } from "./types";
import { JobApplicationsCard } from "./job-applications-card";
import { JobWaveStage } from "@/types";
import type { ContractType, NoticeWindow, Region, WarehouseType } from "@/types";

type Props = {
  monthKey: string; // YYYY-MM
  monthLabel: string;
  days: CalendarDayClient[];
  basePath: string;
  extraQuery?: Record<string, string | undefined>;
  canCreate?: boolean;
  initialSelectedDateKey?: string;
  initialSelectedJobId?: string;
  templateDefaults?: {
    locationCity: string;
    locationAddress: string;
    region: Region;
    warehouseType: WarehouseType;
    description: string;
    hourlyRate: number;
    neededWorkers: number;
    requiredVzv: boolean;
    noticeWindow: NoticeWindow;
    contractType: ContractType;
  };
};

function buildNewJobHref(
  params: Record<string, string | number | boolean | undefined>,
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `/company/jobs/new?${qs}` : "/company/jobs/new";
}

export function CompanyShiftCalendar({
  monthKey,
  monthLabel,
  days,
  basePath,
  extraQuery,
  canCreate = true,
  initialSelectedDateKey,
  initialSelectedJobId,
  templateDefaults,
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

  useEffect(() => {
    if (!initialSelectedJobId) return;
    if (!selectedDay) return;
    if (!selectedDay.jobs.some((j) => j.id === initialSelectedJobId)) return;
    const el = document.getElementById(`company-cal-job-${initialSelectedJobId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initialSelectedJobId, selectedDay]);

  const templates = useMemo(() => {
    if (!selectedDay || !templateDefaults) return [];
    const dateKey = selectedDay.dateKey;
    const base = {
      locationCity: templateDefaults.locationCity,
      locationAddress: templateDefaults.locationAddress,
      region: templateDefaults.region,
      warehouseType: templateDefaults.warehouseType,
      description: templateDefaults.description,
      neededWorkers: templateDefaults.neededWorkers,
      hourlyRate: templateDefaults.hourlyRate,
      requiredVzv: templateDefaults.requiredVzv,
      noticeWindow: templateDefaults.noticeWindow,
      contractType: templateDefaults.contractType,
    };
    return [
      {
        label: "Ranna 8h",
        title: "Ranna zmena",
        startsAt: `${dateKey}T08:00`,
        durationHours: 8,
        base,
      },
      {
        label: "Poobedna 8h",
        title: "Poobedna zmena",
        startsAt: `${dateKey}T14:00`,
        durationHours: 8,
        base,
      },
      {
        label: "Nocna 8h",
        title: "Nocna zmena",
        startsAt: `${dateKey}T22:00`,
        durationHours: 8,
        base,
      },
    ];
  }, [selectedDay, templateDefaults]);

  const waveOptions = [
    { stage: JobWaveStage.WAVE1, label: "1. vlna" },
    { stage: JobWaveStage.WAVE2, label: "2. vlna" },
    { stage: JobWaveStage.PUBLIC, label: "3. vlna" },
  ];

  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Kalendár zmien</h2>
          <p className="text-sm text-muted-foreground">
            Rozkliknite deň a potvrďte prihlášky alebo odpracované.
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
          const showTotals =
            day.neededWorkers > 0 || day.applicantsCount > 0 || day.confirmedCount > 0;
          const dayLabel = format(date, "EEE", { locale: sk });

          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => setSelectedDateKey((prev) => (prev === day.dateKey ? null : day.dateKey))}
              className={cn(
                "min-h-[72px] rounded-2xl border border-border bg-background p-3 text-left transition sm:min-h-[104px]",
                "hover:border-primary/60 hover:bg-muted/10",
                isSelected ? "border-primary ring-2 ring-primary/20" : null,
              )}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <div className="text-sm font-semibold text-foreground">{format(date, "d")}</div>
                  <div className="text-xs uppercase text-muted-foreground sm:hidden">{dayLabel}</div>
                </div>
                {day.missingCount > 0 ? (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-900">
                    Chýba {day.missingCount}
                  </span>
                ) : null}
              </div>

              {showTotals ? (
                <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                  <div className="rounded-lg bg-muted/40 px-2 py-1">Hlási sa {day.applicantsCount}</div>
                  <div className="rounded-lg bg-muted/40 px-2 py-1">Potvrdení {day.confirmedCount}</div>
                  <div className="rounded-lg bg-muted/40 px-2 py-1">Sloty {day.neededWorkers}</div>
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-muted-foreground">—</div>
              )}

              {day.jobs.length > 0 ? (
                <div className="mt-2 text-[10px] text-muted-foreground">
                  {day.jobs.length} {day.jobs.length === 1 ? "zmena" : "zmien"}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {selectedDay ? (
        <div className="rounded-2xl border border-border bg-background p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {format(new Date(`${selectedDay.dateKey}T00:00:00Z`), "d MMMM yyyy")}
              </p>
              <p className="text-xs text-muted-foreground">
                Prihlášky {selectedDay.applicantsCount} · potvrdení {selectedDay.confirmedCount} · chýba{" "}
                {selectedDay.missingCount}
              </p>
            </div>
          <div className="flex items-center gap-2">
            <Link
              className={cn(
                "rounded-full border border-border px-3 py-2 text-xs font-semibold",
                canCreate ? "text-foreground hover:border-primary/60" : "cursor-not-allowed text-muted-foreground opacity-60",
              )}
              href={canCreate ? buildNewJobHref({ date: selectedDay.dateKey }) : "#"}
              aria-disabled={!canCreate}
              onClick={(event) => {
                if (!canCreate) event.preventDefault();
              }}
            >
              + Pridať zmenu
            </Link>
            <Link
              className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/60"
              href="/company/jobs"
            >
              Ponuky zmien
            </Link>
          </div>
        </div>

        {canCreate && templates.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Vzory:
            </span>
            {templates.map((template) => (
              <div key={template.label} className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-semibold text-foreground">
                  {template.label}
                </span>
                {waveOptions.map((wave) => (
                  <Link
                    key={`${template.label}-${wave.stage}`}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/60"
                    href={buildNewJobHref({
                      ...template.base,
                      title: template.title,
                      startsAt: template.startsAt,
                      durationHours: template.durationHours,
                      waveStage: wave.stage,
                    })}
                  >
                    Poslat {wave.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ) : null}

      {selectedDay.jobs.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {selectedDay.jobs.map((job) => (
            <JobApplicationsCard
              key={job.id}
              job={job}
              highlighted={initialSelectedJobId === job.id}
            />
          ))}
        </div>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">Tento deň zatiaľ nemá žiadne zmeny.</div>
      )}
        </div>
      ) : null}
    </section>
  );
}
