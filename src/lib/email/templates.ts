import { readFileSync } from "node:fs";
import path from "node:path";

type TemplateResult = {
  subject: string;
  html: string;
  text: string;
};

type BaseTemplateArgs = {
  preheader: string;
  title: string;
  intro: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  highlights?: string[];
  note?: string;
};

type GreetingArgs = {
  firstName?: string | null;
};

type AuthTemplateArgs = GreetingArgs & {
  actionUrl: string;
};

type AccessTemplateArgs = GreetingArgs & {
  endsAt?: string | null;
  actionUrl?: string;
};

type BillingTemplateArgs = GreetingArgs & {
  actionUrl?: string;
  amountLabel?: string | null;
  renewalDate?: string | null;
};

const BRAND_NAME = "Investigation Tool";
const SUPPORT_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || "support@investigationtool.com.au";
const LOGO_DATA_URI = `data:image/png;base64,${readFileSync(
  path.join(process.cwd(), "public", "images", "investigation-tool.png"),
).toString("base64")}`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function greeting(firstName?: string | null) {
  return firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi,";
}

function buildText({
  title,
  intro,
  ctaLabel,
  ctaUrl,
  secondaryCtaLabel,
  secondaryCtaUrl,
  highlights,
  note,
}: BaseTemplateArgs) {
  const lines = [title, "", ...intro];

  if (highlights?.length) {
    lines.push("", ...highlights.map((item) => `- ${item}`));
  }

  if (ctaLabel && ctaUrl) {
    lines.push("", `${ctaLabel}: ${ctaUrl}`);
  }

  if (secondaryCtaLabel && secondaryCtaUrl) {
    lines.push("", `${secondaryCtaLabel}: ${secondaryCtaUrl}`);
  }

  if (note) {
    lines.push("", note);
  }

  lines.push("", `Need help? Reply to ${SUPPORT_EMAIL}.`, "", `${BRAND_NAME}`);
  return lines.join("\n");
}

function renderTemplate({
  preheader,
  title,
  intro,
  ctaLabel,
  ctaUrl,
  secondaryCtaLabel,
  secondaryCtaUrl,
  highlights,
  note,
}: BaseTemplateArgs): TemplateResult {
  const primaryButton = ctaLabel && ctaUrl
    ? `<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 24px;background:linear-gradient(180deg,#4a89f5 0%,#2e69d6 100%);color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;">${escapeHtml(ctaLabel)}</a>`
    : "";
  const secondaryButton = secondaryCtaLabel && secondaryCtaUrl
    ? `<a href="${escapeHtml(secondaryCtaUrl)}" style="display:inline-block;padding:14px 24px;background:#ffffff;color:#234ea8;text-decoration:none;font-weight:700;border:1px solid rgba(35,78,168,0.18);border-radius:12px;">${escapeHtml(secondaryCtaLabel)}</a>`
    : "";

  return {
    subject: title,
    html: `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#eef3fb;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 44px rgba(20,34,70,0.12);">
            <tr>
              <td style="padding:28px 28px 20px;background:linear-gradient(135deg,#1747b9 0%,#2f77df 42%,#5ba1ff 100%);color:#ffffff;">
                <img src="${LOGO_DATA_URI}" alt="${escapeHtml(BRAND_NAME)}" width="52" height="52" style="display:block;width:52px;height:52px;object-fit:contain;margin-bottom:16px;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.84;font-weight:700;">${escapeHtml(BRAND_NAME)}</div>
                <h1 style="margin:10px 0 0;font-size:30px;line-height:1.1;font-weight:700;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${intro.map((paragraph) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#425166;">${escapeHtml(paragraph)}</p>`).join("")}
                ${
                  highlights?.length
                    ? `<div style="margin:20px 0;padding:18px 18px 4px;background:#f6f9ff;border:1px solid rgba(34,74,160,0.08);border-radius:16px;">
                        ${highlights.map((item) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#30435f;">${escapeHtml(item)}</p>`).join("")}
                      </div>`
                    : ""
                }
                ${
                  primaryButton || secondaryButton
                    ? `<div style="padding-top:8px;">
                        ${primaryButton}
                        ${secondaryButton ? `&nbsp;&nbsp;${secondaryButton}` : ""}
                      </div>`
                    : ""
                }
                ${
                  note
                    ? `<p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#5a6472;">${escapeHtml(note)}</p>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <div style="padding-top:18px;border-top:1px solid rgba(31,41,55,0.08);font-size:13px;line-height:1.7;color:#6b7280;">
                  Need help? Reply to <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#234ea8;text-decoration:none;">${escapeHtml(SUPPORT_EMAIL)}</a>.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim(),
    text: buildText({
      title,
      intro,
      ctaLabel,
      ctaUrl,
      secondaryCtaLabel,
      secondaryCtaUrl,
      highlights,
      note,
      preheader,
    }),
  };
}

