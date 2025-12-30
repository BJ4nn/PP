"use client";

import { useMemo, useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WorkedConfirmationClientItem = {
  applicationId: string;
  workerName: string;
  workerCity: string;
  jobTitle: string;
  shiftWindow: string;
  endedAtIso: string;
};

type Props = {
  items: WorkedConfirmationClientItem[];
};

function StarPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={cn(
            "rounded-lg border px-2 py-1 text-xs font-semibold transition",
            value !== null && n <= value
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-border bg-background text-muted-foreground hover:border-primary/60",
          )}
          onClick={() => onChange(value === n ? null : n)}
          aria-label={`${n} stars`}
        >
          ★
        </button>
      ))}
      <button
        type="button"
        className="ml-2 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
        onClick={() => onChange(null)}
      >
        Bez hodnotenia
      </button>
    </div>
  );
}

export function WorkedConfirmationsPanel({ items }: Props) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [ratingStars, setRatingStars] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  const selectedIds = useMemo(
    () => items.filter((i) => selected[i.applicationId]).map((i) => i.applicationId),
    [items, selected],
  );

  const allSelected = selectedIds.length > 0 && selectedIds.length === items.length;

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const item of items) next[item.applicationId] = true;
    setSelected(next);
  };

  const confirmSelected = () => {
    startTransition(async () => {
      setError("");
      if (selectedIds.length === 0) {
        setError("Vyberte aspoň jednu zmenu na potvrdenie.");
        return;
      }
      const payload: Record<string, unknown> = { applicationIds: selectedIds };
      if (ratingStars !== null) payload.ratingStars = ratingStars;

      const res = await fetch("/api/company/applications/worked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Nepodarilo sa potvrdiť odpracované zmeny");
        return;
      }

      window.location.reload();
    });
  };

  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Odpracované zmeny</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nemáte nič na potvrdenie. Keď skončí potvrdená zmena, zobrazí sa tu.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Na potvrdenie odpracovania</h2>
          <p className="text-sm text-muted-foreground">
            Skončené a potvrdené zmeny ({items.length})
          </p>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Hodnotenie (voliteľné)</div>
          <StarPicker value={ratingStars} onChange={setRatingStars} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => toggleAll(checked)}
          />
          <span className="text-sm text-muted-foreground">Vybrať všetko</span>
        </div>
        <Button disabled={pending} onClick={confirmSelected}>
          Potvrdiť odpracované ({selectedIds.length})
        </Button>
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const checked = Boolean(selected[item.applicationId]);
          return (
            <div
              key={item.applicationId}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(next) =>
                    setSelected((prev) => ({ ...prev, [item.applicationId]: next }))
                  }
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.workerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.workerCity} · {item.shiftWindow}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.jobTitle}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Skončilo: {new Date(item.endedAtIso).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

