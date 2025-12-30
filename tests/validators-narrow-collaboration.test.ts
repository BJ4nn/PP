import { describe, it, expect } from "vitest";
import {
  narrowCollaborationGroupSchema,
  narrowCollaborationSchemeSchema,
  narrowCollaborationScheduleSchema,
} from "@/lib/validators/narrow-collaboration";
import { DayOfWeek, ShiftType } from "@/types";

describe("narrow collaboration validators", () => {
  it("accepts valid group input", () => {
    const parsed = narrowCollaborationGroupSchema.safeParse({
      name: "Stabilný tím",
      maxAdvanceWeeks: 2,
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({
      name: "Stabilný tím",
      maxAdvanceWeeks: 2,
    });
  });

  it("rejects scheme without days", () => {
    const parsed = narrowCollaborationSchemeSchema.safeParse({
      name: "5 dní",
      daysOfWeek: [],
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts schedule within range", () => {
    const parsed = narrowCollaborationScheduleSchema.safeParse({
      schemeId: "ckl2u8f3p000001l0g3h4a1b2",
      shiftType: ShiftType.MORNING,
      weeks: 4,
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data.weeks).toBe(4);
  });

  it("rejects schedule with invalid weeks", () => {
    const parsed = narrowCollaborationScheduleSchema.safeParse({
      schemeId: "ckl2u8f3p000001l0g3h4a1b2",
      shiftType: ShiftType.AFTERNOON,
      weeks: 0,
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts scheme with day enum values", () => {
    const parsed = narrowCollaborationSchemeSchema.safeParse({
      name: "Víkend",
      daysOfWeek: [DayOfWeek.SAT, DayOfWeek.SUN],
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data.daysOfWeek).toEqual([DayOfWeek.SAT, DayOfWeek.SUN]);
  });
});
