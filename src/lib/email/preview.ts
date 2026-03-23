import { emailTemplates } from "@/lib/email";

export type PreviewCard = {
  key: string;
  title: string;
  subject: string;
  html: string;
  copyHtml: string;
  text: string;
  supabaseSubject?: string;
  supabaseBody?: string;
};

const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`;
const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`;
const subscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/subscribe`;
const accountUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account`;
const supabaseConfirmationUrl = "{{ .ConfirmationURL }}";
const publicSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://investigationtool.com.au";
const publicLogoUrl = `${publicSiteUrl}/images/investigation-tool.png`;

function toCopyHtml(html: string) {
  return html
    .replace(/src="data:image\/png;base64,[^"]+"/, `src="${publicLogoUrl}"`)
    .replaceAll("https://localhost:3000", publicSiteUrl)
    .replaceAll("http://localhost:3000", publicSiteUrl);
}

const supabaseGreeting = "{{ if .Data.full_name }}Hi {{ .Data.full_name }},{{ else }}Hi,{{ end }}";

const supabaseEmailHead = `
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
      :root {
        color-scheme: light;
        supported-color-schemes: light;
      }
      body, table, td, div, p, a, h1 {
        font-family: Arial, sans-serif !important;
      }
      .email-page {
        background-color: #eef3fb !important;
      }
      .email-card {
        background-color: #ffffff !important;
      }
      .email-hero {
        background-color: #1747b9 !important;
        background-image: linear-gradient(135deg, #1747b9 0%, #2f77df 42%, #5ba1ff 100%) !important;
      }
      .email-hero-text,
      .email-hero-text div,
      .email-hero-text h1 {
        color: #ffffff !important;
      }
      .email-copy {
        color: #425166 !important;
      }
      .email-highlight {
        background-color: #f6f9ff !important;
        border-color: #d8e4fb !important;
      }
      .email-highlight p {
        color: #30435f !important;
      }
      .email-note {
        color: #5a6472 !important;
      }
      .email-footer {
        color: #6b7280 !important;
        border-top-color: #e5e7eb !important;
      }
      .email-footer a,
      .email-link {
        color: #234ea8 !important;
        text-decoration: underline !important;
        font-weight: 600 !important;
      }
      .email-button-primary {
        display: inline-block !important;
        padding: 14px 24px !important;
        background: #2e69d6 !important;
        border: 1px solid #2e69d6 !important;
        border-radius: 12px !important;
        color: #ffffff !important;
        text-decoration: none !important;
        font-weight: 700 !important;
      }
    </style>
  </head>`;

