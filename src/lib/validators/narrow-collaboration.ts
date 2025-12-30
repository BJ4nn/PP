import { z } from "zod";
import { DayOfWeek, ShiftType } from "@/types";

const trimmedName = z
  .string()
  .trim()
  .min(2, "Zadajte názov")
  .max(64, "Názov je príliš dlhý");

export const narrowCollaborationGroupSchema = z.object({
  name: trimmedName,
  maxAdvanceWeeks: z.number().int().min(1).max(4),
});

export type NarrowCollaborationGroupInput = z.infer<
  typeof narrowCollaborationGroupSchema
>;

export const narrowCollaborationSchemeSchema = z.object({
  name: trimmedName,
  daysOfWeek: z.array(z.nativeEnum(DayOfWeek)).min(1).max(7),
});

export type NarrowCollaborationSchemeInput = z.infer<
  typeof narrowCollaborationSchemeSchema
>;

export const narrowCollaborationScheduleSchema = z.object({
  schemeId: z.string().cuid(),
  shiftType: z.nativeEnum(ShiftType),
  weeks: z.number().int().min(1).max(4),
});

export type NarrowCollaborationScheduleInput = z.infer<
  typeof narrowCollaborationScheduleSchema
>;
