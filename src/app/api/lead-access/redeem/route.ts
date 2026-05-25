import { NextRequest, NextResponse } from "next/server";
import {
  buildLeadAccessRedeemedMessage,
  createLeadAccessSessionCookieValue,
  fetchLeadAccessCodeByHash,
  fetchLeadMapCampaignBySlug,
  getLeadAccessCookieName,
  getLeadAccessSessionExpiresAt,
  hashLeadAccessCode,
  isLeadAccessSessionIndefinite,
  LEAD_ACCESS_PERSISTENT_COOKIE_MAX_AGE_SECONDS,
  normalizeLeadAccessCode,
  normalizeLeadAccessEmail,
  normalizeLeadAccessSlug,
  redeemLeadAccessCode,
} from "@/lib/leadAccess";
import { enforceRateLimit } from "@/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const ipLimit = enforceRateLimit(request, {
      scope: "lead-access-redeem-ip",
      limit: 40,
      windowMs: 15 * 60 * 1000,
    });
    if (ipLimit) return ipLimit;

    const body = (await request.json()) as { slug?: string; email?: string; code?: string };
    const slug = normalizeLeadAccessSlug(String(body?.slug ?? ""));
    const email = normalizeLeadAccessEmail(String(body?.email ?? ""));
    const normalizedCode = normalizeLeadAccessCode(String(body?.code ?? ""));

    if (!slug || !email || !normalizedCode) {
      return NextResponse.json({ error: "Email and access code are required." }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const emailLimit = enforceRateLimit(request, {
      scope: "lead-access-redeem-email",
      identifier: `${slug}:${email}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (emailLimit) return emailLimit;

    const campaign = await fetchLeadMapCampaignBySlug(slug);
    if (!campaign || !campaign.is_active) {
      return NextResponse.json({ error: "This lead access page is unavailable." }, { status: 404 });
    }

    const codeRow = await fetchLeadAccessCodeByHash(campaign.id, hashLeadAccessCode(normalizedCode));
    if (!codeRow || codeRow.revoked_at) {
      return NextResponse.json({ error: "That access code is invalid." }, { status: 400 });
    }

    if (codeRow.reserved_email && codeRow.reserved_email !== email) {
      return NextResponse.json({ error: "That access code is assigned to a different email address." }, { status: 400 });
    }

    const allowRedeemedCodeReuse =
      isLeadAccessSessionIndefinite(campaign.session_duration_hours) && codeRow.redeemed_email === email;

    if (codeRow.redeemed_at && codeRow.redeemed_email && !allowRedeemedCodeReuse) {
      return NextResponse.json(
        { error: buildLeadAccessRedeemedMessage(codeRow.redeemed_email, codeRow.redeemed_at) },
        { status: 409 }
      );
    }

    let redeemed = codeRow.redeemed_at && codeRow.redeemed_email ? codeRow : await redeemLeadAccessCode(codeRow.id, email);
    if (!redeemed?.redeemed_at || !redeemed.redeemed_email) {
      const latest = await fetchLeadAccessCodeByHash(campaign.id, codeRow.code_hash);
      if (latest?.redeemed_at && latest.redeemed_email) {
        if (isLeadAccessSessionIndefinite(campaign.session_duration_hours) && latest.redeemed_email === email) {
          redeemed = latest;
        } else {
          return NextResponse.json(
            { error: buildLeadAccessRedeemedMessage(latest.redeemed_email, latest.redeemed_at) },
            { status: 409 }
          );
        }
      }

      if (!redeemed?.redeemed_at || !redeemed.redeemed_email) {
        return NextResponse.json({ error: "Unable to redeem that access code." }, { status: 409 });
      }
    }

    const expiresAt = getLeadAccessSessionExpiresAt(campaign.session_duration_hours);
    const cookieValue = createLeadAccessSessionCookieValue({
      campaignId: campaign.id,
      codeId: redeemed.id,
      mapId: campaign.map_id,
      redeemedEmail: redeemed.redeemed_email,
      expiresAt,
    });
    const response = NextResponse.json({
      redirectPath: `/lead-map/${campaign.slug}`,
    });
    response.cookies.set({
      name: getLeadAccessCookieName(campaign.slug),
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(expiresAt
        ? { expires: new Date(expiresAt) }
        : { maxAge: LEAD_ACCESS_PERSISTENT_COOKIE_MAX_AGE_SECONDS }),
    });
    return response;
  } catch (error) {
    console.error("Lead access redemption failed", error);
    return NextResponse.json({ error: "Unable to redeem access at the moment." }, { status: 500 });
  }
}
