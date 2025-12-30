import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { prismaMock } from "./setup";
import { UserRole } from "@/types";
import { resetRateLimitsForTests } from "@/server/security/rate-limit";

describe("security: rate limiting + enumeration (register)", () => {
  let route: typeof import("@/app/api/auth/register/route");

  beforeAll(async () => {
    route = await import("@/app/api/auth/register/route");
  });

  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("rate-limits registration by IP", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null as never);
    prismaMock.user.create.mockResolvedValue({ id: "u1" } as never);

    for (let i = 0; i < 10; i += 1) {
      const req = new Request("https://example.test/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "1.2.3.4",
        },
        body: JSON.stringify({
          email: `user${i}@example.com`,
          password: "password123",
          role: UserRole.WORKER,
        }),
      });
      const res = await route.POST(req);
      expect(res.status).toBe(200);
    }

    const blockedReq = new Request("https://example.test/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "1.2.3.4",
      },
      body: JSON.stringify({
        email: "user10@example.com",
        password: "password123",
        role: UserRole.WORKER,
      }),
    });
    const blockedRes = await route.POST(blockedReq);
    expect(blockedRes.status).toBe(429);
  });

  it("does not reveal whether email already exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "existing" } as never);

    const req = new Request("https://example.test/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "5.6.7.8",
      },
      body: JSON.stringify({
        email: "existing@example.com",
        password: "password123",
        role: UserRole.WORKER,
      }),
    });

    const res = await route.POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});

