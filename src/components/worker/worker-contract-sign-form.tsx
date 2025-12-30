"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/signature/signature-pad";
import type { SignaturePayloadV1 } from "@/types";

type Props = {
  contractId: string;
  defaultSignatureName: string;
};

export function WorkerContractSignForm({ contractId, defaultSignatureName }: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaultSignatureName);
  const [signature, setSignature] = useState<SignaturePayloadV1 | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const sign = () => {
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const res = await fetch(`/api/worker/contracts/${contractId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureName: name, signature, confirm: confirmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nepodarilo sa podpísať");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Podpis (Beta)</h2>
        <p className="text-sm text-muted-foreground">
          Zadajte meno a priezvisko a potvrďte podpis.
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="signatureName">Meno a priezvisko</Label>
        <Input
          id="signatureName"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 p-3 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        Potvrdzujem, že som si dokument prečítal(a) a súhlasím s podmienkami.
      </label>
      <SignaturePad value={signature} onChange={setSignature} disabled={pending} />
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Button onClick={sign} disabled={pending || !confirmed || !signature}>
          {pending ? "Podpisujeme..." : "Podpísať"}
        </Button>
        {saved ? <p className="text-sm text-emerald-700">Podpísané.</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </section>
  );
}
