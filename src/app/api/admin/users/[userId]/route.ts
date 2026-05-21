import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { insertUserProfileActivity } from "@/lib/userProfileActivity";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
};

type AdminUpdateUserBody = {
  fullName?: string;
  email?: string;
  disabled?: boolean;
};

type BillingProfileRow = {
  user_id: string;
  stripe_customer_id: string | null;
  access_selection_required: boolean;
  current_access_type: string | null;
  current_access_status: string;
  current_access_period_id: string | null;
  current_stripe_subscription_id: string | null;
  current_stripe_price_id: string | null;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
  read_only_reason: string | null;
  can_create_maps: boolean;
  can_edit_maps: boolean;
  can_export: boolean;
  can_share_maps: boolean;
  can_duplicate_maps: boolean;
};

type AccessPeriodRow = {
  id: string;
  access_type: string;
  access_status: string;
  access_source: string;
  starts_at: string;
  ends_at: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_payment_status: string | null;
  created_at: string;
};

type ActivityLogRow = {
  id: string;
  action: string;
  status: string;
  summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type MembershipRow = {
  organisation_id: string;
  department_id: string | null;
  site_id: string | null;
  role: string;
  invite_status: string;
  joined_at: string | null;
  leader_user_id: string | null;
  organisation: { id: string; name: string; slug: string | null } | Array<{ id: string; name: string; slug: string | null }> | null;
  department: { id: string; name: string } | Array<{ id: string; name: string }> | null;
  site: { id: string; name: string } | Array<{ id: string; name: string }> | null;
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
  organisation: { id: string; name: string } | Array<{ id: string; name: string }> | null;
};

function firstRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { userId } = await context.params;
    const supabase = createServiceRoleClient();

    const [
      authUserResult,
      { data: profile, error: profileError },
      { data: memberships, error: membershipsError },
      { data: directReports, error: directReportsError },
      refreshedAccessResult,
      { data: accessPeriods, error: accessPeriodsError },
      { data: activityLogs, error: activityLogsError },
    ] = await Promise.all([
      supabase.auth.admin.getUserById(userId),
      supabase.from("profiles").select("id,email,full_name,created_at").eq("id", userId).maybeSingle(),
      supabase
        .from("organisation_memberships")
        .select(
          "organisation_id,department_id,site_id,role,invite_status,joined_at,leader_user_id,organisation:organisations(id,name,slug),department:organisation_departments(id,name),site:organisation_sites(id,name)"
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
      supabase.rpc("refresh_billing_profile_state", { p_user_id: userId }),
      supabase
        .from("access_periods")
        .select("id,access_type,access_status,access_source,starts_at,ends_at,stripe_subscription_id,stripe_price_id,stripe_payment_status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("user_profile_activity_logs")
        .select("id,action,status,summary,metadata,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (authUserResult.error) throw new Error(authUserResult.error.message);
    if (profileError) throw new Error(profileError.message);
    if (membershipsError) throw new Error(membershipsError.message);
    if (directReportsError) throw new Error(directReportsError.message);
    if (refreshedAccessResult.error) throw new Error(refreshedAccessResult.error.message);
    if (accessPeriodsError) throw new Error(accessPeriodsError.message);
    if (activityLogsError && activityLogsError.code !== "42P01") throw new Error(activityLogsError.message);

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const membershipRows = (memberships ?? []) as MembershipRow[];
    const directReportRows = (directReports ?? []) as ReportRow[];
    const refreshedAccess = Array.isArray(refreshedAccessResult.data)
      ? refreshedAccessResult.data[0]
      : refreshedAccessResult.data;
    const billingProfile = refreshedAccess as BillingProfileRow | null;
    const authUser = authUserResult.data.user;
    const disabledUntil = authUser?.banned_until ?? null;
    const disabled =
      typeof disabledUntil === "string" &&
      disabledUntil.length > 0 &&
      new Date(disabledUntil).getTime() > Date.now();
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
        disabled,
        disabledUntil,
        emailConfirmedAt: authUser?.email_confirmed_at ?? null,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
      },
      access: billingProfile
        ? {
            stripeCustomerId: billingProfile.stripe_customer_id ?? null,
            accessSelectionRequired: Boolean(billingProfile.access_selection_required),
            currentAccessType: billingProfile.current_access_type ?? null,
            currentAccessStatus: billingProfile.current_access_status,
            currentAccessPeriodId: billingProfile.current_access_period_id ?? null,
            currentStripeSubscriptionId: billingProfile.current_stripe_subscription_id ?? null,
            currentStripePriceId: billingProfile.current_stripe_price_id ?? null,
            currentPeriodStartsAt: billingProfile.current_period_starts_at ?? null,
            currentPeriodEndsAt: billingProfile.current_period_ends_at ?? null,
            readOnlyReason: billingProfile.read_only_reason ?? null,
            canCreateMaps: Boolean(billingProfile.can_create_maps),
            canEditMaps: Boolean(billingProfile.can_edit_maps),
            canExport: Boolean(billingProfile.can_export),
            canShareMaps: Boolean(billingProfile.can_share_maps),
            canDuplicateMaps: Boolean(billingProfile.can_duplicate_maps),
          }
        : null,
      accessPeriods: ((accessPeriods ?? []) as AccessPeriodRow[]).map((period) => ({
        id: period.id,
        accessType: period.access_type,
        accessStatus: period.access_status,
        accessSource: period.access_source,
        startsAt: period.starts_at,
        endsAt: period.ends_at,
        stripeSubscriptionId: period.stripe_subscription_id,
        stripePriceId: period.stripe_price_id,
        stripePaymentStatus: period.stripe_payment_status,
        createdAt: period.created_at,
      })),
      activityLogs: ((activityLogs ?? []) as ActivityLogRow[]).map((log) => ({
        id: log.id,
        action: log.action,
        status: log.status,
        summary: log.summary,
        metadata: log.metadata ?? {},
        createdAt: log.created_at,
      })),
      memberships: membershipRows.map((membership) => {
        const organisation = firstRelation(membership.organisation);
        const department = firstRelation(membership.department);
        const site = firstRelation(membership.site);

        return {
          organisationId: membership.organisation_id,
          organisationName: organisation?.name ?? "",
          organisationSlug: organisation?.slug ?? "",
          role: membership.role,
          inviteStatus: membership.invite_status,
          joinedAt: membership.joined_at,
          departmentId: membership.department_id ?? department?.id ?? "",
          siteId: membership.site_id ?? site?.id ?? "",
          leaderUserId: membership.leader_user_id ?? "",
          departmentName: department?.name ?? "",
          siteName: site?.name ?? "",
          leaderName: membership.leader_user_id ? profileLookup.get(membership.leader_user_id)?.full_name ?? "" : "",
          leaderEmail: membership.leader_user_id ? profileLookup.get(membership.leader_user_id)?.email ?? "" : "",
          departments: (departmentsByOrganisationId.get(membership.organisation_id) ?? []).map((departmentOption) => ({
            id: departmentOption.id,
            name: departmentOption.name,
          })),
          sites: (sitesByOrganisationId.get(membership.organisation_id) ?? []).map((siteOption) => ({
            id: siteOption.id,
            name: siteOption.name,
          })),
        };
      }),
      directReports: directReportRows.map((row) => ({
        organisationId: row.organisation_id,
        organisationName: firstRelation(row.organisation)?.name ?? "",
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

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { user: adminUser, response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { userId } = await context.params;
    const body = (await request.json().catch(() => null)) as AdminUpdateUserBody | null;
    const fullName = normalizeOptionalText(body?.fullName);
    const email = normalizeOptionalText(body?.email).toLowerCase();
    const hasDisabledUpdate = typeof body?.disabled === "boolean";

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!email || !isLikelyEmail(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: existingProfile, error: profileLoadError } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .eq("id", userId)
      .maybeSingle();

    if (profileLoadError) throw new Error(profileLoadError.message);
    if (!existingProfile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const authUpdate: {
      email?: string;
      email_confirm?: boolean;
      user_metadata?: { full_name: string; name: string };
      ban_duration?: string;
    } = {
      user_metadata: {
        full_name: fullName,
        name: fullName,
      },
    };

    if ((existingProfile.email ?? "").toLowerCase() !== email) {
      authUpdate.email = email;
      authUpdate.email_confirm = true;
    }

    if (hasDisabledUpdate) {
      authUpdate.ban_duration = body?.disabled ? "876000h" : "none";
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, authUpdate);
    if (authUpdateError) throw new Error(authUpdateError.message);

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        email,
      })
      .eq("id", userId);

    if (profileUpdateError) throw new Error(profileUpdateError.message);

    await insertUserProfileActivity(supabase, {
      userId,
      actorUserId: adminUser?.userId ?? null,
      action: "admin_profile_update",
      status: "success",
      summary: hasDisabledUpdate
        ? `Admin updated profile and ${body?.disabled ? "disabled" : "enabled"} the account.`
        : "Admin updated profile information.",
      metadata: {
        emailChanged: (existingProfile.email ?? "").toLowerCase() !== email,
        disabledChanged: hasDisabledUpdate,
        disabled: body?.disabled ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin user update failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update user." },
      { status: 500 },
    );
  }
}
