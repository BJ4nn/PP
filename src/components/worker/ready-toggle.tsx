"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  initialReady: boolean;
};

export function WorkerReadyToggle({ initialReady }: Props) {
  const [isReady, setIsReady] = useState(initialReady);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateReady = (next: boolean) => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch("/api/worker/ready", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReady: next }),
      });

      if (!response.ok) {
        const data = await response.json();
        setMessage(data?.error ?? "Nepodarilo sa upraviť stav");
        return;
      }

      setIsReady(next);
      setMessage(
        next ? "Ste medzi pripravenými pracovníkmi." : "Nie ste označený ako pripravený.",
      );
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Som pripravený na zmeny
          </p>
          <p className="text-xs text-muted-foreground">
            Po zapnutí sa zobrazíte firmám medzi prvými ponukami.
          </p>
        </div>
        <label className="inline-flex items-start gap-2 text-sm font-medium text-foreground sm:items-center">
          <Checkbox
            checked={isReady}
            onChange={(event) => updateReady(event.target.checked)}
            disabled={pending}
          />
          {isReady ? "Pripravený" : "Nepripravený"}
        </label>
      </div>
      {message ? (
        <p className="mt-2 text-xs text-muted-foreground">{message}</p>
      ) : null}
      {!isReady ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={pending}
          onClick={() => updateReady(true)}
        >
          Označiť ako pripravený
        </Button>
      ) : null}
    </div>
  );
}
