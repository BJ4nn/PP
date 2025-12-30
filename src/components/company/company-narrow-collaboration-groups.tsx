"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { NarrowCollaborationGroupRow } from "@/server/services/narrow-collaboration";

type Props = {
  initialGroups: NarrowCollaborationGroupRow[];
};

const weekOptions = [
  { value: 1, label: "1 týždeň" },
  { value: 2, label: "2 týždne" },
  { value: 3, label: "3 týždne" },
  { value: 4, label: "1 mesiac" },
];

export function CompanyNarrowCollaborationGroups({ initialGroups }: Props) {
  const [groups, setGroups] = useState(initialGroups);
  const [name, setName] = useState("");
  const [maxAdvanceWeeks, setMaxAdvanceWeeks] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createGroup = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/company/narrow-collaboration/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, maxAdvanceWeeks }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Skupinu sa nepodarilo uložiť.");
        return;
      }
      setGroups((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          maxAdvanceWeeks: data.maxAdvanceWeeks,
          workerCount: 0,
        },
      ]);
      setName("");
      setMaxAdvanceWeeks(1);
      setMessage("Skupina uložená.");
    });
  };

  const removeGroup = (id: string) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/company/narrow-collaboration/groups/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Skupinu sa nepodarilo odstrániť.");
        return;
      }
      setGroups((prev) => prev.filter((group) => group.id !== id));
      setMessage("Skupina odstránená.");
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background p-4 text-xs text-muted-foreground">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Skupiny užšej spolupráce
        </p>
        <p className="text-xs text-muted-foreground">
          Určite, ako dlho dopredu si môžu pracovníci plánovať zmeny.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1.2fr_0.8fr_auto] sm:items-end">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">
            Názov skupiny
          </label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Např. Stabilný tím"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">
            Rozsah plánovania
          </label>
          <Select
            value={String(maxAdvanceWeeks)}
            onChange={(event) => setMaxAdvanceWeeks(Number(event.target.value))}
          >
            {weekOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <Button size="sm" onClick={createGroup} disabled={pending || !name.trim()}>
          {pending ? "Ukladáme..." : "Pridať"}
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-muted-foreground">
          Zatiaľ nemáte vytvorenú žiadnu skupinu.
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/20 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold text-foreground">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {weekOptions.find((option) => option.value === group.maxAdvanceWeeks)
                    ?.label ?? `${group.maxAdvanceWeeks} týž.`}
                  {" · "}
                  {group.workerCount} pracovníkov
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeGroup(group.id)}
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
