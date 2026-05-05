import { NextResponse } from "next/server";
import {
  isOrganisationMembershipRole,
  linkExistingUserToOrganisation,
  normalizeOptionalText,
} from "@/lib/adminOrganisationMemberships";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type LinkOrganisationBody = {
  organisationId?: string;
  role?: string;
};

export async function POST(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { userId } = await context.params;
    const body = (await request.json().catch(() => null)) as LinkOrganisationBody | null;
    const organisationId = normalizeOptionalText(body?.organisationId);
    const role = normalizeOptionalText(body?.role) ?? "general_user";

    if (!organisationId) {
      return NextResponse.json({ error: "Organisation is required." }, { status: 400 });
    }

    if (!isOrganisationMembershipRole(role)) {
      return NextResponse.json({ error: "Invalid organisation role." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const result = await linkExistingUserToOrganisation({
      supabase,
      organisationId,
      userId,
      role,
    });

    return NextResponse.json({ ok: true, joinedAt: result.joinedAt });
  } catch (error) {
    console.error("Admin link organisation to user failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to link organisation." },
      { status: 500 }
    );
  }
}
