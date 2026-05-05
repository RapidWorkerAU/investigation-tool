import { NextResponse } from "next/server";
import { createAuthedServerClient, createServiceRoleClient } from "@/lib/supabase/server";

type OrgAccessCandidateRow = {
  userId: string;
  fullName: string;
  email: string;
  organisations: string[];
  currentRole: "read" | "partial_write" | "full_write" | null;
};

type OrganisationRow = {
  id: string;
  name: string | null;
  status: string | null;
};

type OrganisationMembershipRow = {
  organisation_id: string;
  invite_status: string | null;
};

async function requireSignedInUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) {
    return { error: NextResponse.json({ error: "Missing authorization token." }, { status: 401 }) };
  }

  const authedSupabase = createAuthedServerClient(token);
  const {
    data: { user },
    error: userError,
  } = await authedSupabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: "You are no longer signed in." }, { status: 401 }) };
  }

  return { token, userId: user.id };
}

async function requireMapOwner(request: Request, mapId: string) {
  const signedInCheck = await requireSignedInUser(request);
  if ("error" in signedInCheck) return signedInCheck;

  const token = signedInCheck.token as string;
  const userId = signedInCheck.userId as string;
  const authedSupabase = createAuthedServerClient(token);

  const { data: map, error: mapError } = await authedSupabase
    .schema("ms")
    .from("system_maps")
    .select("id,owner_id")
    .eq("id", mapId)
    .maybeSingle();

  if (mapError || !map) {
    return { error: NextResponse.json({ error: "Map not found." }, { status: 404 }) };
  }

  if (map.owner_id !== userId) {
    return { error: NextResponse.json({ error: "Only the map owner can manage organisation write access." }, { status: 403 }) };
  }

  return { userId };
}

async function loadOrganisationMembershipStatus(userId: string) {
  const supabase = createServiceRoleClient();

  const { data: memberships, error: membershipsError } = await supabase
    .from("organisation_memberships")
    .select("organisation_id,invite_status")
    .eq("user_id", userId)
    .in("invite_status", ["active", "invited"]);

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const organisationIds = Array.from(new Set(((memberships ?? []) as OrganisationMembershipRow[]).map((row) => row.organisation_id)));
  if (!organisationIds.length) {
    return { hasActiveOrganisation: false, hasOrganisationMembership: false };
  }

  const { data: organisations, error: organisationsError } = await supabase
    .from("organisations")
    .select("id,status")
    .in("id", organisationIds);

  if (organisationsError) {
    throw new Error(organisationsError.message);
  }

  const activeOrganisationIds = new Set(
    ((organisations ?? []) as Array<{ id: string; status: string | null }>)
      .filter((row) => row.status === "active")
      .map((row) => row.id)
  );
  const membershipRows = (memberships ?? []) as OrganisationMembershipRow[];

  return {
    hasActiveOrganisation: membershipRows.some(
      (row) => row.invite_status === "active" && activeOrganisationIds.has(row.organisation_id)
    ),
    hasOrganisationMembership: activeOrganisationIds.size > 0,
  };
}

