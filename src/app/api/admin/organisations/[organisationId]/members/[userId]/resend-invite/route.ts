import { NextResponse } from "next/server";
import { resendOrganisationInvite } from "@/lib/adminOrganisationMemberships";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ organisationId: string; userId: string }> }
) {
  try {
    const { user, response } = await requirePlatformAdmin(request);
    if (response || !user) return response;

    const { organisationId, userId } = await context.params;
    const supabase = createServiceRoleClient();
    const result = await resendOrganisationInvite({
      supabase,
      adminUserId: user.userId,
      organisationId,
      userId,
    });

    return NextResponse.json({
      ok: true,
      email: result.email,
      organisationName: result.organisationName,
      invitedAt: result.invitedAt,
    });
  } catch (error) {
    console.error("Admin resend organisation invite failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resend invite." },
      { status: 500 }
    );
  }
}