const supabaseConfirmBody = `
<!DOCTYPE html>
<html lang="en">
  ${supabaseEmailHead}
  <body class="email-page" style="margin:0;padding:0;background:#eef3fb;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirm your account to finish setting up your Investigation Tool workspace.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#eef3fb" class="email-page" style="background:#eef3fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" class="email-card" style="max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 44px rgba(20,34,70,0.12);">
            <tr>
              <td bgcolor="#1747b9" class="email-hero email-hero-text" style="padding:28px 28px 20px;background:#1747b9;background-image:linear-gradient(135deg,#1747b9 0%,#2f77df 42%,#5ba1ff 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.84;font-weight:700;">Investigation Tool</div>
                <h1 style="margin:10px 0 0;font-size:30px;line-height:1.1;font-weight:700;">Confirm your account</h1>
              </td>
            </tr>
            <tr>
              <td bgcolor="#ffffff" class="email-card" style="padding:28px;background:#ffffff;">
                <p class="email-copy" style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#425166;">${supabaseGreeting}</p>
                <p class="email-copy" style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#425166;">Welcome to Investigation Tool. Please confirm your email address so you can start creating maps, managing evidence, and collaborating with your team.</p>
                <div class="email-highlight" style="margin:20px 0;padding:18px 18px 4px;background:#f6f9ff;border:1px solid #d8e4fb;border-radius:16px;">
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#30435f;">Confirming your email unlocks your workspace sign-in.</p>
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#30435f;">If you did not create this account, you can safely ignore this email.</p>
                </div>
                <div style="padding-top:8px;">
                  <a href="{{ .ConfirmationURL }}" class="email-button-primary" style="display:inline-block;padding:14px 24px;background:#2e69d6;color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;border:1px solid #2e69d6;">Confirm account</a>
                </div>
                <p class="email-note" style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#5a6472;">For security, use the latest confirmation email in your inbox if you requested more than one.</p>
              </td>
            </tr>
            <tr>
              <td bgcolor="#ffffff" class="email-card" style="padding:0 28px 28px;background:#ffffff;">
                <div class="email-footer" style="padding-top:18px;border-top:1px solid #e5e7eb;font-size:13px;line-height:1.7;color:#6b7280;">
                  Need help? Reply to <a class="email-link" href="mailto:support@investigationtool.com.au" style="color:#234ea8;text-decoration:underline;font-weight:600;">support@investigationtool.com.au</a>.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

const supabaseResetBody = `
<!DOCTYPE html>
<html lang="en">
  ${supabaseEmailHead}
  <body class="email-page" style="margin:0;padding:0;background:#eef3fb;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Reset your Investigation Tool password.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#eef3fb" class="email-page" style="background:#eef3fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" class="email-card" style="max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 44px rgba(20,34,70,0.12);">
            <tr>
              <td bgcolor="#1747b9" class="email-hero email-hero-text" style="padding:28px 28px 20px;background:#1747b9;background-image:linear-gradient(135deg,#1747b9 0%,#2f77df 42%,#5ba1ff 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.84;font-weight:700;">Investigation Tool</div>
                <h1 style="margin:10px 0 0;font-size:30px;line-height:1.1;font-weight:700;">Reset your password</h1>
              </td>
            </tr>
            <tr>
              <td bgcolor="#ffffff" class="email-card" style="padding:28px;background:#ffffff;">
                <p class="email-copy" style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#425166;">${supabaseGreeting}</p>
                <p class="email-copy" style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#425166;">We received a request to reset the password for your Investigation Tool account.</p>
                <div class="email-highlight" style="margin:20px 0;padding:18px 18px 4px;background:#f6f9ff;border:1px solid #d8e4fb;border-radius:16px;">
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#30435f;">Use the button below to choose a new password.</p>
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#30435f;">If you did not request this change, you can ignore this email and your password will remain the same.</p>
                </div>
                <div style="padding-top:8px;">
                  <a href="{{ .ConfirmationURL }}" class="email-button-primary" style="display:inline-block;padding:14px 24px;background:#2e69d6;color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;border:1px solid #2e69d6;">Set a new password</a>
                </div>
                <p class="email-note" style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#5a6472;">Password reset links can expire. If this link no longer works, request a new reset email from the login page.</p>
              </td>
            </tr>
            <tr>
              <td bgcolor="#ffffff" class="email-card" style="padding:0 28px 28px;background:#ffffff;">
                <div class="email-footer" style="padding-top:18px;border-top:1px solid #e5e7eb;font-size:13px;line-height:1.7;color:#6b7280;">
                  Need help? Reply to <a class="email-link" href="mailto:support@investigationtool.com.au" style="color:#234ea8;text-decoration:underline;font-weight:600;">support@investigationtool.com.au</a>.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

