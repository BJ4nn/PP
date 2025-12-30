"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  applicationId: string;
  shiftEnded: boolean;
  workedConfirmedAtIso: string | null;
  workerWorkedConfirmedAtIso: string | null;
};

export function WorkerWorkedConfirmCard({
  applicationId,
  shiftEnded,
  workedConfirmedAtIso,
  workerWorkedConfirmedAtIso,
}: Props) {
  const companyConfirmedAt = workedConfirmedAtIso ? new Date(workedConfirmedAtIso) : null;
  const workerConfirmedAt = workerWorkedConfirmedAtIso ? new Date(workerWorkedConfirmedAtIso) : null;
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const confirm = () => {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const trimmed = note.trim();
      const payload: { applicationId: string; note?: string } = { applicationId };
      if (trimmed) payload.note = trimmed;
      const res = await fetch("/api/worker/applications/worked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nepodarilo sa potvrdiť dochádzku");
        return;
      }
      setSaved(true);
      window.location.reload();
    });
  };

  if (!shiftEnded) {
    return (
      <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Dochádzka (Beta): potvrdenie bude dostupné po skončení smeny.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold text-foreground">Dochádzka (Beta)</p>
        <p className="text-xs text-muted-foreground">
          Firma: {companyConfirmedAt ? format(companyConfirmedAt, "d MMM HH:mm") : "nepotvrdené"} · Vy:{" "}
          {workerConfirmedAt ? format(workerConfirmedAt, "d MMM HH:mm") : "nepotvrdené"}
        </p>
      </div>

      {workerConfirmedAt ? (
        <p className="mt-2 text-sm text-emerald-700">
          Potvrdené. Ďakujeme.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <Label htmlFor={`workedNote-${applicationId}`}>Poznámka (voliteľné)</Label>
            <Input
              id={`workedNote-${applicationId}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="napr. prišiel som o 10 min neskôr"
            />
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button onClick={confirm} disabled={pending}>
              {pending ? "Potvrdzujeme..." : "Potvrdiť odpracovanú smenu"}
            </Button>
            {saved ? <p className="text-sm text-emerald-700">Uložené.</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
