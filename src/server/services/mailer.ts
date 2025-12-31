import nodemailer from "nodemailer";

const DEFAULT_FROM = process.env.EMAIL_FROM ?? "no-reply@warehouseflex.local";

type MailPayload = {
  to: string;
  subject: string;
  text: string;
};

export async function sendTransactionalEmail({
  to,
  subject,
  text,
}: MailPayload) {
  if (!to || !subject) return;

  if (process.env.EMAIL_ENABLED !== "true") {
    console.log("[mailer:dry-run]", { to, subject, text });
    return;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    throw new Error("SMTP configuration is missing.");
  }

  const port = Number(smtpPort);
  const secure =
    process.env.SMTP_SECURE === "true" || (!process.env.SMTP_SECURE && port === 465);

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transport.sendMail({
    from: DEFAULT_FROM,
    to,
    subject,
    text,
  });
}
