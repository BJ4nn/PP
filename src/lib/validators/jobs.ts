import { z } from "zod";
import {
  ExperienceLevel,
  JobStatus,
  JobPositionType,
  JobWaveStage,
  PhysicalLevel,
  Region,
  ContractType,
  NoticeWindow,
  WarehouseType,
} from "@/types";

const coerceNumber = (label: string) =>
  z.coerce.number({
    invalid_type_error: `${label} musí byť číslo`,
    required_error: `${label} je povinné`,
  });

const positiveNumber = (label: string) =>
  coerceNumber(label).positive({ message: `${label} musí byť kladné` });

const coerceInt = (label: string) =>
  z.coerce
    .number({
      invalid_type_error: `${label} musí byť celé číslo`,
      required_error: `${label} je povinné`,
    })
    .int({ message: `${label} musí byť celé číslo` });

const positiveInt = (label: string) =>
  coerceInt(label).positive({ message: `${label} musí byť kladné` });

const nonNegativeInt = (label: string) =>
  coerceInt(label).min(0, { message: `${label} musí byť nezáporné` });

const coerceDate = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  return value;
}, z.date());

const baseJobFields = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  locationCity: z.string().min(2),
  locationAddress: z.string().min(5, "Zadajte presnú adresu"),
  region: z.nativeEnum(Region),
  warehouseType: z.nativeEnum(WarehouseType),
  positionTypes: z
    .array(
      z.enum(
        Object.values(JobPositionType) as [
          JobPositionType,
          ...JobPositionType[],
        ],
      ),
    )
    .optional(),
  startsAt: coerceDate,
  durationHours: positiveInt("Trvanie"),
  hourlyRate: positiveNumber("Hodinová sadzba"),
  requiredVzv: z.boolean().default(false),
  minExperience: z.nativeEnum(ExperienceLevel).optional().nullable(),
  physicalLevel: z.nativeEnum(PhysicalLevel).optional(),
  neededWorkers: positiveInt("Počet pracovníkov"),
  waveStage: z.nativeEnum(JobWaveStage).optional(),
  isUrgent: z.boolean().default(false),
  urgentBonusEur: nonNegativeInt("Urgent bonus").optional(),
  confirmBy: coerceDate.optional(),
  isBundle: z.boolean().default(false),
  bundleMinHours: positiveInt("Minimálne hodiny").optional(),
  bundleMinDays: positiveInt("Minimálne dni").optional(),
  bundleBonusEur: nonNegativeInt("Bonus za balík").optional(),
  bundleHourlyRateEur: positiveNumber("Balíková sadzba").optional(),
  contractType: z.nativeEnum(ContractType).optional().nullable(),
  noticeWindow: z.nativeEnum(NoticeWindow).default(NoticeWindow.H24),
  payEmployment: positiveNumber("Sadzba (interné)").optional(),
  payTradeLicense: positiveNumber("Sadzba živnosť").optional(),
});

export const baseJobSchema = baseJobFields;

type JobFields = z.infer<typeof baseJobFields>;
type PartialJobFields = {
  [Key in keyof JobFields]?: JobFields[Key] | undefined;
};

const validateUrgent = (
  value: PartialJobFields,
  ctx: z.RefinementCtx,
  strict: boolean,
) => {
  const toDate = (input: unknown) => {
    if (input instanceof Date) return input;
    if (typeof input === "string" || typeof input === "number") {
      const parsed = new Date(input);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  };
  const confirmDate = toDate(value.confirmBy);
  if (value.isUrgent === true) {
    if (!confirmDate && strict) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmBy"],
        message: "Zadajte termín na potvrdenie urgentnej zmeny",
      });
    }
    if (confirmDate && confirmDate.getTime() < Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmBy"],
        message: "Termín musí byť v budúcnosti",
      });
    }
  } else {
    if (value.urgentBonusEur !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["urgentBonusEur"],
        message: "Bonus sa dá nastaviť len pre urgentnú zmenu",
      });
    }
    if (confirmDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmBy"],
        message: "Termín potvrdenia sa používa len pri urgente",
      });
    }
  }
};

const validateBundle = (
  value: PartialJobFields,
  ctx: z.RefinementCtx,
  strict: boolean,
) => {
  const hasThreshold = value.bundleMinHours !== undefined || value.bundleMinDays !== undefined;
  const hasIncentive =
    value.bundleBonusEur !== undefined ||
    value.bundleHourlyRateEur !== undefined;
  const anyBundleField =
    hasThreshold || hasIncentive;

  if (value.isBundle === true) {
    if (strict && !hasThreshold) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bundleMinHours"],
        message: "Zadajte minimálne hodiny alebo dni balíka",
      });
    }
    if (strict && !hasIncentive) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bundleBonusEur"],
        message: "Pridajte bonus alebo zvýšenú sadzbu pre balík",
      });
    }
  } else if (anyBundleField) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["isBundle"],
      message: "Tieto polia sa používajú len pri balíku",
    });
  }
};

export const createJobSchema = baseJobFields.superRefine((value, ctx) => {
  validateUrgent(value, ctx, true);
  validateBundle(value, ctx, true);
});

export const updateJobSchema = baseJobFields
  .partial()
  .extend({
    status: z.nativeEnum(JobStatus).optional(),
  })
  .superRefine((value, ctx) => {
    validateUrgent(value, ctx, value.isUrgent === true);
    if (value.isBundle === true) {
      validateBundle(value, ctx, true);
    } else {
      validateBundle(value, ctx, false);
    }
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
