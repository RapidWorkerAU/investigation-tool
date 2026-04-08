import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { emailTemplates, sendResendEmail } from "@/lib/email";

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
    return NextResponse.json({ error: "A valid recipient email is required." }, { status: 400 });
  }

  if (!pdfBase64) {
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

  return NextResponse.json({ ok: true });
}
