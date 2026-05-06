import { createServiceRoleClient } from "@/lib/supabase/server";
import { emailTemplates, sendResendEmail } from "@/lib/email";

type AdminSupabaseClient = ReturnType<typeof createServiceRoleClient>;

export type OrganisationMembershipRole = "org_admin" | "general_user";
export type OrganisationMembershipStatus = "draft" | "invited" | "active" | "suspended";

type AssignmentValidationInput = {
  organisationId: string;
  departmentId?: string | null;
  siteId?: string | null;
  leaderUserId?: string | null;
};

type InviteOrganisationUserInput = AssignmentValidationInput & {
  supabase: AdminSupabaseClient;
  adminUserId: string;
  email: string;
  fullName?: string | null;
  role: OrganisationMembershipRole;
};

type LinkExistingUserInput = AssignmentValidationInput & {
  supabase: AdminSupabaseClient;
  userId: string;
  role: OrganisationMembershipRole;
};

type UpdateMembershipInput = AssignmentValidationInput & {
  supabase: AdminSupabaseClient;
  userId: string;
  role: OrganisationMembershipRole;
  inviteStatus: OrganisationMembershipStatus;
};

type ResendOrganisationInviteInput = {
  supabase: AdminSupabaseClient;
  adminUserId: string;
  organisationId: string;
  userId: string;
};

const allowedRoles = new Set<OrganisationMembershipRole>(["org_admin", "general_user"]);
const allowedStatuses = new Set<OrganisationMembershipStatus>(["draft", "invited", "active", "suspended"]);

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeOptionalText = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

export const isOrganisationMembershipRole = (value: string | null): value is OrganisationMembershipRole =>
  value !== null && allowedRoles.has(value as OrganisationMembershipRole);

export const isOrganisationMembershipStatus = (value: string | null): value is OrganisationMembershipStatus =>
  value !== null && allowedStatuses.has(value as OrganisationMembershipStatus);

