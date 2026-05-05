import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import {
  createLeadAccessCodeForEmail,
  fetchLeadAccessCodeById,
  listActiveLeadMapCampaigns,
  revokeLeadAccessCode,
} from "@/lib/leadAccess";

const platformAdminUserId = "420266a0-2087-4f36-8c28-340443dd1a82";

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

    const body = (await request.json()) as { codeId?: string };
    const codeId = String(body?.codeId ?? "").trim();
    if (!codeId) {
      return NextResponse.json({ error: "Code id is required." }, { status: 400 });
    }

    const existing = await fetchLeadAccessCodeById(codeId);
    if (!existing) {
      return NextResponse.json({ error: "Lead access code not found." }, { status: 404 });
    }
    if (!existing.reserved_email && !existing.redeemed_email) {
      return NextResponse.json({ error: "This code is not tied to an email address and cannot be reset." }, { status: 400 });
    }

    const campaigns = await listActiveLeadMapCampaigns();
    const campaign = campaigns.find((item) => item.id === existing.campaign_id);
    if (!campaign) {
      return NextResponse.json({ error: "Associated campaign not found or inactive." }, { status: 404 });
    }

    await revokeLeadAccessCode(existing.id);
    const generated = await createLeadAccessCodeForEmail({
      campaign,
      email: existing.reserved_email || existing.redeemed_email || "",
      note: existing.note || null,
      generatedBy: user,
    });

    return NextResponse.json({
      campaignTitle: campaign.title,
      accessLink: `/case-study/${campaign.slug}`,
      code: generated.code,
      email: generated.row.reserved_email,
      generatedAt: generated.row.generated_at,
    });
  } catch (error) {
    console.error("Lead access reset failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to reset lead access code." }, { status: 500 });
  }
}
