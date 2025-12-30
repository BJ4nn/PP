"use client";

import { useMemo, useState, useTransition } from "react";
import { JobWaveStage } from "@/types";
import { Button } from "@/components/ui/button";

const WAVE_DELAY_HOURS = 12;

const waveLabel: Record<JobWaveStage, string> = {
  [JobWaveStage.WAVE1]: "1. vlna (prioritná skupina)",
  [JobWaveStage.WAVE2]: "2. vlna (overení pracovníci)",
  [JobWaveStage.PUBLIC]: "3. vlna (všetci)",
};

const waveOrder: Record<JobWaveStage, number> = {
  [JobWaveStage.WAVE1]: 1,
  [JobWaveStage.WAVE2]: 2,
  [JobWaveStage.PUBLIC]: 3,
};

function autoWaveStage(waveStartedAt: Date, now = new Date()) {
  const hoursSince = (now.getTime() - waveStartedAt.getTime()) / (60 * 60 * 1000);
  if (hoursSince >= WAVE_DELAY_HOURS * 2) return JobWaveStage.PUBLIC;
  if (hoursSince >= WAVE_DELAY_HOURS) return JobWaveStage.WAVE2;
  return JobWaveStage.WAVE1;
}

type Props = {
  jobId: string;
  waveStage: JobWaveStage;
  waveStartedAt: string;
  isActive: boolean;
};

export function JobWaveActions({
  jobId,
  waveStage,
  waveStartedAt,
  isActive,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { effectiveStage, nextAutoAt } = useMemo(() => {
    const started = new Date(waveStartedAt);
    const autoStage = autoWaveStage(started);
    const effective =
      waveOrder[waveStage] >= waveOrder[autoStage] ? waveStage : autoStage;
    let next = null as Date | null;
    if (autoStage === JobWaveStage.WAVE1) {
      next = new Date(started.getTime() + WAVE_DELAY_HOURS * 60 * 60 * 1000);
    } else if (autoStage === JobWaveStage.WAVE2) {
      next = new Date(started.getTime() + WAVE_DELAY_HOURS * 2 * 60 * 60 * 1000);
    }
    return { effectiveStage: effective, nextAutoAt: next };
  }, [waveStage, waveStartedAt]);

  const updateWave = (nextStage: JobWaveStage) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/company/jobs/${jobId}/wave`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waveStage: nextStage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nepodarilo sa zmeniť vlnu.");
        return;
      }
      setMessage("Vlna aktualizovaná.");
      window.location.reload();
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
      <div>
        <p className="font-semibold text-foreground">Vlny rozoslania</p>
        <p className="text-xs text-muted-foreground">
          Aktuálna vlna: {waveLabel[effectiveStage]}
        </p>
        {nextAutoAt ? (
          <p className="text-xs text-muted-foreground">
            Automaticky prejde ďalej: {nextAutoAt.toLocaleString("sk-SK")}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!isActive || pending || waveOrder[effectiveStage] >= waveOrder[JobWaveStage.WAVE2]}
          onClick={() => updateWave(JobWaveStage.WAVE2)}
        >
          Spustiť 2. vlnu
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!isActive || pending || waveOrder[effectiveStage] >= waveOrder[JobWaveStage.PUBLIC]}
          onClick={() => updateWave(JobWaveStage.PUBLIC)}
        >
          Spustiť 3. vlnu (všetci)
        </Button>
      </div>
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
