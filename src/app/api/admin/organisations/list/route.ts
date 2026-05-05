import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type OrganisationRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_storage_path: string | null;
  section_heading_color: string | null;
  table_heading_color: string | null;
  created_at: string;
};

type MembershipRow = {
  organisation_id: string;
};

export async function GET(request: Request) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const supabase = createServiceRoleClient();

    const [{ data: organisations, error: organisationsError }, { data: memberships, error: membershipsError }] =
      await Promise.all([
        supabase
          .from("organisations")
          .select("id,name,slug,description,logo_storage_path,section_heading_color,table_heading_color,created_at")
          .order("name", { ascending: true }),
        supabase.from("organisation_memberships").select("organisation_id"),
      ]);

    if (organisationsError) {
      throw new Error(organisationsError.message);
    }

    if (membershipsError) {
      throw new Error(membershipsError.message);
    }

    const membershipCounts = new Map<string, number>();

    for (const row of (memberships ?? []) as MembershipRow[]) {
      membershipCounts.set(row.organisation_id, (membershipCounts.get(row.organisation_id) ?? 0) + 1);
    }

    const items = ((organisations ?? []) as OrganisationRow[]).map((organisation) => ({
      id: organisation.id,
      name: organisation.name,
      slug: organisation.slug ?? "",
      description: organisation.description ?? "",
      logoStoragePath: organisation.logo_storage_path ?? "",
      sectionHeadingColor: organisation.section_heading_color ?? "",
      tableHeadingColor: organisation.table_heading_color ?? "",
      createdAt: organisation.created_at,
      memberCount: membershipCounts.get(organisation.id) ?? 0,
    }));

    return NextResponse.json({ organisations: items });
  } catch (error) {
    console.error("Admin organisations list failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load organisations." },
      { status: 500 }
    );
  }
}
