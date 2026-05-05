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
  user_id: string;
  organisation: Array<{
    name: string;
  }> | null;
};

export async function GET(request: Request) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const supabase = createServiceRoleClient();

    const [{ data: profiles, error: profilesError }, { data: memberships, error: membershipsError }] =
      await Promise.all([
        supabase.from("profiles").select("id,email,full_name,created_at").order("created_at", { ascending: false }),
        supabase
          .from("organisation_memberships")
          .select("user_id, organisation:organisations(name)")
          .order("created_at", { ascending: true }),
      ]);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    if (membershipsError) {
      throw new Error(membershipsError.message);
    }

    const organisationsByUser = new Map<string, string[]>();

    for (const row of (memberships ?? []) as MembershipRow[]) {
      const organisationName = row.organisation?.[0]?.name;
      if (!organisationName) continue;
      const current = organisationsByUser.get(row.user_id) ?? [];
      current.push(organisationName);
      organisationsByUser.set(row.user_id, current);
    }

    const users = ((profiles ?? []) as ProfileRow[]).map((profile) => ({
      id: profile.id,
      email: profile.email ?? "",
      fullName: profile.full_name ?? "",
      createdAt: profile.created_at,
      organisations: organisationsByUser.get(profile.id) ?? [],
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users list failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load users." },
      { status: 500 }
    );
  }
}
