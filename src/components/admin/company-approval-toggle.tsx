"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  companyId: string;
  isApproved: boolean;
};

export function CompanyApprovalToggle({ companyId, isApproved }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localApproved, setLocalApproved] = useState(isApproved);
  const [error, setError] = useState<string | null>(null);

  const toggle = (approved: boolean) => {
    startTransition(async () => {
      setError(null);
      const response = await fetch(
        `/api/admin/companies/${companyId}/approval`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved }),
          credentials: "include",
        },
      );
      if (response.ok) {
        setLocalApproved(approved);
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data?.error ?? "Nastala chyba pri schvaľovaní");
      }
    });
  };

  return (
    <div className="flex flex-col">
      <Button
        size="sm"
        variant={localApproved ? "outline" : "primary"}
        disabled={pending}
        onClick={() => toggle(!localApproved)}
      >
        {localApproved ? "Zrušiť schválenie" : "Schváliť"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
