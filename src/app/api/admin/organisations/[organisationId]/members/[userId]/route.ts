import { NextResponse } from "next/server";
import {
  isOrganisationMembershipRole,
  isOrganisationMembershipStatus,
  normalizeOptionalText,
  updateOrganisationMembership,
} from "@/lib/adminOrganisationMemberships";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type UpdateMembershipBody = {
  role?: string;
  inviteStatus?: string;
  departmentId?: string | null;
  siteId?: string | null;
  leaderUserId?: string | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ organisationId: string; userId: string }> }
) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { organisationId, userId } = await context.params;
    const body = (await request.json().catch(() => null)) as UpdateMembershipBody | null;
    const role = normalizeOptionalText(body?.role);
    const inviteStatus = normalizeOptionalText(body?.inviteStatus);
    const departmentId = normalizeOptionalText(body?.departmentId);
    const siteId = normalizeOptionalText(body?.siteId);
    const leaderUserId = normalizeOptionalText(body?.leaderUserId);

    if (!isOrganisationMembershipRole(role)) {
      return NextResponse.json({ error: "Invalid organisation role." }, { status: 400 });
    }

    if (!isOrganisationMembershipStatus(inviteStatus)) {
      return NextResponse.json({ error: "Invalid membership status." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    await updateOrganisationMembership({
      supabase,
      organisationId,
      userId,
      role,
      inviteStatus,
      departmentId,
      siteId,
      leaderUserId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin update organisation membership failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update membership." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ organisationId: string; userId: string }> }
) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { organisationId, userId } = await context.params;
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("organisation_memberships")
      .delete()
      .eq("organisation_id", organisationId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin delete organisation membership failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete membership." },
      { status: 500 }
    );
  }
}
