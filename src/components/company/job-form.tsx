"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { z } from "zod";
import { baseJobSchema, type CreateJobInput } from "@/lib/validators/jobs";
import {
  ContractType,
  ExperienceLevel,
  JobWaveStage,
  NoticeWindow,
  PhysicalLevel,
  Region,
  WarehouseType,
} from "@/types";
import { JobFormView } from "@/components/company/job-form-view";

const emptyToUndefined = z.preprocess((value) => {
  if (value === "") return undefined;
  return value;
}, z.any());

const optionalPositive = (min: number, message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(min, { message }),
  );

export const numberOrUndefined = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const asNumber =
    typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(asNumber) ? asNumber : undefined;
};

const jobFormSchema = baseJobSchema
  .omit({
    startsAt: true,
    minExperience: true,
    physicalLevel: true,
    confirmBy: true,
    contractType: true,
    payEmployment: true,
    payTradeLicense: true,
  })
  .extend({
    startsAt: z.string().min(1, "Provide shift start time"),
    confirmBy: z.string().optional(),
    urgentBonusEur: emptyToUndefined.pipe(
      z.coerce.number().min(0, "Bonus musí byť nezáporný").optional(),
    ),
    bundleMinHours: optionalPositive(1, "Minimálne hodiny musia byť kladné").optional(),
    bundleMinDays: optionalPositive(1, "Minimálne dni musia byť kladné").optional(),
    bundleBonusEur: emptyToUndefined.pipe(
      z.coerce.number().min(0, "Bonus musí byť nezáporný").optional(),
    ),
    bundleHourlyRateEur: optionalPositive(1, "Sadzba musí byť kladná").optional(),
    minExperience: z
      .union([z.nativeEnum(ExperienceLevel), z.literal("")])
      .optional()
      .transform((value) => (value === "" ? undefined : value)),
    physicalLevel: z
      .union([z.nativeEnum(PhysicalLevel), z.literal("")])
      .optional()
      .transform((value) => (value === "" ? undefined : value)),
    contractType: z.union([z.nativeEnum(ContractType), z.literal("")]).optional(),
    payEmployment: emptyToUndefined
      .pipe(z.coerce.number().min(0.01, "Sadzba musí byť kladná").optional())
      .optional(),
    payTradeLicense: emptyToUndefined
      .pipe(z.coerce.number().min(0.01, "Sadzba musí byť kladná").optional())
      .optional(),
    waveStage: z.nativeEnum(JobWaveStage).optional(),
  });

export type JobFormValues = z.infer<typeof jobFormSchema>;
export type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  jobId?: string;
  defaultValues?: Partial<JobFormValues> & {
    startsAt?: JobFormValues["startsAt"] | Date;
    confirmBy?: JobFormValues["confirmBy"] | Date;
  };
};

const DATE_INPUT_FORMAT = "yyyy-MM-dd'T'HH:mm";
const DEFAULT_DATE_VALUE = format(
  new Date(Date.now() + 60 * 60 * 1000),
  DATE_INPUT_FORMAT,
);

function asDate(value: unknown) {
  return value instanceof Date ? value : null;
}

