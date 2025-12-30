const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";
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

  if (!EMAIL_ENABLED) {
    console.log("[mailer:dry-run]", { to, subject, text });
    return;
  }

  // Placeholder for future provider integration.
  console.log("[mailer]", {
    from: DEFAULT_FROM,
    to,
    subject,
    text,
  });
}
