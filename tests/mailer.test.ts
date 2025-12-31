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

  it("sends email via SMTP when enabled", async () => {
    process.env.EMAIL_ENABLED = "true";
    process.env.EMAIL_FROM = "no-reply@example.com";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "smtp-user";
    process.env.SMTP_PASS = "smtp-pass";
    process.env.SMTP_SECURE = "false";

    const sendMail = vi.fn().mockResolvedValue({});
    const createTransport = vi.fn(() => ({ sendMail }));
    vi.doMock("nodemailer", () => ({
      default: { createTransport },
    }));

    const { sendTransactionalEmail } = await import("@/server/services/mailer");

    await sendTransactionalEmail({
      to: "worker@example.com",
      subject: "Verify your account",
      text: "Click the link",
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "smtp-user", pass: "smtp-pass" },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "no-reply@example.com",
        to: "worker@example.com",
        subject: "Verify your account",
        text: "Click the link",
      }),
    );
  });
});
