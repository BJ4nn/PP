"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  companyId: string;
  disabled?: boolean;
};

export function CompanyRejectButton({ companyId, disabled }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const reject = () => {
    const confirmed = window.confirm(
      "Naozaj chcete zamietnuť firmu? Firma sa vráti do onboardingu a nebude môcť zverejňovať zmeny.",
    );
    if (!confirmed) return;

    startTransition(async () => {
      setError(null);
      const response = await fetch(`/api/admin/companies/${companyId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
        credentials: "include",
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Nastala chyba pri zamietnutí");
    });
  };

  return (
    <div className="flex flex-col">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || pending}
        onClick={reject}
      >
        Zamietnuť
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