const validateOrganisationAssignment = async (
  supabase: AdminSupabaseClient,
  { organisationId, departmentId, siteId, leaderUserId }: AssignmentValidationInput
) => {
  const [{ data: organisation, error: organisationError }, { data: department }, { data: site }, { data: leaderMembership }] =
    await Promise.all([
      supabase.from("organisations").select("id,name").eq("id", organisationId).maybeSingle(),
      departmentId
        ? supabase
            .from("organisation_departments")
            .select("id")
            .eq("id", departmentId)
            .eq("organisation_id", organisationId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      siteId
        ? supabase.from("organisation_sites").select("id").eq("id", siteId).eq("organisation_id", organisationId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      leaderUserId
        ? supabase
            .from("organisation_memberships")
            .select("user_id")
            .eq("organisation_id", organisationId)
            .eq("user_id", leaderUserId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (organisationError) {
    throw new Error(organisationError.message);
  }

  if (!organisation) {
    throw new Error("Organisation not found.");
  }

  if (departmentId && !department) {
    throw new Error("Department does not belong to this organisation.");
  }

  if (siteId && !site) {
    throw new Error("Site does not belong to this organisation.");
  }

  if (leaderUserId && !leaderMembership) {
    throw new Error("Leader must already belong to this organisation.");
  }

  return organisation;
};

export const inviteOrganisationUser = async ({
  supabase,
  adminUserId,
  organisationId,
  email,
  fullName,
  role,
  departmentId,
  siteId,
  leaderUserId,
}: InviteOrganisationUserInput) => {
  const organisation = await validateOrganisationAssignment(supabase, {
    organisationId,
    departmentId,
    siteId,
    leaderUserId,
  });

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new Error("Enter a valid email address.");
  }

  if (!allowedRoles.has(role)) {
    throw new Error("Invalid organisation role.");
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const redirectTo = `${siteUrl}/auth/set-password`;
  const inviteResult = await supabase.auth.admin.generateLink({
    type: "invite",
    email: normalizedEmail,
    options: {
      redirectTo,
      data: {
        full_name: fullName ?? "",
        name: fullName ?? "",
      },
    },
  });

  if (inviteResult.error || !inviteResult.data.user?.id) {
    throw new Error(inviteResult.error?.message || "Unable to issue invite.");
  }

  const invitedUserId = inviteResult.data.user.id;
  const inviteLink = inviteResult.data.properties?.action_link;
  if (!inviteLink) {
    throw new Error("Invite link could not be generated.");
  }
  const invitedAt = new Date().toISOString();

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: invitedUserId,
      email: normalizedEmail,
      full_name: fullName ?? null,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  await supabase
    .from("organisation_invites")
    .update({
      status: "revoked",
      revoked_at: invitedAt,
    })
    .eq("organisation_id", organisationId)
    .eq("email", normalizedEmail)
    .eq("status", "pending");

  const { error: inviteError } = await supabase.from("organisation_invites").insert({
    organisation_id: organisationId,
    email: normalizedEmail,
    full_name: fullName ?? null,
    role,
    department_id: departmentId ?? null,
    site_id: siteId ?? null,
    leader_user_id: leaderUserId ?? null,
    invited_by_user_id: adminUserId,
    auth_user_id: invitedUserId,
    invited_at: invitedAt,
  });

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  const { error: membershipError } = await supabase.from("organisation_memberships").upsert(
    {
      organisation_id: organisationId,
      user_id: invitedUserId,
      role,
      department_id: departmentId ?? null,
      site_id: siteId ?? null,
      leader_user_id: leaderUserId ?? null,
      invite_status: "invited",
      invited_at: invitedAt,
    },
    { onConflict: "organisation_id,user_id" }
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const emailTemplate = emailTemplates.organisationInvite({
    firstName: fullName,
    organisationName: organisation.name,
    actionUrl: inviteLink,
  });

  await sendResendEmail({
    to: normalizedEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    tags: [
      { name: "category", value: "organisation" },
      { name: "template", value: "organisation-invite" },
    ],
  });

  return {
    organisationName: organisation.name,
    invitedUserId,
    invitedAt,
  };
};

const generatePasswordSetupLink = async (
  supabase: AdminSupabaseClient,
  email: string,
  fullName: string | null
) => {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const redirectTo = `${siteUrl}/auth/set-password`;
  const inviteResult = await supabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo,
      data: {
        full_name: fullName ?? "",
        name: fullName ?? "",
      },
    },
  });

  if (!inviteResult.error && inviteResult.data.properties?.action_link) {
    return {
      userId: inviteResult.data.user?.id ?? null,
      actionLink: inviteResult.data.properties.action_link,
    };
  }

  const recoveryResult = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo,
    },
  });

  if (recoveryResult.error || !recoveryResult.data.properties?.action_link) {
    throw new Error(
      recoveryResult.error?.message ||
        inviteResult.error?.message ||
        "Unable to generate a new invite link."
    );
  }

  return {
    userId: recoveryResult.data.user?.id ?? null,
    actionLink: recoveryResult.data.properties.action_link,
  };
};

