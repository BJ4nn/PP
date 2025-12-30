import { describe, it, expect, beforeAll } from "vitest";
import { authMock, prismaMock } from "./setup";
import { UserRole } from "@/types";

describe("API /company/jobs/[id]/worked-candidates", () => {
  let route: typeof import("@/app/api/company/jobs/[id]/worked-candidates/route");

  beforeAll(async () => {
    route = await import("@/app/api/company/jobs/[id]/worked-candidates/route");
  });

  it("returns 401 when unauthorized", async () => {
    authMock.mockResolvedValueOnce(null);
    const res = await route.GET(
      new Request("https://example.test/api/company/jobs/j1/worked-candidates"),
      { params: Promise.resolve({ id: "j1" }) },
    );
    expect(res.status).toBe(401);
  });

  it("returns candidates and scopes to company job", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "company-user", role: UserRole.COMPANY },
    });
    prismaMock.companyProfile.findUnique.mockResolvedValueOnce({
      id: "c1",
      userId: "company-user",
      onboardingComplete: true,
    } as never);
    prismaMock.jobApplication.findMany.mockResolvedValueOnce([
      {
        id: "a1",
        worker: { id: "w1", name: "Jane" },
        job: { id: "j1", title: "Shift", endsAt: new Date("2030-01-01T10:00:00.000Z") },
      },
    ] as never);

    const res = await route.GET(
      new Request("https://example.test/api/company/jobs/j1/worked-candidates?readyOnly=true"),
      { params: Promise.resolve({ id: "j1" }) },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      expect.objectContaining({
        applicationId: "a1",
        worker: { id: "w1", name: "Jane" },
        job: expect.objectContaining({ id: "j1", title: "Shift" }),
      }),
    ]);

    expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          jobId: "j1",
        }),
      }),
    );
  });
});