const supabaseEmailChangeBody = `
<!DOCTYPE html>
<html lang="en">
  ${supabaseEmailHead}
  <body class="email-page" style="margin:0;padding:0;background:#eef3fb;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Confirm your new email address for Investigation Tool.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#eef3fb" class="email-page" style="background:#eef3fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" class="email-card" style="max-width:640px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 44px rgba(20,34,70,0.12);">
            <tr>
              <td bgcolor="#1747b9" class="email-hero email-hero-text" style="padding:28px 28px 20px;background:#1747b9;background-image:linear-gradient(135deg,#1747b9 0%,#2f77df 42%,#5ba1ff 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.84;font-weight:700;">Investigation Tool</div>
                <h1 style="margin:10px 0 0;font-size:30px;line-height:1.1;font-weight:700;">Confirm your new email address</h1>
              </td>
            </tr>
            <tr>
              <td bgcolor="#ffffff" class="email-card" style="padding:28px;background:#ffffff;">
                <p class="email-copy" style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#425166;">${supabaseGreeting}</p>
                <p class="email-copy" style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#425166;">We received a request to change the email address on your Investigation Tool account.</p>
                <div class="email-highlight" style="margin:20px 0;padding:18px 18px 4px;background:#f6f9ff;border:1px solid #d8e4fb;border-radius:16px;">
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#30435f;">Confirm the new email address to complete the change.</p>
                  <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#30435f;">If you did not request this change, you can ignore this email.</p>
                </div>
                <div style="padding-top:8px;">
                  <a href="{{ .ConfirmationURL }}" class="email-button-primary" style="display:inline-block;padding:14px 24px;background:#2e69d6;color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;border:1px solid #2e69d6;">Confirm email change</a>
                </div>
              </td>
            </tr>
            <tr>
              <td bgcolor="#ffffff" class="email-card" style="padding:0 28px 28px;background:#ffffff;">
                <div class="email-footer" style="padding-top:18px;border-top:1px solid #e5e7eb;font-size:13px;line-height:1.7;color:#6b7280;">
                  Need help? Reply to <a class="email-link" href="mailto:support@investigationtool.com.au" style="color:#234ea8;text-decoration:underline;font-weight:600;">support@investigationtool.com.au</a>.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

export function buildEmailPreviews(): PreviewCard[] {
  const confirm = emailTemplates.confirmAccount({ firstName: "Ashleigh", actionUrl: supabaseConfirmationUrl });
  const forgot = emailTemplates.forgotPassword({ firstName: "Ashleigh", actionUrl: supabaseConfirmationUrl });
  const passwordChanged = emailTemplates.passwordChanged({ firstName: "Ashleigh", actionUrl: loginUrl });
  const welcome = emailTemplates.welcome({ firstName: "Ashleigh", actionUrl: dashboardUrl });
  const trialStarted = emailTemplates.trialStarted({ firstName: "Ashleigh", endsAt: "2026-03-24T09:00:00Z", actionUrl: dashboardUrl });
  const trialEndsToday = emailTemplates.trialEndsToday({ firstName: "Ashleigh", endsAt: "2026-03-24T09:00:00Z", actionUrl: subscribeUrl });
  const pass30 = emailTemplates.pass30Started({
    firstName: "Ashleigh",
    endsAt: "2026-04-16T09:00:00Z",
    actionUrl: dashboardUrl,
    amountLabel: "AUD 149.00",
  });
  const subscriptionStarted = emailTemplates.subscriptionStarted({ firstName: "Ashleigh", renewalDate: "2026-04-16T09:00:00Z", actionUrl: dashboardUrl });
  const subscriptionRenewed = emailTemplates.subscriptionRenewed({ firstName: "Ashleigh", renewalDate: "2026-05-16T09:00:00Z", actionUrl: dashboardUrl });
  const subscriptionCancelled = emailTemplates.subscriptionCancelled({ firstName: "Ashleigh", renewalDate: "2026-04-16T09:00:00Z", actionUrl: dashboardUrl });
  const subscriptionReactivated = emailTemplates.subscriptionReactivated({ firstName: "Ashleigh", renewalDate: "2026-04-16T09:00:00Z", actionUrl: dashboardUrl });
  const paymentFailed = emailTemplates.paymentFailed({ firstName: "Ashleigh", actionUrl: accountUrl });
  const paymentReceipt = emailTemplates.paymentReceipt({ firstName: "Ashleigh", amountLabel: "AUD 149.00", actionUrl: dashboardUrl });
  const endingSoon = emailTemplates.accessEndingSoon({ firstName: "Ashleigh", endsAt: "2026-04-13T09:00:00Z", actionUrl: subscribeUrl });
  const endsToday = emailTemplates.accessEndsToday({ firstName: "Ashleigh", endsAt: "2026-04-16T09:00:00Z", actionUrl: subscribeUrl });
  const expired = emailTemplates.accessExpired({ firstName: "Ashleigh", actionUrl: subscribeUrl });
  const deletion = emailTemplates.accountDeletionStarted({ firstName: "Ashleigh" });

  return [
    {
      key: "confirm-account",
      title: "Confirm account",
      ...confirm,
      copyHtml: toCopyHtml(confirm.html),
      supabaseSubject: "Confirm Your Account",
      supabaseBody: supabaseConfirmBody,
    },
    {
      key: "forgot-password",
      title: "Forgot password",
      ...forgot,
      copyHtml: toCopyHtml(forgot.html),
      supabaseSubject: "Reset Your Password",
      supabaseBody: supabaseResetBody,
    },
    {
      key: "change-email",
      title: "Change email address",
      subject: "Confirm Your New Email Address",
      html: supabaseEmailChangeBody,
      text: [
        "Confirm your new email address",
        "",
        "Hi Ashleigh,",
        "We received a request to change the email address on your Investigation Tool account.",
        "",
        "- Confirm the new email address to complete the change.",
        "- If you did not request this change, you can ignore this email.",
        "",
        "Confirm email change: {{ .ConfirmationURL }}",
        "",
        "Need help? Reply to support@investigationtool.com.au.",
        "",
        "Investigation Tool",
      ].join("\n"),
      copyHtml: toCopyHtml(supabaseEmailChangeBody),
      supabaseSubject: "Confirm Your New Email Address",
      supabaseBody: supabaseEmailChangeBody,
    },
    {
      key: "password-changed",
      title: "Password changed",
      ...passwordChanged,
      copyHtml: toCopyHtml(passwordChanged.html),
    },
    {
      key: "welcome",
      title: "Welcome",
      ...welcome,
      copyHtml: toCopyHtml(welcome.html),
    },
    {
      key: "trial-started",
      title: "Trial started",
      ...trialStarted,
      copyHtml: toCopyHtml(trialStarted.html),
    },
    {
      key: "trial-ends-today",
      title: "Trial ends today",
      ...trialEndsToday,
      copyHtml: toCopyHtml(trialEndsToday.html),
    },
    {
      key: "pass-30-started",
      title: "30 day access confirmed",
      ...pass30,
      copyHtml: toCopyHtml(pass30.html),
    },
    {
      key: "subscription-started",
      title: "Subscription started",
      ...subscriptionStarted,
      copyHtml: toCopyHtml(subscriptionStarted.html),
    },
    {
      key: "subscription-renewed",
      title: "Subscription renewed",
      ...subscriptionRenewed,
      copyHtml: toCopyHtml(subscriptionRenewed.html),
    },
    {
      key: "subscription-cancelled",
      title: "Subscription cancelled",
      ...subscriptionCancelled,
      copyHtml: toCopyHtml(subscriptionCancelled.html),
    },
    {
      key: "subscription-reactivated",
      title: "Subscription reactivated",
      ...subscriptionReactivated,
      copyHtml: toCopyHtml(subscriptionReactivated.html),
    },
    {
      key: "payment-failed",
      title: "Payment failed",
      ...paymentFailed,
      copyHtml: toCopyHtml(paymentFailed.html),
    },
    {
      key: "payment-receipt",
      title: "Payment receipt",
      ...paymentReceipt,
      copyHtml: toCopyHtml(paymentReceipt.html),
    },
    {
      key: "access-ending-soon",
      title: "Access ending in 3 business days",
      ...endingSoon,
      copyHtml: toCopyHtml(endingSoon.html),
    },
    {
      key: "access-ends-today",
      title: "Access ends today",
      ...endsToday,
      copyHtml: toCopyHtml(endsToday.html),
    },
    {
      key: "access-expired",
      title: "Access expired",
      ...expired,
      copyHtml: toCopyHtml(expired.html),
    },
    {
      key: "account-deletion-started",
      title: "Account deletion started",
      ...deletion,
      copyHtml: toCopyHtml(deletion.html),
    },
  ];
}

export function getEmailPreviewByKey(key: string) {
  return buildEmailPreviews().find((preview) => preview.key === key) ?? null;
}
