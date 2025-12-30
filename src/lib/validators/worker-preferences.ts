import { z } from "zod";
import { ContractType } from "@/types";

const toNumberOrNullOrUndefined = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === "" || value === null) return null;
  const parsed =
    typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const workerPreferencesSchema = z.object({
  preferredContractType: z
    .nativeEnum(ContractType)
    .nullable()
    .optional(),
  minHourlyRate: z.preprocess(
    toNumberOrNullOrUndefined,
    z.number().min(0).max(1000).nullable().optional(),
  ),
  minHourlyRateEmployment: z.preprocess(
    toNumberOrNullOrUndefined,
    z.number().min(0).max(1000).nullable().optional(),
  ),
});

export type WorkerPreferencesInput = z.infer<typeof workerPreferencesSchema>;
