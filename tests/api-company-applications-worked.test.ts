import { describe, it, expect } from "vitest";
import { authMock, prismaMock } from "./setup";
import { UserRole } from "@/types";

describe("API /company/applications/worked", () => {
  it("returns 401 when unauthorized", async () => {
    authMock.mockResolvedValueOnce(null);
    const { POST } = await import("@/app/api/company/applications/worked/route");
    const req = new Request("https://example.test/api/company/applications/worked", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationIds: ["ckl2u8f3p000001l0g3h4a1b2"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("validates payload and confirms worked shifts", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "company-user", role: UserRole.COMPANY } });
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      onboardingComplete: true,
    } as never);
    prismaMock.jobApplication.findMany.mockResolvedValueOnce([{ id: "a1" }] as never);
    prismaMock.jobApplication.updateMany.mockResolvedValueOnce({ count: 1 } as never);

    const { POST } = await import("@/app/api/company/applications/worked/route");
    const req = new Request("https://example.test/api/company/applications/worked", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        applicationIds: ["ckl2u8f3p000001l0g3h4a1b2"],
        ratingStars: 4,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ updatedCount: 1, updatedIds: ["a1"] });
  });

  it("returns 400 for invalid payload", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "company-user", role: UserRole.COMPANY } });
    const { POST } = await import("@/app/api/company/applications/worked/route");
    const req = new Request("https://example.test/api/company/applications/worked", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationIds: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

