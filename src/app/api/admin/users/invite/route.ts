import { NextResponse } from "next/server";
import {
  inviteOrganisationUser,
  isOrganisationMembershipRole,
  normalizeOptionalText,
} from "@/lib/adminOrganisationMemberships";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type InviteUserBody = {
  organisationId?: string;
  email?: string;
  fullName?: string;
  role?: "org_admin" | "general_user";
  departmentId?: string | null;
  siteId?: string | null;
  leaderUserId?: string | null;
};

export async function POST(request: Request) {
  try {
    const { user, response } = await requirePlatformAdmin(request);
    if (response || !user) return response;

    const body = (await request.json().catch(() => null)) as InviteUserBody | null;
    const organisationId = normalizeOptionalText(body?.organisationId);
    const email = normalizeOptionalText(body?.email)?.toLowerCase() ?? "";
    const fullName = normalizeOptionalText(body?.fullName);
    const role = normalizeOptionalText(body?.role) ?? "general_user";
    const departmentId = normalizeOptionalText(body?.departmentId);
    const siteId = normalizeOptionalText(body?.siteId);
    const leaderUserId = normalizeOptionalText(body?.leaderUserId);

    if (!organisationId || !email) {
      return NextResponse.json({ error: "Organisation and email are required." }, { status: 400 });
    }

    if (!isOrganisationMembershipRole(role)) {
      return NextResponse.json({ error: "Invalid organisation role." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const result = await inviteOrganisationUser({
      supabase,
      adminUserId: user.userId,
      organisationId,
      email,
      fullName,
      role,
      departmentId,
      siteId,
      leaderUserId,
    });

    return NextResponse.json({
      ok: true,
      organisationName: result.organisationName,
      invitedUserId: result.invitedUserId,
      invitedAt: result.invitedAt,
    });
  } catch (error) {
    console.error("Admin organisation user invite failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to invite user." },
      { status: 500 }
    );
  }
}
