import { NextRequest, NextResponse } from "next/server";
import { getEmailPreviewByKey } from "@/lib/email/preview";
import { sendResendEmail } from "@/lib/email";

const PREVIEW_PASSWORD = "ashleighphillips59";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const templateKey = typeof body?.templateKey === "string" ? body.templateKey.trim() : "";
  const password = typeof body?.password === "string" ? body.password.trim().toLowerCase() : "";

  if (password !== PREVIEW_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!email || !templateKey) {
    return NextResponse.json({ error: "Email and template are required." }, { status: 400 });
  }

  const preview = getEmailPreviewByKey(templateKey);
  if (!preview) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  try {
    await sendResendEmail({
      to: email,
      subject: `[Preview] ${preview.subject}`,
      html: preview.html,
      text: preview.text,
      tags: [
        { name: "category", value: "preview" },
        { name: "template", value: preview.key },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send preview email." },
      { status: 500 },
    );
  }
}
