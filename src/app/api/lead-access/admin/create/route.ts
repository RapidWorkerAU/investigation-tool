import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createLeadAccessCodeForEmail, fetchLeadMapCampaignBySlug, normalizeLeadAccessEmail, normalizeLeadAccessSlug } from "@/lib/leadAccess";

const platformAdminUserId = "420266a0-2087-4f36-8c28-340443dd1a82";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getUserFromAuthHeader(authHeader);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (user.userId !== platformAdminUserId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as { slug?: string; email?: string; note?: string };
    const slug = normalizeLeadAccessSlug(String(body?.slug ?? ""));
    const email = normalizeLeadAccessEmail(String(body?.email ?? ""));
    const note = typeof body?.note === "string" ? body.note : "";

    if (!slug || !email) {
      return NextResponse.json({ error: "Campaign slug and email are required." }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const campaign = await fetchLeadMapCampaignBySlug(slug);
    if (!campaign || !campaign.is_active) {
      return NextResponse.json({ error: "Lead access campaign not found." }, { status: 404 });
    }

    const generated = await createLeadAccessCodeForEmail({
      campaign,
      email,
      note,
      generatedBy: user,
    });

    return NextResponse.json({
      campaignTitle: campaign.title,
      accessLink: `/case-study/${campaign.slug}`,
      code: generated.code,
      email,
      generatedAt: generated.row.generated_at,
    });
  } catch (error) {
    console.error("Lead access code generation failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate lead access code." }, { status: 500 });
  }
}
