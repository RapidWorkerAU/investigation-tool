import { sendResendEmail } from "./resend";
import { classifySiteIssue, inferSiteIssueSource, type SiteIssueReport } from "@/lib/siteIssues/shared";

const DEFAULT_ERROR_RECIPIENTS = [
  "ashleigh.phillips@hses.com.au",
  "ashleigh.s.phillips@hotmail.com",
];

function getWebsiteErrorRecipients() {
  const configured = process.env.WEBSITE_ERROR_NOTIFICATION_EMAILS;
  const recipients = configured
    ? configured
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : DEFAULT_ERROR_RECIPIENTS;

  return recipients.length > 0 ? recipients : DEFAULT_ERROR_RECIPIENTS;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanValue(value: unknown, fallback = "Not provided") {
  if (value === null || value === undefined) return fallback;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

function logoUrl() {
  return `${siteUrl()}/images/investigation-tool.png`;
}

function formatMetadata(metadata: SiteIssueReport["metadata"]) {
  if (!metadata || typeof metadata !== "object") return "Not provided";

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return "Metadata could not be serialized.";
  }
}

function formatSourceLabel(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

export async function sendWebsiteErrorEmail(report: SiteIssueReport) {
  const source = inferSiteIssueSource(report);
  const assessment = classifySiteIssue({ ...report, source });
  const occurredAt = report.timestamp || new Date().toISOString();
  const action = cleanValue(report.action, "Unknown action");
  const endpoint = cleanValue(report.endpoint);
  const status = report.status ? String(report.status) : "Not provided";
  const technicalMessage = cleanValue(report.technicalMessage, "No technical message supplied.");
  const stack = cleanValue(report.stack);
  const metadata = formatMetadata(report.metadata);
  const subjectSource = formatSourceLabel(source);
  const subject = `Investigation Tool website error: ${subjectSource} - ${truncate(action, 48)}`;

  const summaryRows = [
    ["Likely source", subjectSource],
    ["Assessment", assessment],
    ["Action", action],
    ["Status", status],
    ["Endpoint", endpoint],
    ["Page URL", cleanValue(report.pageUrl)],
    ["User message shown", cleanValue(report.userMessage)],
    ["Occurred at", occurredAt],
  ];

  const htmlRows = summaryRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e6edf7;color:#5f6b7a;font-size:13px;font-weight:700;width:170px;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e6edf7;color:#182230;font-size:13px;line-height:1.5;word-break:break-word;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="color-scheme" content="light">
  </head>
  <body style="margin:0;padding:0;background:#eef3fb;font-family:Arial,sans-serif;color:#182230;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#eef3fb" style="background:#eef3fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width:720px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 20px 44px rgba(20,34,70,0.12);">
            <tr>
              <td bgcolor="#1747b9" style="padding:26px 28px 22px;background:#1747b9;background-image:linear-gradient(135deg,#1747b9 0%,#2f77df 42%,#5ba1ff 100%);color:#ffffff;">
                <img src="${escapeHtml(logoUrl())}" alt="Investigation Tool" width="50" height="50" style="display:block;width:50px;height:50px;object-fit:contain;margin-bottom:14px;">
                <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.86;font-weight:700;">Investigation Tool</div>
                <h1 style="margin:9px 0 0;font-size:28px;line-height:1.15;font-weight:700;color:#ffffff;">Website error notification</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 28px;background:#ffffff;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#425166;">A website error was flagged and a user-facing notification was shown. Technical details are below for triage.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbe6f5;border-radius:12px;overflow:hidden;border-collapse:separate;">
                  ${htmlRows}
                </table>

                <h2 style="margin:24px 0 8px;font-size:16px;color:#182230;">Technical message</h2>
                <pre style="white-space:pre-wrap;word-break:break-word;background:#f7f9fc;border:1px solid #dbe6f5;border-radius:12px;padding:14px;color:#263244;font-size:13px;line-height:1.5;">${escapeHtml(technicalMessage)}</pre>

                <h2 style="margin:20px 0 8px;font-size:16px;color:#182230;">Stack</h2>
                <pre style="white-space:pre-wrap;word-break:break-word;background:#f7f9fc;border:1px solid #dbe6f5;border-radius:12px;padding:14px;color:#263244;font-size:12px;line-height:1.45;">${escapeHtml(stack)}</pre>

                <h2 style="margin:20px 0 8px;font-size:16px;color:#182230;">Metadata</h2>
                <pre style="white-space:pre-wrap;word-break:break-word;background:#f7f9fc;border:1px solid #dbe6f5;border-radius:12px;padding:14px;color:#263244;font-size:12px;line-height:1.45;">${escapeHtml(metadata)}</pre>

                <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#64748b;">User agent: ${escapeHtml(cleanValue(report.userAgent))}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  const text = [
    "Investigation Tool website error notification",
    "",
    "A website error was flagged and a user-facing notification was shown.",
    "",
    ...summaryRows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Technical message:",
    technicalMessage,
    "",
    "Stack:",
    stack,
    "",
    "Metadata:",
    metadata,
    "",
    `User agent: ${cleanValue(report.userAgent)}`,
  ].join("\n");

  return sendResendEmail({
    to: getWebsiteErrorRecipients(),
    subject,
    html,
    text,
    tags: [
      { name: "category", value: "site-error" },
      { name: "template", value: "website-error" },
      { name: "source", value: String(source).slice(0, 40) },
    ],
  });
}
