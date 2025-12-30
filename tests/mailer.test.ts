import { describe, it, expect, vi, beforeEach } from "vitest";

describe("mailer service", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("skips sending when recipient or subject missing", async () => {
    process.env.EMAIL_ENABLED = "false";
    const { sendTransactionalEmail } = await import("@/server/services/mailer");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendTransactionalEmail({ to: "", subject: "Test", text: "Body" });

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("logs payload in dry-run mode when enabled flag is false", async () => {
    process.env.EMAIL_ENABLED = "false";
    const { sendTransactionalEmail } = await import("@/server/services/mailer");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendTransactionalEmail({
      to: "worker@example.com",
      subject: "Shift confirmed",
      text: "See you soon",
    });

    expect(logSpy).toHaveBeenCalledWith(
      "[mailer:dry-run]",
      expect.objectContaining({
        to: "worker@example.com",
        subject: "Shift confirmed",
      }),
    );
    logSpy.mockRestore();
  });
});
