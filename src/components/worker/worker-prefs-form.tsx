"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Prefs = {
  minHourlyRate: number | null;
};

const toNumberOrNull = (value: string) => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function WorkerPrefsForm({
  initialPrefs,
}: {
  initialPrefs: Prefs;
}) {
  const [prefs, setPrefs] = useState(() => ({ ...initialPrefs }));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      setError(null);
      setSaved(false);

      const response = await fetch("/api/worker/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.error ?? "Nepodarilo sa uložiť preferencie");
        return;
      }

      const updated = (await response.json()) as Prefs;
      setPrefs(updated);
      setSaved(true);
    });
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Pracovné preferencie
        </h2>
        <p className="text-sm text-muted-foreground">
          Tieto nastavenia filtrujú ponuky a určujú, či sa môžete prihlásiť.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="minHourlyRate">Min. sadzba (všeobecne)</Label>
          <Input
            id="minHourlyRate"
            type="number"
            min={0}
            step="0.5"
            placeholder="napr. 13"
            value={prefs.minHourlyRate ?? ""}
            onChange={(e) =>
              setPrefs((prev) => ({ ...prev, minHourlyRate: toNumberOrNull(e.target.value) }))
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Button onClick={save} disabled={pending}>
          {pending ? "Ukladáme..." : "Uložiť preferencie"}
        </Button>
        {saved ? (
          <p className="text-sm text-emerald-700">Uložené.</p>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </section>
  );
}
