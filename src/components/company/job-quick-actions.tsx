"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApplicationStatus, JobStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PendingApplicant = {
  id: string;
  workerName: string;
  matchScore: number;
};

type Props = {
  jobId: string;
  status: JobStatus;
  neededWorkers: number;
  confirmedCount: number;
  pendingApplicants: PendingApplicant[];
};

export function JobQuickActions({
  jobId,
  status: initialStatus,
  neededWorkers,
  confirmedCount,
  pendingApplicants: initialApplicants,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const [slots, setSlots] = useState<number>(neededWorkers);
  const [applicants, setApplicants] = useState<PendingApplicant[]>(() => initialApplicants);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActive = status === JobStatus.OPEN || status === JobStatus.FULL;
  const canClose = isActive;

  const clampSlots = (value: number) =>
    Math.max(Math.max(1, confirmedCount), Math.min(999, value));

  const topApplicants = useMemo(() => applicants.slice(0, 3), [applicants]);

  const updateSlots = (next: number) => {
    if (!isActive) {
      setError("Sloty sa dajú meniť len pri aktívnej zmene.");
      return;
    }
    const optimistic = clampSlots(next);
    const prev = slots;
    setSlots(optimistic);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const res = await fetch(`/api/company/jobs/${jobId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ neededWorkers: optimistic }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSlots(prev);
        setError(data?.error ?? "Nepodarilo sa upraviť sloty");
        return;
      }
      setMessage("Sloty uložené.");
      router.refresh();
    });
  };

  const updateStatus = (next: JobStatus) => {
    const prev = status;
    setStatus(next);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const res = await fetch(`/api/company/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(prev);
        setError(data?.error ?? "Nepodarilo sa zmeniť stav");
        return;
      }
      setMessage("Stav zmeny aktualizovaný.");
      router.refresh();
    });
  };

  const setApplicantStatus = (id: string, nextStatus: ApplicationStatus) => {
    if (!isActive) {
      setError("Zmena nie je aktívna.");
      return;
    }
    const prev = applicants;
    setApplicants((current) => current.filter((a) => a.id !== id));
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const res = await fetch(`/api/company/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApplicants(prev);
        setError(data?.error ?? "Nepodarilo sa uložiť rozhodnutie");
        return;
      }
      setMessage(nextStatus === ApplicationStatus.CONFIRMED ? "Pracovník potvrdený." : "Prihláška zamietnutá.");
      router.refresh();
    });
  };

  return (
    <aside className="sticky top-6 space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Quick actions</h3>
        <p className="text-xs text-muted-foreground">
          Rýchle úpravy bez hľadania v detaile.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Slots</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !isActive || slots <= confirmedCount}
            onClick={() => updateSlots(slots - 1)}
          >
            -1
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !isActive}
            onClick={() => updateSlots(slots + 1)}
          >
            +1
          </Button>
          <Input
            className="w-24"
            type="number"
            min={Math.max(1, confirmedCount)}
            max={999}
            value={slots}
            disabled={!isActive}
            onChange={(e) => setSlots(clampSlots(Number(e.target.value || neededWorkers)))}
          />
          <Button
            type="button"
            size="sm"
            disabled={pending || !isActive || slots < confirmedCount}
            onClick={() => updateSlots(slots)}
          >
            Uložiť
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Potvrdení: {confirmedCount}/{slots}
        </p>
        {!isActive ? (
          <p className="text-xs text-muted-foreground">
            Zmena je uzavretá alebo zrušená. Sloty sa už nedajú upravovať.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !canClose}
            onClick={() => updateStatus(JobStatus.CLOSED)}
          >
            Uzavrieť
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !canClose}
            onClick={() => updateStatus(JobStatus.CANCELLED)}
          >
            Zrušiť
          </Button>
      </div>

      {topApplicants.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Rýchle schválenie</p>
          <div className="space-y-2">
            {topApplicants.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-border bg-background/70 p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.workerName}</p>
                    <p className="text-xs text-muted-foreground">
                      Match {Math.round(a.matchScore)}/100
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={pending || !isActive}
                      onClick={() => setApplicantStatus(a.id, ApplicationStatus.CONFIRMED)}
                    >
                      Potvrdiť
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending || !isActive}
                      onClick={() => setApplicantStatus(a.id, ApplicationStatus.REJECTED)}
                    >
                      Zamietnuť
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Kompletný zoznam je nižšie v sekcii Prihlášky.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Žiadne čakajúce prihlášky.</p>
      )}

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </aside>
  );
}
