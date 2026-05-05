import { NextResponse } from "next/server";
import { normalizeOrganisationBranding } from "@/lib/organisationBranding";
import { requireAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type MembershipRow = {
  organisation: Array<{
    logo_storage_path: string | null;
    section_heading_color: string | null;
    table_heading_color: string | null;
  }> | null;
};

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAdmin(request);
    if (response || !user) return response;

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("organisation_memberships")
      .select("organisation:organisations(logo_storage_path,section_heading_color,table_heading_color)")
      .eq("user_id", user.userId)
      .eq("invite_status", "active")
      .order("joined_at", { ascending: true, nullsFirst: false })
      .limit(1);

    if (error) throw new Error(error.message);

    const membership = ((data ?? []) as MembershipRow[])[0];
    const organisationBranding = normalizeOrganisationBranding(membership?.organisation?.[0] ?? null);

    return NextResponse.json({ branding: organisationBranding });
  } catch (error) {
    console.error("Organisation branding lookup failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load organisation branding." },
      { status: 500 },
    );
  }
}