export async function GET(request: Request, context: { params: Promise<{ mapId: string }> }) {
  try {
    const { mapId } = await context.params;
    const requestUrl = new URL(request.url);
    const searchTerm = (requestUrl.searchParams.get("q") ?? "").trim();

    if (!searchTerm) {
      const signedInCheck = await requireSignedInUser(request);
      if ("error" in signedInCheck) return signedInCheck.error;
      const membershipStatus = await loadOrganisationMembershipStatus(signedInCheck.userId as string);
      return NextResponse.json({ ...membershipStatus, users: [] satisfies OrgAccessCandidateRow[] });
    }

    const ownerCheck = await requireMapOwner(request, mapId);
    if ("error" in ownerCheck) return ownerCheck.error;

    const ownerUserId = ownerCheck.userId as string;
    const supabase = createServiceRoleClient();

    const { data: ownerMemberships, error: ownerMembershipsError } = await supabase
      .from("organisation_memberships")
      .select("organisation_id,invite_status")
      .eq("user_id", ownerUserId)
      .in("invite_status", ["active", "invited"]);

    if (ownerMembershipsError) {
      throw new Error(ownerMembershipsError.message);
    }

    const ownerOrganisationIds = Array.from(new Set(((ownerMemberships ?? []) as OrganisationMembershipRow[]).map((row) => row.organisation_id)));

    if (!ownerOrganisationIds.length) {
      return NextResponse.json({ hasActiveOrganisation: false, users: [] satisfies OrgAccessCandidateRow[] });
    }

    const { data: organisations, error: organisationsError } = await supabase
      .from("organisations")
      .select("id,name,status")
      .in("id", ownerOrganisationIds);

    if (organisationsError) {
      throw new Error(organisationsError.message);
    }

    const activeOrganisations = ((organisations ?? []) as OrganisationRow[]).filter((row) => row.status === "active");
    const activeOrganisationIdSetForOwner = new Set(activeOrganisations.map((row) => row.id));
    const activeOrganisationIds = ((ownerMemberships ?? []) as OrganisationMembershipRow[])
      .filter((row) => row.invite_status === "active" && activeOrganisationIdSetForOwner.has(row.organisation_id))
      .map((row) => row.organisation_id);
    const hasActiveOrganisation = activeOrganisationIds.length > 0;
    const hasOrganisationMembership = activeOrganisations.length > 0;

    if (!hasActiveOrganisation || searchTerm.length < 2) {
      return NextResponse.json({ hasActiveOrganisation, hasOrganisationMembership, users: [] satisfies OrgAccessCandidateRow[] });
    }

    const [{ data: memberships, error: membershipsError }, { data: mapMembers, error: mapMembersError }] = await Promise.all([
      supabase
        .from("organisation_memberships")
        .select("organisation_id,user_id,invite_status")
        .in("organisation_id", activeOrganisationIds)
        .eq("invite_status", "active"),
      supabase.schema("ms").from("map_members").select("user_id,role").eq("map_id", mapId),
    ]);

    if (membershipsError) throw new Error(membershipsError.message);
    if (mapMembersError) throw new Error(mapMembersError.message);

    const activeOrganisationIdSet = new Set(activeOrganisationIds);
    const organisationNameById = new Map(activeOrganisations.map((organisation) => [organisation.id, organisation.name?.trim() || ""]));
    const peerUserIds = Array.from(
      new Set(
        (memberships ?? [])
          .filter((row) => row.user_id !== ownerUserId && activeOrganisationIdSet.has(row.organisation_id))
          .map((row) => row.user_id)
      )
    );

    if (!peerUserIds.length) {
      return NextResponse.json({ hasActiveOrganisation, hasOrganisationMembership, users: [] satisfies OrgAccessCandidateRow[] });
    }

    const escapedSearchTerm = searchTerm.replace(/[^\w\s@.+-]/g, " ").replace(/\s+/g, " ").trim();
    if (escapedSearchTerm.length < 2) {
      return NextResponse.json({ hasActiveOrganisation, hasOrganisationMembership, users: [] satisfies OrgAccessCandidateRow[] });
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", peerUserIds)
      .or(`full_name.ilike.%${escapedSearchTerm}%,email.ilike.%${escapedSearchTerm}%`)
      .limit(25);

    if (profilesError) throw new Error(profilesError.message);

    const organisationsByUserId = new Map<string, Set<string>>();
    for (const row of memberships ?? []) {
      if (row.user_id === ownerUserId || !activeOrganisationIdSet.has(row.organisation_id)) continue;
      const existing = organisationsByUserId.get(row.user_id) ?? new Set<string>();
      const orgName = organisationNameById.get(row.organisation_id) ?? "";
      if (orgName) existing.add(orgName);
      organisationsByUserId.set(row.user_id, existing);
    }

    const roleByUserId = new Map<string, "read" | "partial_write" | "full_write">();
    for (const row of mapMembers ?? []) {
      if (row.user_id === ownerUserId) continue;
      roleByUserId.set(row.user_id, row.role as "read" | "partial_write" | "full_write");
    }

    const users: OrgAccessCandidateRow[] = ((profiles ?? []) as Array<{ id: string; email: string | null; full_name: string | null }>)
      .map((profile) => ({
        userId: profile.id,
        fullName: profile.full_name?.trim() || "",
        email: profile.email?.trim() || "",
        organisations: Array.from(organisationsByUserId.get(profile.id) ?? []).sort((left, right) => left.localeCompare(right)),
        currentRole: roleByUserId.get(profile.id) ?? null,
      }))
      .sort((left, right) =>
        (left.fullName || left.email || left.userId).localeCompare(right.fullName || right.email || right.userId)
      );

    return NextResponse.json({ hasActiveOrganisation, hasOrganisationMembership, users });
  } catch (error) {
    console.error("Load map org access candidates failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load organisation users." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ mapId: string }> }) {
  try {
    const { mapId } = await context.params;
    const ownerCheck = await requireMapOwner(request, mapId);
    if ("error" in ownerCheck) return ownerCheck.error;

    const ownerUserId = ownerCheck.userId as string;
    const body = (await request.json().catch(() => null)) as { userId?: string } | null;
    const targetUserId = typeof body?.userId === "string" ? body.userId.trim() : "";

    if (!targetUserId) {
      return NextResponse.json({ error: "A user is required." }, { status: 400 });
    }

    if (targetUserId === ownerUserId) {
      return NextResponse.json({ error: "The map owner already has full write access." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: ownerMemberships, error: ownerMembershipsError } = await supabase
      .from("organisation_memberships")
      .select("organisation_id")
      .eq("user_id", ownerUserId)
      .eq("invite_status", "active");

    if (ownerMembershipsError) throw new Error(ownerMembershipsError.message);

    const ownerOrganisationIds = Array.from(new Set((ownerMemberships ?? []).map((row) => row.organisation_id)));

    if (!ownerOrganisationIds.length) {
      return NextResponse.json({ error: "This map owner is not an active member of any organisation." }, { status: 400 });
    }

    const { data: organisations, error: organisationsError } = await supabase
      .from("organisations")
      .select("id,status")
      .in("id", ownerOrganisationIds);

    if (organisationsError) throw new Error(organisationsError.message);

    const activeOrganisationIds = ((organisations ?? []) as Array<{ id: string; status: string | null }>)
      .filter((row) => row.status === "active")
      .map((row) => row.id);

    if (!activeOrganisationIds.length) {
      return NextResponse.json({ error: "This map owner is not an active member of any organisation." }, { status: 400 });
    }

    const { data: targetMembership, error: targetMembershipError } = await supabase
      .from("organisation_memberships")
      .select("organisation_id")
      .in("organisation_id", activeOrganisationIds)
      .eq("user_id", targetUserId)
      .eq("invite_status", "active")
      .limit(1)
      .maybeSingle();

    if (targetMembershipError) throw new Error(targetMembershipError.message);

    if (!targetMembership) {
      return NextResponse.json({ error: "That user is not an active member of one of your organisations." }, { status: 400 });
    }

    const { error: upsertError } = await supabase
      .schema("ms")
      .from("map_members")
      .upsert(
        {
          map_id: mapId,
          user_id: targetUserId,
          role: "full_write",
        },
        { onConflict: "map_id,user_id" }
      );

    if (upsertError) throw new Error(upsertError.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Grant map org write access failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to grant full write access." },
      { status: 500 }
    );
  }
}
