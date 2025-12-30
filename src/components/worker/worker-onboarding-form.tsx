"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DayOfWeek,
  ShiftType,
} from "@/types";
import {
  createWorkerOnboardingDefaults,
  dayOptions,
  experienceLabels,
  experienceOptions,
  regionOptions,
} from "@/components/worker/worker-onboarding-constants";
import {
  workerOnboardingSchema,
  type WorkerOnboardingInput,
} from "@/lib/validators/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { WorkerAvailabilityPicker } from "@/components/worker/worker-availability-picker";

type Props = {
  initialValues?: WorkerOnboardingInput | undefined;
};

export function WorkerOnboardingForm({ initialValues }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const defaults = createWorkerOnboardingDefaults();
  const form = useForm<WorkerOnboardingInput>({
    resolver: zodResolver(workerOnboardingSchema),
    defaultValues: initialValues
      ? {
          ...defaults,
          ...initialValues,
          availability: {
            ...defaults.availability,
            ...initialValues.availability,
            daysOfWeek: Array.isArray(initialValues.availability?.daysOfWeek)
              ? initialValues.availability.daysOfWeek
              : [],
            shiftTypes: Array.isArray(initialValues.availability?.shiftTypes)
              ? initialValues.availability.shiftTypes
              : [],
          },
        }
      : defaults,
  });

  const selectedDays =
    useWatch({
      control: form.control,
      name: "availability.daysOfWeek",
    }) ?? [];
  const selectedShifts =
    useWatch({
      control: form.control,
      name: "availability.shiftTypes",
    }) ?? [];
  const toggleAvailabilityItem = (
    key: "daysOfWeek" | "shiftTypes",
    value: DayOfWeek | ShiftType,
  ) => {
    const currentValue = form.getValues(`availability.${key}`);
    const current = Array.isArray(currentValue) ? currentValue : [];
    const exists = current.includes(value as never);
    const updated = exists
      ? current.filter((item) => item !== value)
      : [...current, value];

    form.setValue(
      `availability.${key}`,
      updated as never,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const setAvailability = (
    key: "daysOfWeek" | "shiftTypes",
    values: Array<DayOfWeek> | Array<ShiftType>,
  ) => {
    form.setValue(`availability.${key}`, values as never, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSubmit = (values: WorkerOnboardingInput) => {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/worker/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data?.error ?? "Profil sa nepodarilo uložiť");
        return;
      }

      router.push("/worker/dashboard");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6 rounded-3xl border border-border bg-card/80 p-6 shadow"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="fullName">Celé meno</Label>
          <Input id="fullName" {...form.register("fullName")} />
          {form.formState.errors.fullName ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.fullName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Telefón</Label>
          <Input id="phone" {...form.register("phone")} />
          {form.formState.errors.phone ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.phone.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="city">Mesto</Label>
          <Input id="city" {...form.register("city")} />
          {form.formState.errors.city ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.city.message}
            </p>
          ) : null}
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="experienceLevel">Úroveň skúseností</Label>
          <Select id="experienceLevel" {...form.register("experienceLevel")}>
            {experienceOptions.map((level) => (
              <option key={level} value={level}>
                {experienceLabels[level]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="minHourlyRate">Minimálna hodinová mzda (EUR)</Label>
          <Input
            id="minHourlyRate"
            type="number"
            step="1"
            placeholder="napr. 8"
            {...form.register("minHourlyRate", { valueAsNumber: true })}
          />
          {form.formState.errors.minHourlyRate ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.minHourlyRate.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Ak túto hodnotu necháte prázdnu, ukážeme vám všetky dostupné
              ponuky.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2 rounded-2xl border border-border p-3">
          <Checkbox type="checkbox" {...form.register("hasTradeLicense")} />
          <span className="text-sm text-foreground">Mám živnosť</span>
        </label>
        <label className="flex items-center gap-2 rounded-2xl border border-border p-3">
          <Checkbox type="checkbox" {...form.register("hasCar")} />
          <span className="text-sm text-foreground">Mám auto</span>
        </label>
      </div>

      <div>
        <p className="text-sm font-medium text-muted-foreground">Certifikáty</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
            <Checkbox type="checkbox" {...form.register("hasVzv")} />
            <span>VZV</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
            <Checkbox type="checkbox" {...form.register("hasBozp")} />
            <span>BOZP</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
            <Checkbox type="checkbox" {...form.register("hasFoodCard")} />
            <span>Hygienický preukaz</span>
          </label>
        </div>
      </div>

      <WorkerAvailabilityPicker
        selectedDays={selectedDays}
        selectedShifts={selectedShifts}
        toggleAvailabilityItem={toggleAvailabilityItem}
        onSelectAllDays={() => setAvailability("daysOfWeek", dayOptions)}
        onClearDays={() => setAvailability("daysOfWeek", [])}
        dayError={form.formState.errors.availability?.daysOfWeek?.message}
        shiftError={form.formState.errors.availability?.shiftTypes?.message}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Ukladáme..." : "Uložiť profil"}
      </Button>
    </form>
  );
}
