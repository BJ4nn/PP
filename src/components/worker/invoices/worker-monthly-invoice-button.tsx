"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type MonthOption = {
  label: string;
  month: number;
  year: number;
};

type Props = {
  options: MonthOption[];
};

const toKey = (month: number, year: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export function WorkerMonthlyInvoiceButton({ options }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState(
    options.length > 0 ? toKey(options[0].month, options[0].year) : "",
  );

  const selected =
    options.find((option) => toKey(option.month, option.year) === selectedKey) ??
    options[0];

  const create = () => {
    if (!selected) return;
    const confirmed = window.confirm(
      `Vytvoriť faktúry za ${selected.label}? Smeny sa automaticky rozdelia podľa firiem.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/worker/invoices/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selected.month, year: selected.year }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.error ?? "Nepodarilo sa vytvoriť mesačné faktúry.");
        return;
      }
      router.push("/worker/invoices");
    });
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div>
        <label className="text-xs font-semibold text-muted-foreground">
          Mesiac
        </label>
        <Select
          className="mt-1"
          value={selectedKey}
          onChange={(event) => setSelectedKey(event.target.value)}
        >
          {options.map((option) => (
            <option
              key={toKey(option.month, option.year)}
              value={toKey(option.month, option.year)}
            >
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <Button onClick={create} disabled={pending || !selected}>
        {pending
          ? "Vytváram faktúry..."
          : `Vytvoriť faktúry za ${selected?.label ?? ""}`}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
