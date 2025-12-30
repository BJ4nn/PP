"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ShiftType, type DayOfWeek } from "@/types";
import { dayLabels, shiftLabels } from "@/components/worker/worker-onboarding-constants";

type Scheme = {
  id: string;
  name: string;
  daysOfWeek: DayOfWeek[];
};

type Group = {
  id: string;
  name: string;
  maxAdvanceWeeks: number;
};

type Props = {
  companyId: string;
  group: Group | null;
  schemes: Scheme[];
  cutoffHour: number;
};

const shiftOptions = [ShiftType.MORNING, ShiftType.AFTERNOON];

const weekLabels = new Map([
  [1, "1 týždeň"],
  [2, "2 týždne"],
  [3, "3 týždne"],
  [4, "1 mesiac"],
]);

export function WorkerNarrowCollaborationPlanner({
  companyId,
  group,
  schemes,
  cutoffHour,
}: Props) {
  const [schemeId, setSchemeId] = useState(schemes[0]?.id ?? "");
  const [shiftType, setShiftType] = useState<ShiftType>(ShiftType.MORNING);
  const [weeks, setWeeks] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedScheme = useMemo(
    () => schemes.find((scheme) => scheme.id === schemeId) ?? null,
    [schemeId, schemes],
  );

  const weekOptions = useMemo(() => {
    const maxWeeks = group?.maxAdvanceWeeks ?? 1;
    return Array.from({ length: maxWeeks }, (_, idx) => idx + 1);
  }, [group]);

  const applySchedule = () => {
    if (!schemeId) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/worker/companies/${companyId}/narrow-schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schemeId, shiftType, weeks }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nepodarilo sa nahodiť zmeny.");
        return;
      }
      const applied = Number(data?.appliedCount ?? 0);
      const existing = Number(data?.alreadyAppliedCount ?? 0);
      const skipped = Number(data?.skippedCount ?? 0);
      setMessage(
        `Nahodené: ${applied} · už prihlásené: ${existing} · vynechané: ${skipped}`,
      );
    });
  };

  if (!group) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
        Firma vám zatiaľ nepriradila skupinu užšej spolupráce.
      </div>
    );
  }

  if (schemes.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
        Firma zatiaľ nevytvorila žiadne schémy zmien.
      </div>
    );
  }

  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Užšia spolupráca · plánovač
        </h2>
        <p className="text-sm text-muted-foreground">
          Skupina {group.name} · max {group.maxAdvanceWeeks} týž. dopredu · cutoff{" "}
          {String(cutoffHour).padStart(2, "0")}:00
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.7fr_auto] md:items-end">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            Schéma dní
          </label>
          <Select
            value={schemeId}
            onChange={(event) => setSchemeId(event.target.value)}
          >
            {schemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            Typ smeny
          </label>
          <Select
            value={shiftType}
            onChange={(event) => setShiftType(event.target.value as ShiftType)}
          >
            {shiftOptions.map((option) => (
              <option key={option} value={option}>
                {shiftLabels[option]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            Rozsah
          </label>
          <Select
            value={String(weeks)}
            onChange={(event) => setWeeks(Number(event.target.value))}
          >
            {weekOptions.map((option) => (
              <option key={option} value={option}>
                {weekLabels.get(option) ?? `${option} týž.`}
              </option>
            ))}
          </Select>
        </div>
        <Button size="sm" onClick={applySchedule} disabled={pending || !schemeId}>
          {pending ? "Nahadzujeme..." : "Nahodiť zmeny"}
        </Button>
      </div>

      {selectedScheme ? (
        <p className="text-xs text-muted-foreground">
          Vybrané dni:{" "}
          {selectedScheme.daysOfWeek.map((day) => dayLabels[day]).join(", ")}
        </p>
      ) : null}

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
