type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
  }>;
};

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendResendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  tags,
  attachments,
}: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { skipped: true as const, reason: "Missing RESEND_API_KEY or RESEND_FROM_EMAIL" };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      reply_to: replyTo || process.env.RESEND_REPLY_TO_EMAIL || undefined,
      tags,
      attachments,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed: ${response.status} ${body}`);
  }

  return response.json();
}
