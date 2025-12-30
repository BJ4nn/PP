"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  jobId: string;
  requiresBundleConsent?: boolean;
};

export function JobApplyForm({ jobId, requiresBundleConsent }: Props) {
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [consent, setConsent] = useState(false);

  const apply = () => {
    startTransition(async () => {
      setMessage(null);
      const response = await fetch(`/api/worker/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMessage = data?.error ?? "Prihlášku sa nepodarilo odoslať";
        if (typeof errorMessage === "string" && errorMessage.includes("already applied")) {
          setSubmitted(true);
          setMessage("Prihláška odoslaná.");
          return;
        }
        setMessage(errorMessage);
        return;
      }
      setSubmitted(true);
      setMessage("Prihláška odoslaná.");
      setNote("");
    });
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Dobrovoľná poznámka pre firmu"
        className="min-h-[96px]"
        value={note}
        disabled={submitted}
        onChange={(event) => setNote(event.target.value)}
      />
      {message ? (
        <p className={`text-xs ${submitted ? "font-semibold text-emerald-700" : "text-muted-foreground"}`}>
          {message}
        </p>
      ) : null}
      {requiresBundleConsent ? (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={consent}
            disabled={submitted}
            onChange={(e) => setConsent(e.target.checked)}
          />
          Rozumiem podmienkam balíka (min. hodiny/dni, bonus/sadzba).
        </label>
      ) : null}
      {submitted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-900">
          Prihláška odoslaná
        </div>
      ) : (
        <Button
          onClick={apply}
          disabled={pending || (requiresBundleConsent ? !consent : false)}
          className="w-full"
        >
          {pending ? "Posielame prihlášku..." : "Prihlásiť sa"}
        </Button>
      )}
    </div>
  );
}
