"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type TemplateInput = {
  title: string;
  intro: string;
  workplaceRules: string;
  customTerms: string;
  isActive: boolean;
};

type Props = {
  initialTemplate: TemplateInput;
};

export function ContractTemplateForm({ initialTemplate }: Props) {
  const [value, setValue] = useState<TemplateInput>(() => ({ ...initialTemplate }));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    startTransition(async () => {
      setSaved(false);
      setError(null);
      const res = await fetch("/api/company/contract-template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Nepodarilo sa uložiť šablónu");
        return;
      }
      setSaved(true);
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
        <p className="font-semibold">Beta</p>
        <p className="mt-1">
          Portál poskytuje editor a archív. Zmluvné strany sú firma a pracovník.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1">
          <Label htmlFor="title">Názov dokumentu</Label>
          <Input
            id="title"
            value={value.title}
            onChange={(e) => setValue((prev) => ({ ...prev, title: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="intro">Úvod (voliteľné)</Label>
          <Textarea
            id="intro"
            value={value.intro}
            onChange={(e) => setValue((prev) => ({ ...prev, intro: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="workplaceRules">Pravidlá pracoviska (voliteľné)</Label>
          <Textarea
            id="workplaceRules"
            value={value.workplaceRules}
            onChange={(e) => setValue((prev) => ({ ...prev, workplaceRules: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="customTerms">Dohodnuté podmienky (voliteľné)</Label>
          <Textarea
            id="customTerms"
            className="min-h-[140px]"
            value={value.customTerms}
            onChange={(e) => setValue((prev) => ({ ...prev, customTerms: e.target.value }))}
          />
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 p-3 text-sm">
          <input
            type="checkbox"
            checked={value.isActive}
            onChange={(e) => setValue((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
          Šablóna aktívna (použije sa pri potvrdení pracovníka)
        </label>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Button onClick={save} disabled={pending}>
            {pending ? "Ukladáme..." : "Uložiť šablónu"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/company/contracts">Späť na archív</Link>
          </Button>
          {saved ? <p className="text-sm text-emerald-700">Uložené.</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
