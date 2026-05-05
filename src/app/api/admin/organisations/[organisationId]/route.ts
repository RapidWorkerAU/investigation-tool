import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type OrganisationRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  status: "active" | "inactive";
  billing_plan_name: string | null;
  billing_notes: string | null;
  logo_storage_path: string | null;
  section_heading_color: string | null;
  table_heading_color: string | null;
  created_at: string;
};

type DepartmentRow = {
  id: string;
  name: string;
  description: string | null;
};

type SiteRow = {
  id: string;
  name: string;
  description: string | null;
};

type MemberRow = {
  role: string;
  invite_status: string;
  joined_at: string | null;
  user_id: string;
  leader_user_id: string | null;
  department: Array<{ id: string; name: string }> | null;
  site: Array<{ id: string; name: string }> | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type InviteRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  invited_at: string;
};

export async function GET(request: Request, context: { params: Promise<{ organisationId: string }> }) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { organisationId } = await context.params;
    const supabase = createServiceRoleClient();

    const [
      { data: organisation, error: organisationError },
      { data: departments, error: departmentsError },
      { data: sites, error: sitesError },
      { data: members, error: membersError },
      { data: invites, error: invitesError },
    ] = await Promise.all([
      supabase
        .from("organisations")
        .select("id,name,slug,description,status,billing_plan_name,billing_notes,logo_storage_path,section_heading_color,table_heading_color,created_at")
        .eq("id", organisationId)
        .maybeSingle(),
      supabase
        .from("organisation_departments")
        .select("id,name,description")
        .eq("organisation_id", organisationId)
        .order("name", { ascending: true }),
      supabase
        .from("organisation_sites")
        .select("id,name,description")
        .eq("organisation_id", organisationId)
        .order("name", { ascending: true }),
      supabase
        .from("organisation_memberships")
        .select(
          "role,invite_status,joined_at,user_id,leader_user_id,department:organisation_departments(id,name),site:organisation_sites(id,name)"
        )
        .eq("organisation_id", organisationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("organisation_invites")
        .select("id,email,full_name,role,status,invited_at")
        .eq("organisation_id", organisationId)
        .order("invited_at", { ascending: false }),
    ]);

    if (organisationError) throw new Error(organisationError.message);
    if (departmentsError) throw new Error(departmentsError.message);
    if (sitesError) throw new Error(sitesError.message);
    if (membersError) throw new Error(membersError.message);
    if (invitesError) throw new Error(invitesError.message);

    if (!organisation) {
      return NextResponse.json({ error: "Organisation not found." }, { status: 404 });
    }

    const memberRows = (members ?? []) as MemberRow[];
    const profileIds = Array.from(
      new Set(
        memberRows.flatMap((member) => [member.user_id, member.leader_user_id].filter(Boolean) as string[]),
      ),
    );

    const profileLookup = new Map<string, ProfileRow>();

    if (profileIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,email,full_name")
        .in("id", profileIds);

      if (profilesError) throw new Error(profilesError.message);

      for (const profile of (profiles ?? []) as ProfileRow[]) {
        profileLookup.set(profile.id, profile);
      }
    }

    const payload = {
      organisation: {
        ...(organisation as OrganisationRow),
        billingPlanName: organisation.billing_plan_name ?? "",
        billingNotes: organisation.billing_notes ?? "",
        logoStoragePath: organisation.logo_storage_path ?? "",
        sectionHeadingColor: organisation.section_heading_color ?? "",
        tableHeadingColor: organisation.table_heading_color ?? "",
      },
      departments: ((departments ?? []) as DepartmentRow[]).map((department) => ({
        id: department.id,
        name: department.name,
        description: department.description ?? "",
      })),
      sites: ((sites ?? []) as SiteRow[]).map((site) => ({
        id: site.id,
        name: site.name,
        description: site.description ?? "",
      })),
      members: memberRows.map((member) => ({
        userId: member.user_id,
        role: member.role,
        inviteStatus: member.invite_status,
        joinedAt: member.joined_at,
        departmentId: member.department?.[0]?.id ?? "",
        siteId: member.site?.[0]?.id ?? "",
        leaderUserId: member.leader_user_id ?? "",
        fullName: profileLookup.get(member.user_id)?.full_name ?? "",
        email: profileLookup.get(member.user_id)?.email ?? "",
        departmentName: member.department?.[0]?.name ?? "",
        siteName: member.site?.[0]?.name ?? "",
        leaderName: member.leader_user_id ? profileLookup.get(member.leader_user_id)?.full_name ?? "" : "",
        leaderEmail: member.leader_user_id ? profileLookup.get(member.leader_user_id)?.email ?? "" : "",
      })),
      invites: ((invites ?? []) as InviteRow[]).map((invite) => ({
        id: invite.id,
        email: invite.email,
        fullName: invite.full_name ?? "",
        role: invite.role,
        status: invite.status,
        invitedAt: invite.invited_at,
      })),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Admin organisation detail failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load organisation." },
      { status: 500 }
    );
  }
}
