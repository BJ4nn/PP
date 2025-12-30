import { describe, it, expect } from "vitest";
import { notificationMarkReadSchema, notificationQuerySchema } from "@/lib/validators/notifications";

describe("notifications validators", () => {
  it("parses onlyUnread query flag to boolean", () => {
    expect(notificationQuerySchema.parse({ onlyUnread: "true" })).toEqual({ onlyUnread: true });
    expect(notificationQuerySchema.parse({ onlyUnread: "false" })).toEqual({ onlyUnread: false });
    expect(notificationQuerySchema.parse({})).toEqual({ onlyUnread: false });
  });

  it("requires at least one cuid id", () => {
    const ok = notificationMarkReadSchema.safeParse({
      ids: ["ckl2u8f3p000001l0g3h4a1b2"],
    });
    expect(ok.success).toBe(true);

    const bad = notificationMarkReadSchema.safeParse({ ids: ["not-a-cuid"] });
    expect(bad.success).toBe(false);
  });
});

