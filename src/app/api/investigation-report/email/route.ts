import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { emailTemplates, sendResendEmail } from "@/lib/email";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { insertUserProfileActivity } from "@/lib/userProfileActivity";

export const runtime = "nodejs";

type EmailReportBody = {
  to?: string;
  reportTitle?: string;
  incidentDate?: string;
  incidentLocation?: string;
  responsibleName?: string;
  executiveSummary?: string;
  filename?: string;
  pdfBase64?: string;
};

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const serviceSupabase = createServiceRoleClient();
  const recordEmailActivity = async (
    status: "success" | "failed",
    summary: string,
    metadata: Record<string, unknown> = {},
  ) => {
    await insertUserProfileActivity(serviceSupabase, {
      userId: user.userId,
      actorUserId: user.userId,
      action: "pdf_report_email",
      status,
      summary,
      metadata,
    });
  };

  const body = (await request.json().catch(() => null)) as EmailReportBody | null;
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  const reportTitle = typeof body?.reportTitle === "string" && body.reportTitle.trim() ? body.reportTitle.trim() : "Investigation Report";
  const incidentDate = typeof body?.incidentDate === "string" ? body.incidentDate.trim() : "";
  const incidentLocation = typeof body?.incidentLocation === "string" ? body.incidentLocation.trim() : "";
  const responsibleName = typeof body?.responsibleName === "string" ? body.responsibleName.trim() : "";
  const executiveSummary = typeof body?.executiveSummary === "string" ? body.executiveSummary.trim() : "";
  const filename = typeof body?.filename === "string" && body.filename.trim() ? body.filename.trim() : "investigation-report.pdf";
  const pdfBase64 = typeof body?.pdfBase64 === "string" ? body.pdfBase64.trim() : "";

  if (!to || !isLikelyEmail(to)) {
    await recordEmailActivity("failed", "PDF report email failed.", {
      source: "validation",
      reason: "invalid_recipient",
      reportTitle,
    });
    return NextResponse.json({ error: "A valid recipient email is required." }, { status: 400 });
  }

  if (!pdfBase64) {
    await recordEmailActivity("failed", "PDF report email failed.", {
      source: "validation",
      reason: "missing_attachment",
      to,
      reportTitle,
      filename,
    });
    return NextResponse.json({ error: "PDF attachment is required." }, { status: 400 });
  }

  const email = emailTemplates.sharedInvestigationReport({
    senderEmail: user.email,
    reportTitle,
    incidentDate,
    incidentLocation,
    responsibleName,
    executiveSummary,
  });

  try {
    await sendResendEmail({
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      tags: [{ name: "category", value: "investigation-report" }],
      attachments: [
        {
          filename,
          content: pdfBase64,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (emailError) {
    await recordEmailActivity("failed", "PDF report email failed.", {
      source: "resend",
      error: emailError instanceof Error ? emailError.message : String(emailError),
      to,
      reportTitle,
      filename,
    });
    return NextResponse.json({ error: "Unable to email PDF." }, { status: 500 });
  }

  await recordEmailActivity("success", "PDF report emailed.", {
    source: "resend",
    to,
    reportTitle,
    filename,
  });

  return NextResponse.json({ ok: true });
}