export const emailTemplates = {
  confirmAccount({ firstName, actionUrl }: AuthTemplateArgs): TemplateResult {
    return renderTemplate({
      preheader: "Confirm your account to finish setting up your Investigation Tool workspace.",
      title: "Confirm your account",
      intro: [
        greeting(firstName),
        "Welcome to Investigation Tool. Please confirm your email address so you can start creating maps, managing evidence, and collaborating with your team.",
      ],
      highlights: [
        "Confirming your email unlocks your workspace sign-in.",
        "If you did not create this account, you can safely ignore this email.",
      ],
      ctaLabel: "Confirm account",
      ctaUrl: actionUrl,
      note: "For security, use the latest confirmation email in your inbox if you requested more than one.",
    });
  },

  forgotPassword({ firstName, actionUrl }: AuthTemplateArgs): TemplateResult {
    return renderTemplate({
      preheader: "Reset your Investigation Tool password.",
      title: "Reset your password",
      intro: [
        greeting(firstName),
        "We received a request to reset the password for your Investigation Tool account.",
      ],
      highlights: [
        "Use the button below to choose a new password.",
        "If you did not request this change, you can ignore this email and your password will remain the same.",
      ],
      ctaLabel: "Set a new password",
      ctaUrl: actionUrl,
      note: "Password reset links can expire. If this link no longer works, request a new reset email from the login page.",
    });
  },

  passwordChanged({ firstName, actionUrl }: AuthTemplateArgs): TemplateResult {
    return renderTemplate({
      preheader: "Your password has been updated successfully.",
      title: "Password updated",
      intro: [
        greeting(firstName),
        "Your Investigation Tool password has been changed successfully.",
      ],
      highlights: [
        "You can now sign in using your new password.",
        "If you did not make this change, contact support immediately.",
      ],
      ctaLabel: "Go to sign in",
      ctaUrl: actionUrl,
    });
  },

  welcome({ firstName, actionUrl }: AuthTemplateArgs): TemplateResult {
    return renderTemplate({
      preheader: "Your workspace is ready.",
      title: "Welcome to Investigation Tool",
      intro: [
        greeting(firstName),
        "Your account is ready. Investigation Tool helps you map incidents, organise evidence, and produce clearer investigation outputs from one workspace.",
      ],
      highlights: [
        "Create or link an investigation from your dashboard.",
        "Use your system map to capture scope, sequence, people, controls, evidence, and findings.",
      ],
      ctaLabel: "Open dashboard",
      ctaUrl: actionUrl,
    });
  },

  trialStarted({ firstName, endsAt, actionUrl }: AccessTemplateArgs): TemplateResult {
    const endsLabel = formatDateTime(endsAt) ?? "in 7 days";
    return renderTemplate({
      preheader: "Your 7 day trial is active.",
      title: "Your 7 day trial is active",
      intro: [
        greeting(firstName),
        `Your free trial is now active and will end on ${endsLabel}.`,
      ],
      highlights: [
        "Your trial includes one investigation map.",
        "You can start mapping immediately from your dashboard.",
      ],
      ctaLabel: "Open dashboard",
      ctaUrl: actionUrl || absoluteUrl("/dashboard"),
    });
  },

  pass30Started({ firstName, endsAt, actionUrl, amountLabel }: AccessTemplateArgs & { amountLabel?: string | null }): TemplateResult {
    const endsLabel = formatDateTime(endsAt) ?? "in 30 days";
    return renderTemplate({
      preheader: "Your 30 day investigation access is active.",
      title: "30 day access confirmed",
      intro: [
        greeting(firstName),
        "Your payment has been received and your 30 day investigation access is now active.",
      ],
      highlights: [
        `Access remains active until ${endsLabel}.`,
        amountLabel ? `Payment confirmed: ${amountLabel}.` : "Your pass includes one investigation map with full access during the access window.",
      ],
      ctaLabel: "Open dashboard",
      ctaUrl: actionUrl || absoluteUrl("/dashboard"),
    });
  },

  subscriptionStarted({ firstName, renewalDate, actionUrl }: BillingTemplateArgs): TemplateResult {
    const renewalLabel = formatDateTime(renewalDate) ?? "your next billing date";
    return renderTemplate({
      preheader: "Your monthly subscription is active.",
      title: "Monthly access is active",
      intro: [
        greeting(firstName),
        "Your monthly Investigation Tool subscription is now active.",
      ],
      highlights: [
        `Your current billing period runs through ${renewalLabel}.`,
        "You now have ongoing access to create, edit, and manage investigation maps.",
      ],
      ctaLabel: "Open dashboard",
      ctaUrl: actionUrl || absoluteUrl("/dashboard"),
    });
  },

  subscriptionRenewed({ firstName, renewalDate, actionUrl }: BillingTemplateArgs): TemplateResult {
    const renewalLabel = formatDateTime(renewalDate) ?? "your next billing date";
    return renderTemplate({
      preheader: "Your subscription has renewed successfully.",
      title: "Subscription renewed successfully",
      intro: [
        greeting(firstName),
        "Your recurring payment was processed successfully and your monthly access remains active.",
      ],
      highlights: [
        `Your new access period is active through ${renewalLabel}.`,
        "No action is required unless you want to review your billing details.",
      ],
      ctaLabel: "Open dashboard",
      ctaUrl: actionUrl || absoluteUrl("/dashboard"),
      secondaryCtaLabel: "Manage billing",
      secondaryCtaUrl: absoluteUrl("/account"),
    });
  },

  paymentFailed({ firstName, actionUrl }: BillingTemplateArgs): TemplateResult {
    return renderTemplate({
      preheader: "Your latest subscription payment did not complete.",
      title: "Payment failed",
      intro: [
        greeting(firstName),
        "We could not process your latest subscription payment.",
      ],
      highlights: [
        "Your investigation maps remain visible, but access may be limited until billing is updated.",
        "Please update your payment method as soon as possible to restore full access.",
      ],
      ctaLabel: "Update payment details",
      ctaUrl: actionUrl || absoluteUrl("/account"),
    });
  },

  accessEndingSoon({ firstName, endsAt, actionUrl }: AccessTemplateArgs): TemplateResult {
    const endsLabel = formatDateTime(endsAt) ?? "soon";
    return renderTemplate({
      preheader: "Your 30 day access ends in 3 business days.",
      title: "Your access ends in 3 business days",
      intro: [
        greeting(firstName),
        `This is a reminder that your current 30 day Investigation Tool access ends on ${endsLabel}.`,
      ],
      highlights: [
        "Maps created during this period remain available, but editing and some actions may become restricted after expiry.",
        "If you need to keep working without interruption, renew your access now.",
      ],
      ctaLabel: "Review access options",
      ctaUrl: actionUrl || absoluteUrl("/subscribe"),
    });
  },

  accessEndsToday({ firstName, endsAt, actionUrl }: AccessTemplateArgs): TemplateResult {
    const endsLabel = formatDateTime(endsAt) ?? "today";
    return renderTemplate({
      preheader: "Your 30 day access ends today.",
      title: "Your access ends today",
      intro: [
        greeting(firstName),
        `Your current 30 day access expires ${endsLabel}.`,
      ],
      highlights: [
        "Renew today if you want to keep full editing access to your investigation workflow.",
        "After expiry, access to maps created under this pass may be limited.",
      ],
      ctaLabel: "Renew access",
      ctaUrl: actionUrl || absoluteUrl("/subscribe"),
    });
  },

  accessExpired({ firstName, actionUrl }: AccessTemplateArgs): TemplateResult {
    return renderTemplate({
      preheader: "Your access has expired.",
      title: "Your access has expired",
      intro: [
        greeting(firstName),
        "Your current Investigation Tool access period has now ended.",
      ],
      highlights: [
        "Your investigation records are still retained.",
        "Choose a new access option to restore full editing and map creation functionality.",
      ],
      ctaLabel: "Choose access",
      ctaUrl: actionUrl || absoluteUrl("/subscribe"),
    });
  },

  paymentReceipt({ firstName, amountLabel, actionUrl }: BillingTemplateArgs): TemplateResult {
    return renderTemplate({
      preheader: "Your payment has been received.",
      title: "Payment confirmation",
      intro: [
        greeting(firstName),
        "Your payment has been received successfully.",
      ],
      highlights: [
        amountLabel ? `Amount received: ${amountLabel}.` : "Your payment has been recorded on your account.",
        "You can review your current access from your dashboard or account page.",
      ],
      ctaLabel: "Open dashboard",
      ctaUrl: actionUrl || absoluteUrl("/dashboard"),
    });
  },

  accountDeletionStarted({ firstName }: GreetingArgs): TemplateResult {
    return renderTemplate({
      preheader: "Your account deletion has started.",
      title: "Your account deletion is now being processed",
      intro: [
        greeting(firstName),
        "This email confirms that your Investigation Tool account deletion has started and is now in progress.",
      ],
      highlights: [
        "This is the final email sent for this account deletion request.",
        "Your login access, investigation maps, and associated workspace data are now being permanently removed.",
        "Once completed, this action cannot be undone.",
      ],
      note: "If you did not intend to delete your account, contact support immediately. If deletion has already completed, recovery may not be possible.",
    });
  },
};

export type EmailTemplateName = keyof typeof emailTemplates;
