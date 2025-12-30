import { describe, it, expect, beforeAll } from "vitest";
import { authMock, prismaMock } from "./setup";

describe("API /notifications", () => {
  let listRoute: typeof import("@/app/api/notifications/route");
  let markReadRoute: typeof import("@/app/api/notifications/mark-read/route");

  beforeAll(async () => {
    listRoute = await import("@/app/api/notifications/route");
    markReadRoute = await import("@/app/api/notifications/mark-read/route");
  });

  it("lists notifications (onlyUnread=false by default)", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1" } });
    prismaMock.notification.findMany.mockResolvedValueOnce([{ id: "n1" }] as never);

    const req = new Request("https://example.test/api/notifications");
    const res = await listRoute.GET(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: "n1" }]);
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
      }),
    );
  });

  it("marks notifications as read", async () => {
    authMock.mockResolvedValueOnce({ user: { id: "u1" } });
    prismaMock.notification.findMany.mockResolvedValueOnce([{ id: "n1" }] as never);
    prismaMock.notification.updateMany.mockResolvedValueOnce({ count: 1 } as never);

    const req = new Request("https://example.test/api/notifications/mark-read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: ["ckl2u8f3p000001l0g3h4a1b2"] }),
    });
    const res = await markReadRoute.POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, updated: [{ id: "n1" }] });
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["ckl2u8f3p000001l0g3h4a1b2"] }, userId: "u1" },
      }),
    );
  });
});
