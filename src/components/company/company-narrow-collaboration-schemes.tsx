"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { DayOfWeek } from "@/types";
import { dayLabels, dayOptions } from "@/components/worker/worker-onboarding-constants";
import type { NarrowCollaborationSchemeRow } from "@/server/services/narrow-collaboration";

type Props = {
  initialSchemes: NarrowCollaborationSchemeRow[];
};

export function CompanyNarrowCollaborationSchemes({ initialSchemes }: Props) {
  const [schemes, setSchemes] = useState(initialSchemes);
  const [name, setName] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: DayOfWeek) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day],
    );
  };

  const createScheme = () => {
    setMessage(null);
    setError(null);
    const orderedDays = dayOptions.filter((day) => daysOfWeek.includes(day));
    startTransition(async () => {
      const res = await fetch("/api/company/narrow-collaboration/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, daysOfWeek: orderedDays }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Schému sa nepodarilo uložiť.");
        return;
      }
      setSchemes((prev) => [
        ...prev,
        { id: data.id, name: data.name, daysOfWeek: data.daysOfWeek as DayOfWeek[] },
      ]);
      setName("");
      setDaysOfWeek([]);
      setMessage("Schéma uložená.");
    });
  };

  const removeScheme = (id: string) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/company/narrow-collaboration/schemes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Schému sa nepodarilo odstrániť.");
        return;
      }
      setSchemes((prev) => prev.filter((scheme) => scheme.id !== id));
      setMessage("Schéma odstránená.");
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background p-4 text-xs text-muted-foreground">
      <div>
        <p className="text-sm font-semibold text-foreground">Schémy zmien</p>
        <p className="text-xs text-muted-foreground">
          Vyberte dni v týždni, ktoré worker získa jedným klikom.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1.2fr_auto] sm:items-end">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">
            Názov schémy
          </label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="5 dní (Po–Pi)"
          />
        </div>
        <Button
          size="sm"
          onClick={createScheme}
          disabled={pending || !name.trim() || daysOfWeek.length === 0}
        >
          {pending ? "Ukladáme..." : "Pridať"}
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {dayOptions.map((day) => (
          <label
            key={day}
            className="flex items-center gap-2 rounded-xl border border-border bg-muted/10 px-3 py-2 text-xs text-foreground"
          >
            <Checkbox
              checked={daysOfWeek.includes(day)}
              onCheckedChange={() => toggleDay(day)}
            />
            <span>{dayLabels[day]}</span>
          </label>
        ))}
      </div>

      {schemes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground">
          Zatiaľ nemáte vytvorenú žiadnu schému zmien.
        </div>
      ) : (
        <div className="space-y-2">
          {schemes.map((scheme) => (
            <div
              key={scheme.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold text-foreground">{scheme.name}</p>
                <p className="text-xs text-muted-foreground">
                  {dayOptions
                    .filter((day) => scheme.daysOfWeek.includes(day))
                    .map((day) => dayLabels[day])
                    .join(", ")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeScheme(scheme.id)}
                disabled={pending}
              >
                Odstrániť
              </Button>
            </div>
          ))}
        </div>
      )}

      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
