import { sendResendEmail } from "./resend";

export type AdminAccessType = "trial_7d" | "pass_30d" | "subscription_monthly" | null;

type AdminNewSignupArgs = {
  email: string;
  fullName?: string | null;
};

type AdminAccessActivatedArgs = {
  email: string;
  fullName?: string | null;
  accessType: Exclude<AdminAccessType, null>;
};

function getAdminNotificationRecipients() {
  const configured = process.env.ADMIN_NOTIFICATION_EMAILS || process.env.RESEND_REPLY_TO_EMAIL || "";

  return configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanValue(value: string | null | undefined, fallback = "Not provided") {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function formatAccessTypeLabel(accessType: Exclude<AdminAccessType, null>) {
  switch (accessType) {
    case "trial_7d":
      return "7 day trial";
    case "pass_30d":
      return "30 day pass";
    case "subscription_monthly":
      return "Monthly subscription";
    default:
      return accessType;
  }
}

async function sendAdminNotification({
  subject,
  html,
  text,
  tags,
}: {
  subject: string;
  html: string;
  text: string;
  tags: Array<{ name: string; value: string }>;
}) {
  const recipients = getAdminNotificationRecipients();

  if (recipients.length === 0) {
    return { skipped: true as const, reason: "Missing ADMIN_NOTIFICATION_EMAILS or RESEND_REPLY_TO_EMAIL" };
  }

  return sendResendEmail({
    to: recipients,
    subject,
    html,
    text,
    tags,
  });
}

export async function sendAdminNewSignupEmail({ email, fullName }: AdminNewSignupArgs) {
  const safeEmail = cleanValue(email);
  const safeName = cleanValue(fullName);
  const subject = `New Investigation Tool signup: ${safeEmail}`;

  return sendAdminNotification({
    subject,
    html: `
      <html>
        <body style="font-family:Arial,sans-serif;color:#1f2937;">
          <h1 style="font-size:20px;">New user signup</h1>
          <p>A new Investigation Tool account has been created.</p>
          <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
          <p><strong>Selected plan:</strong> Not selected yet</p>
        </body>
      </html>
    `.trim(),
    text: [
      "New user signup",
      "",
      "A new Investigation Tool account has been created.",
      `Name: ${safeName}`,
      `Email: ${safeEmail}`,
      "Selected plan: Not selected yet",
    ].join("\n"),
    tags: [
      { name: "category", value: "admin" },
      { name: "template", value: "new-user-signup" },
    ],
  });
}

export async function sendAdminAccessActivatedEmail({ email, fullName, accessType }: AdminAccessActivatedArgs) {
  const safeEmail = cleanValue(email);
  const safeName = cleanValue(fullName);
  const planLabel = formatAccessTypeLabel(accessType);
  const subject = `New user plan selected: ${planLabel} (${safeEmail})`;

  return sendAdminNotification({
    subject,
    html: `
      <html>
        <body style="font-family:Arial,sans-serif;color:#1f2937;">
          <h1 style="font-size:20px;">New user plan selected</h1>
          <p>A newly registered Investigation Tool user has activated their first access plan.</p>
          <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
          <p><strong>Selected plan:</strong> ${escapeHtml(planLabel)}</p>
        </body>
      </html>
    `.trim(),
    text: [
      "New user plan selected",
      "",
      "A newly registered Investigation Tool user has activated their first access plan.",
      `Name: ${safeName}`,
      `Email: ${safeEmail}`,
      `Selected plan: ${planLabel}`,
    ].join("\n"),
    tags: [
      { name: "category", value: "admin" },
      { name: "template", value: "new-user-plan-selected" },
      { name: "access_type", value: accessType },
    ],
  });
}
