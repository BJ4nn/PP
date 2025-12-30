import { describe, it, expect } from "vitest";
import { workerPreferencesSchema } from "@/lib/validators/worker-preferences";
import { ContractType } from "@/types";

describe("worker preferences validator", () => {
  it("coerces numeric fields and supports null via empty string", () => {
    const parsed = workerPreferencesSchema.safeParse({
      preferredContractType: ContractType.EMPLOYMENT,
      minHourlyRate: " 12.5 ",
      minHourlyRateEmployment: "",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({
      preferredContractType: ContractType.EMPLOYMENT,
      minHourlyRate: 12.5,
      minHourlyRateEmployment: null,
    });
  });

  it("drops non-numeric values as undefined (optional fields)", () => {
    const parsed = workerPreferencesSchema.safeParse({
      minHourlyRate: "abc",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data.minHourlyRate).toBeUndefined();
  });
});
