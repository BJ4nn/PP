import { describe, it, expect, beforeAll } from "vitest";
import { authMock, prismaMock } from "./setup";
import { UserRole } from "@/types";

describe("API /company/exports/*", () => {
  let hoursRoute: typeof import("@/app/api/company/exports/hours/route");
  let bonusesRoute: typeof import("@/app/api/company/exports/bonuses/route");

  beforeAll(async () => {
    hoursRoute = await import("@/app/api/company/exports/hours/route");
    bonusesRoute = await import("@/app/api/company/exports/bonuses/route");
  });

  it("returns 401 when unauthorized", async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await hoursRoute.GET(
      new Request("https://example.test/api/company/exports/hours?range=7"),
    );
    expect(res.status).toBe(401);
  });

  it("sanitizes range in Content-Disposition filename", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "company-user", role: UserRole.COMPANY },
    });
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
      isApproved: false,
    } as never);
    prismaMock.jobApplication.findMany.mockResolvedValueOnce([] as never);

    const res = await hoursRoute.GET(
      new Request("https://example.test/api/company/exports/hours?range=999"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="worked-hours_last-30d.csv"',
    );
  });

  it("sanitizes jobId in Content-Disposition filename", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "company-user", role: UserRole.COMPANY },
    });
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      companyName: "ACME",
      onboardingComplete: true,
      isApproved: false,
    } as never);
    prismaMock.jobApplication.findMany.mockResolvedValueOnce([] as never);

    const res = await bonusesRoute.GET(
      new Request(
        "https://example.test/api/company/exports/bonuses?jobId=abc%0D%0Adef%22ghi",
      ),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="bonuses_job-abc__def_ghi.csv"',
    );
  });
});

