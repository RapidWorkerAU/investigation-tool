import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

type MembershipRow = {
  organisation_id: string;
  role: string;
  invite_status: string;
  joined_at: string | null;
  leader_user_id: string | null;
  organisation: Array<{ id: string; name: string; slug: string | null }> | null;
  department: Array<{ id: string; name: string }> | null;
  site: Array<{ id: string; name: string }> | null;
};

type DepartmentRow = {
  id: string;
  organisation_id: string;
  name: string;
};

type SiteRow = {
  id: string;
  organisation_id: string;
  name: string;
};

type ReportRow = {
  organisation_id: string;
  user_id: string;
  organisation: Array<{ id: string; name: string }> | null;
};

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { userId } = await context.params;
    const supabase = createServiceRoleClient();

    const [
      { data: profile, error: profileError },
      { data: memberships, error: membershipsError },
      { data: directReports, error: directReportsError },
    ] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,created_at").eq("id", userId).maybeSingle(),
      supabase
        .from("organisation_memberships")
        .select(
          "organisation_id,role,invite_status,joined_at,leader_user_id,organisation:organisations(id,name,slug),department:organisation_departments(id,name),site:organisation_sites(id,name)"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("organisation_memberships")
        .select(
          "organisation_id,user_id,organisation:organisations(id,name)"
        )
        .eq("leader_user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    if (profileError) throw new Error(profileError.message);
    if (membershipsError) throw new Error(membershipsError.message);
    if (directReportsError) throw new Error(directReportsError.message);

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const membershipRows = (memberships ?? []) as MembershipRow[];
    const directReportRows = (directReports ?? []) as ReportRow[];
    const membershipOrganisationIds = Array.from(new Set(membershipRows.map((membership) => membership.organisation_id)));
    const lookupIds = Array.from(
      new Set(
        [
          ...membershipRows.map((membership) => membership.leader_user_id).filter(Boolean),
          ...directReportRows.map((row) => row.user_id),
        ] as string[],
      ),
    );

    const profileLookup = new Map<string, ProfileRow>();
    const departmentsByOrganisationId = new Map<string, DepartmentRow[]>();
    const sitesByOrganisationId = new Map<string, SiteRow[]>();

    if (lookupIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,email,full_name,created_at")
        .in("id", lookupIds);

      if (profilesError) throw new Error(profilesError.message);

      for (const lookupProfile of (profiles ?? []) as ProfileRow[]) {
        profileLookup.set(lookupProfile.id, lookupProfile);
      }
    }

    if (membershipOrganisationIds.length) {
      const [{ data: departments, error: departmentsError }, { data: sites, error: sitesError }] = await Promise.all([
        supabase
          .from("organisation_departments")
          .select("id,organisation_id,name")
          .in("organisation_id", membershipOrganisationIds)
          .order("name", { ascending: true }),
        supabase
          .from("organisation_sites")
          .select("id,organisation_id,name")
          .in("organisation_id", membershipOrganisationIds)
          .order("name", { ascending: true }),
      ]);

      if (departmentsError) throw new Error(departmentsError.message);
      if (sitesError) throw new Error(sitesError.message);

      for (const department of (departments ?? []) as DepartmentRow[]) {
        const existing = departmentsByOrganisationId.get(department.organisation_id) ?? [];
        existing.push(department);
        departmentsByOrganisationId.set(department.organisation_id, existing);
      }

      for (const site of (sites ?? []) as SiteRow[]) {
        const existing = sitesByOrganisationId.get(site.organisation_id) ?? [];
        existing.push(site);
        sitesByOrganisationId.set(site.organisation_id, existing);
      }
    }

    return NextResponse.json({
      user: {
        ...(profile as ProfileRow),
        fullName: profile.full_name ?? "",
        email: profile.email ?? "",
        createdAt: profile.created_at,
      },
      memberships: membershipRows.map((membership) => ({
        organisationId: membership.organisation_id,
        organisationName: membership.organisation?.[0]?.name ?? "",
        organisationSlug: membership.organisation?.[0]?.slug ?? "",
        role: membership.role,
        inviteStatus: membership.invite_status,
        joinedAt: membership.joined_at,
        departmentId: membership.department?.[0]?.id ?? "",
        siteId: membership.site?.[0]?.id ?? "",
        leaderUserId: membership.leader_user_id ?? "",
        departmentName: membership.department?.[0]?.name ?? "",
        siteName: membership.site?.[0]?.name ?? "",
        leaderName: membership.leader_user_id ? profileLookup.get(membership.leader_user_id)?.full_name ?? "" : "",
        leaderEmail: membership.leader_user_id ? profileLookup.get(membership.leader_user_id)?.email ?? "" : "",
        departments: (departmentsByOrganisationId.get(membership.organisation_id) ?? []).map((department) => ({
          id: department.id,
          name: department.name,
        })),
        sites: (sitesByOrganisationId.get(membership.organisation_id) ?? []).map((site) => ({
          id: site.id,
          name: site.name,
        })),
      })),
      directReports: directReportRows.map((row) => ({
        organisationId: row.organisation_id,
        organisationName: row.organisation?.[0]?.name ?? "",
        userId: row.user_id,
        fullName: profileLookup.get(row.user_id)?.full_name ?? "",
        email: profileLookup.get(row.user_id)?.email ?? "",
      })),
    });
  } catch (error) {
    console.error("Admin user detail failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load user." },
      { status: 500 }
    );
  }
}
