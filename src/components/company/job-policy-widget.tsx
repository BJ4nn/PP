"use client";

import { useState, useTransition } from "react";
import { NoticeWindow } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const noticeLabels: Record<NoticeWindow, string> = {
  [NoticeWindow.H12]: "12 hodín",
  [NoticeWindow.H24]: "24 hodín",
  [NoticeWindow.H48]: "48 hodín",
};

export function JobPolicyWidget({
  jobId,
  noticeWindow,
  cancellationCompensationPct,
}: {
  jobId: string;
  noticeWindow: NoticeWindow;
  cancellationCompensationPct: number;
}) {
  const [windowValue, setWindowValue] = useState<NoticeWindow>(noticeWindow);
  const [pctValue, setPctValue] = useState<number>(cancellationCompensationPct);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const res = await fetch(`/api/company/jobs/${jobId}/policy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noticeWindow: windowValue,
          cancellationCompensationPct: pctValue,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nepodarilo sa uložiť politiku");
        return;
      }
      setSaved(true);
      window.location.reload();
    });
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Notice politika</h3>
          <p className="text-xs text-muted-foreground">
            Určuje ochranu pred neskorým rušením a výšku kompenzácie.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="noticeWindow">Garancia storna</Label>
          <Select
            id="noticeWindow"
            value={windowValue}
            onChange={(e) => setWindowValue(e.target.value as NoticeWindow)}
          >
            {Object.values(NoticeWindow).map((value) => (
              <option key={value} value={value}>
                {noticeLabels[value]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="cancellationCompensationPct">Kompenzácia (%)</Label>
          <Input
            id="cancellationCompensationPct"
            type="number"
            min={0}
            max={100}
            step="5"
            value={pctValue}
            onChange={(e) => setPctValue(Number(e.target.value || 0))}
          />
          <p className="text-xs text-muted-foreground">
            Pri zrušení potvrdenej zmeny v rámci notice sa uloží kompenzácia.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button type="button" size="sm" disabled={pending} onClick={save}>
          {pending ? "Ukladáme..." : "Uložiť"}
        </Button>
        {saved ? <p className="text-sm text-emerald-700">Uložené.</p> : null}
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

