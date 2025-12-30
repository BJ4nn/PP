"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JobSlotsWidget({
  jobId,
  neededWorkers,
  confirmedCount,
}: {
  jobId: string;
  neededWorkers: number;
  confirmedCount: number;
}) {
  const [value, setValue] = useState<number>(neededWorkers);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const clamp = (next: number) => Math.max(1, Math.min(999, next));

  const save = (next: number) => {
    startTransition(async () => {
      setError(null);
      setInfo(null);
      const res = await fetch(`/api/company/jobs/${jobId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ neededWorkers: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nepodarilo sa uložiť sloty");
        return;
      }
      setValue(next);
      setInfo("Uložené.");
      window.location.reload();
    });
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Slots</h3>
          <p className="text-xs text-muted-foreground">
            Potvrdení: {confirmedCount} / {neededWorkers}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || value <= confirmedCount}
          onClick={() => {
            const next = clamp(value - 1);
            setValue(next);
            save(next);
          }}
        >
          -1
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            const next = clamp(value + 1);
            setValue(next);
            save(next);
          }}
        >
          +1
        </Button>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={999}
            value={value}
            onChange={(e) => setValue(clamp(Number(e.target.value || neededWorkers)))}
            className="w-24"
          />
          <Button
            type="button"
            size="sm"
            disabled={pending || value < confirmedCount}
            onClick={() => save(value)}
          >
            Uložiť
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Sloty nemôžu byť nižšie než počet potvrdených pracovníkov.
      </p>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {info ? <p className="mt-2 text-sm text-emerald-700">{info}</p> : null}
    </section>
  );
}