export function JobForm({ mode, jobId, defaultValues }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const startsAtDate = asDate(defaultValues?.startsAt);
  const confirmByDate = asDate(defaultValues?.confirmBy);
  const defaultDate = startsAtDate
    ? format(startsAtDate, DATE_INPUT_FORMAT)
    : typeof defaultValues?.startsAt === "string" && defaultValues.startsAt
      ? defaultValues.startsAt
      : DEFAULT_DATE_VALUE;
  const defaultConfirmBy = confirmByDate
    ? format(confirmByDate, DATE_INPUT_FORMAT)
    : typeof defaultValues?.confirmBy === "string"
      ? defaultValues.confirmBy
      : "";

  const formDefaults: JobFormValues = {
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    locationCity: defaultValues?.locationCity ?? "",
    locationAddress: defaultValues?.locationAddress ?? "",
    region: defaultValues?.region ?? Region.BA,
    warehouseType: defaultValues?.warehouseType ?? WarehouseType.WAREHOUSE,
    positionTypes: defaultValues?.positionTypes ?? [],
    startsAt: defaultDate,
    durationHours: defaultValues?.durationHours ?? 8,
    hourlyRate: defaultValues?.hourlyRate ?? 7,
    requiredVzv: defaultValues?.requiredVzv ?? false,
    minExperience: defaultValues?.minExperience ?? undefined,
    physicalLevel: defaultValues?.physicalLevel ?? undefined,
    neededWorkers: defaultValues?.neededWorkers ?? 1,
    isUrgent: defaultValues?.isUrgent ?? false,
    urgentBonusEur: defaultValues?.urgentBonusEur ?? undefined,
    confirmBy: defaultConfirmBy,
    isBundle: defaultValues?.isBundle ?? false,
    bundleMinHours: defaultValues?.bundleMinHours ?? undefined,
    bundleMinDays: defaultValues?.bundleMinDays ?? undefined,
    bundleBonusEur: defaultValues?.bundleBonusEur ?? undefined,
    bundleHourlyRateEur: defaultValues?.bundleHourlyRateEur ?? undefined,
    contractType: defaultValues?.contractType ?? "",
    noticeWindow: defaultValues?.noticeWindow ?? NoticeWindow.H24,
    payEmployment: defaultValues?.payEmployment ?? undefined,
    payTradeLicense: defaultValues?.payTradeLicense ?? undefined,
    waveStage: defaultValues?.waveStage ?? JobWaveStage.WAVE1,
  };

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: formDefaults,
  });

  const watched = useWatch({ control: form.control }) as JobFormValues;

  const baseHours = Number(watched.durationHours || 0);
  const baseRate = Number(watched.hourlyRate || 0);
  const bundleHoursTarget = Math.max(
    baseHours,
    watched.bundleMinHours ?? 0,
    watched.bundleMinDays ? baseHours * watched.bundleMinDays : 0,
  );
  const bundleRate = watched.bundleHourlyRateEur || baseRate;
  const bundleBonus = watched.bundleBonusEur || 0;
  const bundleEstimate = Math.round(bundleHoursTarget * bundleRate + bundleBonus);

  const handleSubmit = (values: JobFormValues) => {
    startTransition(async () => {
      setError(null);
      const payload: CreateJobInput = {
        ...values,
        startsAt: new Date(values.startsAt),
        confirmBy: values.confirmBy ? new Date(values.confirmBy) : undefined,
        minExperience: values.minExperience || undefined,
        physicalLevel: values.physicalLevel || undefined,
        ...(values.positionTypes && values.positionTypes.length > 0
          ? { positionTypes: values.positionTypes }
          : {}),
        urgentBonusEur:
          values.isUrgent && values.urgentBonusEur !== undefined
            ? values.urgentBonusEur
            : undefined,
        bundleMinHours: values.isBundle ? values.bundleMinHours : undefined,
        bundleMinDays: values.isBundle ? values.bundleMinDays : undefined,
        bundleBonusEur: values.isBundle ? values.bundleBonusEur : undefined,
        bundleHourlyRateEur: values.isBundle ? values.bundleHourlyRateEur : undefined,
        contractType: ContractType.TRADE_LICENSE,
        ...(values.waveStage ? { waveStage: values.waveStage } : {}),
      };
      const endpoint =
        mode === "create" ? "/api/company/jobs" : `/api/company/jobs/${jobId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data?.error ?? "Ponuku sa nepodarilo uložiť");
        return;
      }

      router.push("/company/jobs");
      router.refresh();
    });
  };

  return (
    <JobFormView
      form={form}
      watched={watched}
      pending={pending}
      error={error}
      mode={mode}
      bundleEstimate={bundleEstimate}
      onSubmit={handleSubmit}
      numberOrUndefined={numberOrUndefined}
    />
  );
}
