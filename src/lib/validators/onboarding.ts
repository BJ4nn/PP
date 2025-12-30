import { z } from "zod";
import {
  ContractType,
  DayOfWeek,
  ExperienceLevel,
  Region,
  ShiftType,
  WarehouseType,
} from "@/types";

const preprocessOptionalNumber = () =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "number" && Number.isNaN(value)) {
      return undefined;
    }
    const numericValue =
      typeof value === "number" ? value : Number(value as string);
    return Number.isNaN(numericValue) ? undefined : numericValue;
  }, z.number().nonnegative().optional());

export const workerOnboardingSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  city: z.string().min(2),
  region: z.nativeEnum(Region),
  hasTradeLicense: z.boolean().default(false),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  hasVzv: z.boolean().default(false),
  hasBozp: z.boolean().default(false),
  hasFoodCard: z.boolean().default(false),
  availability: z.object({
    daysOfWeek: z.array(z.nativeEnum(DayOfWeek)).min(1),
    shiftTypes: z.array(z.nativeEnum(ShiftType)).min(1),
  }),
  hasCar: z.boolean().default(false),
  preferredContractType: z.preprocess(
    (value) => (value === "" ? null : value),
    z.nativeEnum(ContractType).nullable().optional(),
  ),
  minHourlyRate: preprocessOptionalNumber(),
  minHourlyRateEmployment: preprocessOptionalNumber(),
});

export type WorkerOnboardingInput = z.infer<typeof workerOnboardingSchema>;

export const companyOnboardingSchema = z.object({
  companyName: z.string().min(2),
  siteName: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  ico: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  addressStreet: z.string().min(2),
  addressCity: z.string().min(2),
  addressZip: z.string().min(3),
  contactName: z.string().min(2),
  contactPhone: z.string().min(6),
  warehouseType: z.nativeEnum(WarehouseType),
  region: z.nativeEnum(Region),
});

export type CompanyOnboardingInput = z.infer<typeof companyOnboardingSchema>;
