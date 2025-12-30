"use client";

import { DayOfWeek, ShiftType } from "@/types";
import {
  dayLabels,
  dayOptions,
  shiftLabels,
  shiftOptions,
} from "@/components/worker/worker-onboarding-constants";

export function WorkerAvailabilityPicker({
  selectedDays,
  selectedShifts,
  toggleAvailabilityItem,
  onSelectAllDays,
  onClearDays,
  dayError,
  shiftError,
}: {
  selectedDays: DayOfWeek[];
  selectedShifts: ShiftType[];
  toggleAvailabilityItem: (
    key: "daysOfWeek" | "shiftTypes",
    value: DayOfWeek | ShiftType,
  ) => void;
  onSelectAllDays: () => void;
  onClearDays: () => void;
  dayError?: string | undefined;
  shiftError?: string | undefined;
}) {
  const allDaysSelected = selectedDays.length === dayOptions.length;

  return (
    <>
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Dostupnosť · dni v týždni
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={onSelectAllDays}
            className="rounded-full border border-border bg-background px-3 py-1 font-semibold text-muted-foreground hover:border-primary/60"
          >
            Označiť všetky
          </button>
          {selectedDays.length > 0 ? (
            <button
              type="button"
              onClick={onClearDays}
              className="rounded-full border border-border bg-background px-3 py-1 font-semibold text-muted-foreground hover:border-primary/60"
            >
              Zrušiť výber
            </button>
          ) : null}
          {allDaysSelected ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              Všetky dni
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {dayOptions.map((day) => {
            const selected = selectedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleAvailabilityItem("daysOfWeek", day)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {dayLabels[day]}
              </button>
            );
          })}
        </div>
        {dayError ? <p className="text-sm text-destructive">{dayError}</p> : null}
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Dostupnosť · preferované zmeny
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {shiftOptions.map((shift) => {
            const selected = selectedShifts.includes(shift);
            return (
              <button
                key={shift}
                type="button"
                onClick={() => toggleAvailabilityItem("shiftTypes", shift)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {shiftLabels[shift]}
              </button>
            );
          })}
        </div>
        {shiftError ? (
          <p className="text-sm text-destructive">{shiftError}</p>
        ) : null}
      </div>
    </>
  );
}
