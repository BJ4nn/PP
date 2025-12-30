import { z } from "zod";
import { ApplicationStatus, JobStatus } from "@/types";

export const createApplicationSchema = z.object({
  note: z
    .string()
    .max(500, "Note is too long")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;

export const companyApplicationStatusSchema = updateApplicationStatusSchema.refine(
  (value) =>
    value.status === ApplicationStatus.CONFIRMED ||
    value.status === ApplicationStatus.REJECTED,
  {
    message: "Only confirm or reject actions are allowed",
  },
);

export const jobStatusUpdateSchema = z.object({
  status: z.nativeEnum(JobStatus),
});

export const workerCancelApplicationSchema = z.object({
  reason: z
    .string()
    .max(300)
    .optional(),
});

export const workerReadyToggleSchema = z.object({
  isReady: z.boolean(),
});

export const companyConfirmWorkedSchema = z.object({
  applicationIds: z.array(z.string().cuid()).min(1),
  ratingStars: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullable()
    .optional(),
});

export type CompanyConfirmWorkedInput = z.infer<typeof companyConfirmWorkedSchema>;
