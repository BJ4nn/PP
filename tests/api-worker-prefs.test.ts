import { describe, it, expect, beforeAll } from "vitest";
import { authMock, prismaMock } from "./setup";
import { ContractType, UserRole } from "@/types";

describe("API /worker/prefs", () => {
  let route: typeof import("@/app/api/worker/prefs/route");

  beforeAll(async () => {
    route = await import("@/app/api/worker/prefs/route");
  });

  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await route.GET();
    expect(res.status).toBe(401);
  });

  it("returns preferences for worker session", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce({
      preferredContractType: ContractType.EMPLOYMENT,
      minHourlyRate: 12,
      minHourlyRateEmployment: null,
    } as never);

    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({
        preferredContractType: ContractType.EMPLOYMENT,
        minHourlyRate: 12,
      }),
    );
  });

  it("validates PATCH payload and updates preferences", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    prismaMock.workerProfile.findUnique.mockResolvedValueOnce({
      hasTradeLicense: true,
    } as never);
    prismaMock.workerProfile.update.mockResolvedValueOnce({
      preferredContractType: null,
      minHourlyRate: 15,
      minHourlyRateEmployment: null,
    } as never);

    const req = new Request("https://example.test/api/worker/prefs", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ minHourlyRate: 15 }),
    });
    const res = await route.PATCH(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(
      expect.objectContaining({ minHourlyRate: 15 }),
    );
  });

  it("returns 400 for invalid PATCH payload", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1", role: UserRole.WORKER } });
    const req = new Request("https://example.test/api/worker/prefs", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ minHourlyRate: -1 }),
    });
    const res = await route.PATCH(req);
    expect(res.status).toBe(400);
  });
});
