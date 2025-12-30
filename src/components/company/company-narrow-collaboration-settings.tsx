"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type {
  NarrowCollaborationGroupRow,
  NarrowCollaborationSchemeRow,
} from "@/server/services/narrow-collaboration";
import { CompanyNarrowCollaborationGroups } from "@/components/company/company-narrow-collaboration-groups";
import { CompanyNarrowCollaborationSchemes } from "@/components/company/company-narrow-collaboration-schemes";

type Props = {
  advancedModeEnabled: boolean;
  initialCutoffHour: number;
  groups: NarrowCollaborationGroupRow[];
  schemes: NarrowCollaborationSchemeRow[];
};

const hourOptions = Array.from({ length: 13 }, (_, i) => i);

export function CompanyNarrowCollaborationSettings({
  advancedModeEnabled,
  initialCutoffHour,
  groups,
  schemes,
}: Props) {
  const [cutoffHour, setCutoffHour] = useState(initialCutoffHour);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!advancedModeEnabled) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/company/narrow-collaboration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cutoffHour }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nepodarilo sa ulozit nastavenie.");
        return;
      }
      setMessage("Cutoff cas ulozeny.");
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Cutoff čas pre užšiu spoluprácu
          </p>
          <p className="text-xs text-muted-foreground">
            Pracovník musí nahodiť zmenu najneskôr do tohto času deň pred začiatkom.
            Najneskôr 12:00, môžete nastaviť skôr.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select
            value={String(cutoffHour)}
            onChange={(event) => setCutoffHour(Number(event.target.value))}
            disabled={!advancedModeEnabled}
          >
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, "0")}:00
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            onClick={save}
            disabled={pending || !advancedModeEnabled}
          >
            {pending ? "Ukladáme..." : "Uložiť"}
          </Button>
        </div>
        {!advancedModeEnabled ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Advanced mode nie je aktívny. Požiadajte admina o sprístupnenie.
          </p>
        ) : null}
        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      <CompanyNarrowCollaborationSchemes initialSchemes={schemes} />
      <CompanyNarrowCollaborationGroups initialGroups={groups} />
    </div>
  );
}
