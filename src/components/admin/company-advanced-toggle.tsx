"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  companyId: string;
  advancedModeEnabled: boolean;
};

export function CompanyAdvancedToggle({ companyId, advancedModeEnabled }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(advancedModeEnabled);
  const [error, setError] = useState<string | null>(null);

  const toggle = (next: boolean) => {
    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/admin/companies/${companyId}/advanced`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
        credentials: "include",
      });
      if (response.ok) {
        setEnabled(next);
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data?.error ?? "Nepodarilo sa ulozit advanced mode.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant={enabled ? "outline" : "primary"}
        disabled={pending}
        onClick={() => toggle(!enabled)}
      >
        {enabled ? "Vypnut advanced mode" : "Zapnut advanced mode"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
