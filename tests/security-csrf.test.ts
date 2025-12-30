import { describe, it, expect, beforeEach, afterEach, beforeAll } from "vitest";
import { authMock, prismaMock } from "./setup";

describe("security: CSRF same-origin guard", () => {
  let route: typeof import("@/app/api/notifications/mark-read/route");
  const prevEnv = { ...process.env };

  beforeAll(async () => {
    route = await import("@/app/api/notifications/mark-read/route");
  });

  beforeEach(() => {
    process.env.CSRF_ENFORCE = "true";
    process.env.ALLOWED_ORIGINS = "https://example.test";
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in prevEnv)) delete process.env[key];
    }
    for (const [key, value] of Object.entries(prevEnv)) {
      process.env[key] = value;
    }
  });

  it("blocks mutating requests without Origin/Referer", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1" } });

    const req = new Request("https://example.test/api/notifications/mark-read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: ["ckl2u8f3p000001l0g3h4a1b2"] }),
    });

    const res = await route.POST(req);
    expect(res.status).toBe(403);
  });

  it("allows mutating requests from allowed origin", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1" } });
    prismaMock.notification.updateMany.mockResolvedValueOnce({ count: 1 } as never);
    prismaMock.notification.findMany.mockResolvedValueOnce([{ id: "n1" }] as never);

    const req = new Request("https://example.test/api/notifications/mark-read", {
      method: "POST",
      headers: {
        origin: "https://example.test",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ids: ["ckl2u8f3p000001l0g3h4a1b2"] }),
    });

    const res = await route.POST(req);
    expect(res.status).toBe(200);
  });
});
