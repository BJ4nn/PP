"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { workerBillingSchema, type WorkerBillingInput } from "@/lib/validators/worker-billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  initialValues: WorkerBillingInput;
  hasTradeLicense: boolean;
};

export function WorkerBillingForm({ initialValues, hasTradeLicense }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<WorkerBillingInput>({
    resolver: zodResolver(workerBillingSchema),
    defaultValues: initialValues,
  });

  const onSubmit = (values: WorkerBillingInput) => {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/worker/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.error ?? "Nepodarilo sa uložiť fakturačné údaje.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6 rounded-3xl border border-border bg-card/80 p-6 shadow"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="billingName">Dodávateľ (meno/názov)</Label>
          <Input id="billingName" {...form.register("billingName")} />
          {form.formState.errors.billingName ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.billingName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="billingIban">IBAN</Label>
          <Input id="billingIban" placeholder="SK12 3456 0000 0012 3456 7890" {...form.register("billingIban")} />
          {form.formState.errors.billingIban ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.billingIban.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Bez IBAN-u sa faktúra nedá odoslať firme.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="billingStreet">Ulica a číslo</Label>
          <Input id="billingStreet" {...form.register("billingStreet")} />
          {form.formState.errors.billingStreet ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.billingStreet.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="billingZip">PSČ</Label>
          <Input id="billingZip" {...form.register("billingZip")} />
          {form.formState.errors.billingZip ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.billingZip.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="billingIco">IČO (nepovinné)</Label>
        <Input id="billingIco" {...form.register("billingIco")} />
        <p className="text-xs text-muted-foreground">
          {hasTradeLicense
            ? "Ak fakturujete na živnosť, doplňte IČO ak ho máte."
            : "Ak ste zamestnanec, IČO nemusíte uvádzať."}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Ukladáme..." : "Uložiť fakturačné údaje"}
      </Button>
    </form>
  );
}

