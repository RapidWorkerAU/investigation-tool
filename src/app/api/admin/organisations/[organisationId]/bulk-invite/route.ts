import { NextResponse } from "next/server";
import {
  inviteOrganisationUser,
  isOrganisationMembershipRole,
  type OrganisationMembershipRole,
  normalizeOptionalText,
} from "@/lib/adminOrganisationMemberships";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type BulkInviteEntry = {
  email?: string;
  fullName?: string;
  role?: string;
};

type BulkInviteBody = {
  entries?: BulkInviteEntry[];
};

export async function POST(request: Request, context: { params: Promise<{ organisationId: string }> }) {
  try {
    const { user, response } = await requirePlatformAdmin(request);
    if (response || !user) return response;

    const { organisationId } = await context.params;
    const body = (await request.json().catch(() => null)) as BulkInviteBody | null;
    const entries = (body?.entries ?? [])
      .map((entry) => ({
        email: normalizeOptionalText(entry.email),
        fullName: normalizeOptionalText(entry.fullName),
        role: normalizeOptionalText(entry.role) ?? "general_user",
      }))
      .filter((entry) => entry.email);

    if (!entries.length) {
      return NextResponse.json({ error: "Add at least one user to create." }, { status: 400 });
    }

    for (const entry of entries) {
      if (!isOrganisationMembershipRole(entry.role)) {
        return NextResponse.json({ error: `Invalid organisation role for ${entry.email}.` }, { status: 400 });
      }
    }

    const supabase = createServiceRoleClient();
    const invited: Array<{ email: string; userId: string }> = [];
    const failures: Array<{ email: string; error: string }> = [];

    for (const entry of entries) {
      try {
        const result = await inviteOrganisationUser({
          supabase,
          adminUserId: user.userId,
          organisationId,
          email: entry.email!,
          fullName: entry.fullName,
          role: entry.role as OrganisationMembershipRole,
        });
        invited.push({ email: entry.email!, userId: result.invitedUserId });
      } catch (error) {
        failures.push({
          email: entry.email!,
          error: error instanceof Error ? error.message : "Unable to create user.",
        });
      }
    }

    return NextResponse.json(
      {
        ok: failures.length === 0,
        invited,
        failures,
      },
      { status: failures.length ? 207 : 200 }
    );
  } catch (error) {
    console.error("Admin bulk invite organisation users failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to bulk create users." },
      { status: 500 }
    );
  }
}
