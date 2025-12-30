"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SendInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const send = () => {
    const confirmed = window.confirm(
      "Naozaj chcete odoslať faktúru firme? Po odoslaní ju uvidí firma v prijatých faktúrach.",
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/worker/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.error ?? "Nepodarilo sa odoslať faktúru.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={send} disabled={pending}>
        {pending ? "Odosielam..." : "Odoslať faktúru firme"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

