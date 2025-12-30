import { describe, it, expect } from "vitest";
import { formatShiftWindow } from "@/server/utils/shift-window";

describe("shift window formatter", () => {
  it("formats start/end into readable window", () => {
    const start = new Date("2024-05-01T06:00:00.000Z");
    const end = new Date("2024-05-01T14:30:00.000Z");
    const result = formatShiftWindow(start, end);
    expect(result).toMatch(/1 May/);
    expect(result).toMatch(/\d{2}:\d{2} - \d{2}:\d{2}/);
  });
});