export const resendOrganisationInvite = async ({
  supabase,
  adminUserId,
  organisationId,
  userId,
}: ResendOrganisationInviteInput) => {
  const [{ data: membership, error: membershipError }, { data: organisation, error: organisationError }, { data: profile, error: profileError }] =
    await Promise.all([
      supabase
        .from("organisation_memberships")
        .select("role,invite_status,department_id,site_id,leader_user_id")
        .eq("organisation_id", organisationId)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("organisations").select("id,name").eq("id", organisationId).maybeSingle(),
      supabase.from("profiles").select("id,email,full_name").eq("id", userId).maybeSingle(),
    ]);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (organisationError) {
    throw new Error(organisationError.message);
  }

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!membership) {
    throw new Error("Membership not found.");
  }

  if (!organisation) {
    throw new Error("Organisation not found.");
  }

  if (!profile?.email) {
    throw new Error("User email not found.");
  }

  if (membership.invite_status !== "invited" && membership.invite_status !== "draft") {
    throw new Error("Only draft or invited memberships can be resent.");
  }

  const normalizedEmail = profile.email.trim().toLowerCase();
  const fullName = profile.full_name ?? null;
  const { actionLink } = await generatePasswordSetupLink(supabase, normalizedEmail, fullName);
  const invitedAt = new Date().toISOString();

  await supabase
    .from("organisation_invites")
    .update({
      status: "revoked",
      revoked_at: invitedAt,
    })
    .eq("organisation_id", organisationId)
    .eq("email", normalizedEmail)
    .eq("status", "pending");

  const { error: inviteError } = await supabase.from("organisation_invites").insert({
    organisation_id: organisationId,
    email: normalizedEmail,
    full_name: fullName,
    role: membership.role,
    department_id: membership.department_id ?? null,
    site_id: membership.site_id ?? null,
    leader_user_id: membership.leader_user_id ?? null,
    invited_by_user_id: adminUserId,
    auth_user_id: userId,
    invited_at: invitedAt,
  });

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  const { error: membershipUpdateError } = await supabase
    .from("organisation_memberships")
    .update({
      invite_status: "invited",
      invited_at: invitedAt,
      joined_at: null,
      suspended_at: null,
    })
    .eq("organisation_id", organisationId)
    .eq("user_id", userId);

  if (membershipUpdateError) {
    throw new Error(membershipUpdateError.message);
  }

  const emailTemplate = emailTemplates.organisationInvite({
    firstName: fullName,
    organisationName: organisation.name,
    actionUrl: actionLink,
  });

  await sendResendEmail({
    to: normalizedEmail,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    tags: [
      { name: "category", value: "organisation" },
      { name: "template", value: "organisation-invite-resend" },
    ],
  });

  return {
    email: normalizedEmail,
    organisationName: organisation.name,
    invitedAt,
  };
};

export const linkExistingUserToOrganisation = async ({
  supabase,
  organisationId,
  userId,
  role,
  departmentId,
  siteId,
  leaderUserId,
}: LinkExistingUserInput) => {
  await validateOrganisationAssignment(supabase, {
    organisationId,
    departmentId,
    siteId,
    leaderUserId,
  });

  if (!allowedRoles.has(role)) {
    throw new Error("Invalid organisation role.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    throw new Error("User not found.");
  }

  const joinedAt = new Date().toISOString();
  const { error: membershipError } = await supabase.from("organisation_memberships").upsert(
    {
      organisation_id: organisationId,
      user_id: userId,
      role,
      department_id: departmentId ?? null,
      site_id: siteId ?? null,
      leader_user_id: leaderUserId ?? null,
      invite_status: "active",
      joined_at: joinedAt,
      invited_at: joinedAt,
      suspended_at: null,
    },
    { onConflict: "organisation_id,user_id" }
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  return { joinedAt };
};

export const updateOrganisationMembership = async ({
  supabase,
  organisationId,
  userId,
  role,
  inviteStatus,
  departmentId,
  siteId,
  leaderUserId,
}: UpdateMembershipInput) => {
  await validateOrganisationAssignment(supabase, {
    organisationId,
    departmentId,
    siteId,
    leaderUserId,
  });

  if (!allowedRoles.has(role)) {
    throw new Error("Invalid organisation role.");
  }

  if (!allowedStatuses.has(inviteStatus)) {
    throw new Error("Invalid membership status.");
  }

  const { data: existingMembership, error: membershipLookupError } = await supabase
    .from("organisation_memberships")
    .select("organisation_id,user_id,joined_at,invited_at")
    .eq("organisation_id", organisationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipLookupError) {
    throw new Error(membershipLookupError.message);
  }

  if (!existingMembership) {
    throw new Error("Membership not found.");
  }

  const now = new Date().toISOString();
  const { error: membershipError } = await supabase
    .from("organisation_memberships")
    .update({
      role,
      invite_status: inviteStatus,
      department_id: departmentId ?? null,
      site_id: siteId ?? null,
      leader_user_id: leaderUserId ?? null,
      invited_at: existingMembership.invited_at ?? now,
      joined_at:
        inviteStatus === "active"
          ? existingMembership.joined_at ?? now
          : inviteStatus === "invited" || inviteStatus === "draft"
            ? null
            : existingMembership.joined_at,
      suspended_at: inviteStatus === "suspended" ? now : null,
    })
    .eq("organisation_id", organisationId)
    .eq("user_id", userId);

  if (membershipError) {
    throw new Error(membershipError.message);
  }
};
