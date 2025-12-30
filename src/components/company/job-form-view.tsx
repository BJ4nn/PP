"use client";

import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  experienceLabels,
  experienceOptions,
  physicalLabels,
  physicalOptions,
  positionTypeLabels,
  positionTypeOptions,
  regionOptions,
  warehouseLabels,
  warehouseOptions,
} from "@/components/company/job-form-constants";
import type { JobFormValues, Mode } from "@/components/company/job-form";
import { JobFlexFields } from "@/components/company/job-flex-fields";
import { JobWaveStage } from "@/types";

type Props = {
  form: UseFormReturn<JobFormValues>;
  watched: JobFormValues;
  pending: boolean;
  error: string | null;
  mode: Mode;
  bundleEstimate: number;
  onSubmit: (values: JobFormValues) => void;
  numberOrUndefined: (value: unknown) => number | undefined;
};

export function JobFormView({
  form,
  watched,
  pending,
  error,
  mode,
  bundleEstimate,
  onSubmit,
  numberOrUndefined,
}: Props) {
  return (
    <form
      className="space-y-6 rounded-3xl border border-border bg-card/70 p-6 shadow"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="space-y-1">
        <Label htmlFor="title">Názov zmeny</Label>
        <Input id="title" {...form.register("title")} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Popis</Label>
        <Textarea
          id="description"
          {...form.register("description")}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="locationCity">Mesto</Label>
          <Input id="locationCity" {...form.register("locationCity")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="region">Región</Label>
          <Select id="region" {...form.register("region")}>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="locationAddress">Presná adresa</Label>
        <Input
          id="locationAddress"
          placeholder="Ulica a číslo prevádzky"
          {...form.register("locationAddress")}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="warehouseType">Typ prevádzky</Label>
          <Select id="warehouseType" {...form.register("warehouseType")}>
            {warehouseOptions.map((type) => (
              <option key={type} value={type}>
                {warehouseLabels[type]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="startsAt">Začiatok zmeny</Label>
          <Input id="startsAt" type="datetime-local" {...form.register("startsAt")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="durationHours">Trvanie (hodiny)</Label>
          <Input
            id="durationHours"
            type="number"
            {...form.register("durationHours", { setValueAs: numberOrUndefined })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="hourlyRate">Hodinová sadzba (€)</Label>
          <Input
            id="hourlyRate"
            type="number"
            step="0.5"
            {...form.register("hourlyRate", { setValueAs: numberOrUndefined })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="neededWorkers">Počet pracovníkov</Label>
          <Input
            id="neededWorkers"
            type="number"
            {...form.register("neededWorkers", { setValueAs: numberOrUndefined })}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="waveStage">Rozoslanie ponuky</Label>
          <Select id="waveStage" {...form.register("waveStage")}>
            <option value={JobWaveStage.WAVE1}>1. vlna - prioritna skupina</option>
            <option value={JobWaveStage.WAVE2}>2. vlna - overeni pracovnici</option>
            <option value={JobWaveStage.PUBLIC}>3. vlna - vsetci</option>
          </Select>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          Nastavte, komu sa ponuka zobrazi po vytvoreni. Vlny mozete neskor spustit aj manualne.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl border border-border p-3 text-sm">
          <input type="checkbox" {...form.register("isUrgent")} />
          Označiť ako urgentnú zmenu (zvýrazní sa a posunie v poradí)
        </label>
        <div className="space-y-1">
          <Label htmlFor="urgentBonusEur">Urgent bonus (€)</Label>
          <Input
            id="urgentBonusEur"
            type="number"
            step="1"
            placeholder="napr. 20"
            {...form.register("urgentBonusEur", { setValueAs: numberOrUndefined })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirmBy">Potvrdiť do</Label>
          <Input id="confirmBy" type="datetime-local" {...form.register("confirmBy")} />
          <p className="text-xs text-muted-foreground">
            Po termíne sa nedajú posielať prihlášky.
          </p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
        <div>
          <Label className="text-sm font-semibold">Typ pracovnej pozície</Label>
          <p className="text-xs text-muted-foreground">
            Dobrovoľné · označte, čo sa bude na smene robiť (môže byť viac možností).
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {positionTypeOptions.map((type) => {
            const selected = watched.positionTypes ?? [];
            const checked = selected.includes(type);
            return (
              <label
                key={type}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? Array.from(new Set([...selected, type]))
                      : selected.filter((v) => v !== type);
                    form.setValue("positionTypes", next, { shouldDirty: true });
                  }}
                />
                {positionTypeLabels[type]}
              </label>
            );
          })}
        </div>
      </div>

      <JobFlexFields
        form={form}
      />

      <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <Label className="text-sm font-semibold">Balíková ponuka</Label>
            <p className="text-xs text-muted-foreground">
              Ponúknite bonus alebo vyššiu sadzbu za viac dní/hodín.
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm">
            <input type="checkbox" {...form.register("isBundle")} />
            Aktivovať balík
          </label>
        </div>
        {watched.isBundle ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="bundleMinHours">Min. hodín</Label>
              <Input
                id="bundleMinHours"
                type="number"
                {...form.register("bundleMinHours", {
                  setValueAs: numberOrUndefined,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bundleMinDays">Min. dní</Label>
              <Input
                id="bundleMinDays"
                type="number"
                {...form.register("bundleMinDays", {
                  setValueAs: numberOrUndefined,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bundleBonusEur">Bonus (€)</Label>
              <Input
                id="bundleBonusEur"
                type="number"
                {...form.register("bundleBonusEur", {
                  setValueAs: numberOrUndefined,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bundleHourlyRateEur">Sadzba balíka (€)</Label>
              <Input
                id="bundleHourlyRateEur"
                type="number"
                step="0.5"
                {...form.register("bundleHourlyRateEur", {
                  setValueAs: numberOrUndefined,
                })}
              />
            </div>
          </div>
        ) : null}
        {watched.isBundle ? (
          <div className="rounded-2xl border border-dashed border-border bg-background p-3 text-sm text-muted-foreground">
            <p>
              Odhad zárobku:{" "}
              <span className="font-semibold text-foreground">
                €{bundleEstimate.toFixed(0)}
              </span>
            </p>
            <p className="text-xs">
              Požadovaná dostupnosť: minimálne zadané hodiny alebo dni.
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="minExperience">Minimálna skúsenosť</Label>
          <Select id="minExperience" {...form.register("minExperience")}>
            {experienceOptions.map((level) => (
              <option key={level ?? "none"} value={level ?? ""}>
                {level ? experienceLabels[level] : "Bez požiadavky"}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="physicalLevel">Fyzická náročnosť</Label>
          <Select id="physicalLevel" {...form.register("physicalLevel")}>
            {physicalOptions.map((level) => (
              <option key={level ?? "med"} value={level ?? ""}>
                {level ? physicalLabels[level] : "Stredná"}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-border p-3 text-sm">
          <input type="checkbox" {...form.register("requiredVzv")} />
          Vyžaduje sa VZV certifikát
        </label>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? mode === "create"
            ? "Zverejňujeme..."
            : "Ukladáme..."
          : mode === "create"
            ? "Zverejniť zmenu"
            : "Uložiť úpravy"}
      </Button>
    </form>
  );
}
