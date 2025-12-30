"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";

type Props = {
  workerId: string;
  initialPriority: boolean;
  initialNarrow: boolean;
  initialNarrowGroupId: string | null;
  hasWorked: boolean;
  narrowGroups: Array<{ id: string; name: string; maxAdvanceWeeks: number }>;
};

export function CompanyWorkerRelationPanel({
  workerId,
  initialPriority,
  initialNarrow,
  initialNarrowGroupId,
  hasWorked,
  narrowGroups,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [isPriority, setIsPriority] = useState(initialPriority);
  const [isNarrow, setIsNarrow] = useState(initialNarrow);
  const [narrowGroupId, setNarrowGroupId] = useState<string | null>(
    initialNarrowGroupId,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNarrowToggle = (value: boolean) => {
    setIsNarrow(value);
    if (!value) {
      setNarrowGroupId(null);
    } else if (!narrowGroupId && narrowGroups.length > 0) {
      setNarrowGroupId(narrowGroups[0]?.id ?? null);
    }
  };

  const save = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/company/workers/${workerId}/relation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPriority,
          isNarrowCollaboration: isNarrow,
          narrowGroupId: isNarrow ? narrowGroupId : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nepodarilo sa uložiť nastavenia.");
        return;
      }
      setMessage("Nastavenia uložené.");
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
      <div>
        <p className="font-semibold text-foreground">Užšia spolupráca</p>
        <p className="text-xs text-muted-foreground">
          Povolené len pre pracovníkov s potvrdenou odpracovanou zmenou.
        </p>
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <Checkbox
            type="checkbox"
            checked={isPriority}
            disabled={!hasWorked}
            onCheckedChange={(value) => setIsPriority(Boolean(value))}
          />
          <span>Prioritná skupina (1. vlna)</span>
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            type="checkbox"
            checked={isNarrow}
            disabled={!hasWorked}
            onCheckedChange={(value) => handleNarrowToggle(Boolean(value))}
          />
          <span>Sprístupniť užšiu spoluprácu</span>
        </label>
      </div>
      {isNarrow ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Skupina pre plánovanie
          </p>
          {narrowGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-3 text-xs text-muted-foreground">
              Najprv vytvorte skupinu v nastaveniach užšej spolupráce.
            </div>
          ) : (
            <Select
              value={narrowGroupId ?? ""}
              onChange={(event) => setNarrowGroupId(event.target.value || null)}
              disabled={!hasWorked}
            >
              <option value="">Bez skupiny</option>
              {narrowGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} · {group.maxAdvanceWeeks} týž.
                </option>
              ))}
            </Select>
          )}
        </div>
      ) : null}
      {!hasWorked ? (
        <p className="text-xs text-muted-foreground">
          Pracovník ešte nemá potvrdenú odpracovanú zmenu.
        </p>
      ) : null}
      <Button size="sm" onClick={save} disabled={pending || !hasWorked}>
        {pending ? "Ukladáme..." : "Uložiť"}
      </Button>
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
