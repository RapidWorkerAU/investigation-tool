"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import DashboardTableFooter from "@/components/dashboard/DashboardTableFooter";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import { isPlatformAdminEmail } from "@/lib/platformAdmin";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type UserDetail = {
  user: {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
    disabled: boolean;
    disabledUntil: string | null;
    emailConfirmedAt: string | null;
    lastSignInAt: string | null;
  };
  access: {
    stripeCustomerId: string | null;
    accessSelectionRequired: boolean;
    currentAccessType: string | null;
    currentAccessStatus: string;
    currentAccessPeriodId: string | null;
    currentStripeSubscriptionId: string | null;
    currentStripePriceId: string | null;
    currentPeriodStartsAt: string | null;
    currentPeriodEndsAt: string | null;
    readOnlyReason: string | null;
    canCreateMaps: boolean;
    canEditMaps: boolean;
    canExport: boolean;
    canShareMaps: boolean;
    canDuplicateMaps: boolean;
  } | null;
  accessPeriods: Array<{
    id: string;
    accessType: string;
    accessStatus: string;
    accessSource: string;
    startsAt: string;
    endsAt: string;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    stripePaymentStatus: string | null;
    createdAt: string;
  }>;
  activityLogs: Array<{
    id: string;
    action: string;
    status: string;
    summary: string;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>;
  memberships: Array<{
    organisationId: string;
    organisationName: string;
    organisationSlug: string;
    role: string;
    inviteStatus: string;
    joinedAt: string | null;
    departmentId: string;
    siteId: string;
    leaderUserId: string;
    departmentName: string;
    siteName: string;
    leaderName: string;
    leaderEmail: string;
    departments: Array<{ id: string; name: string }>;
    sites: Array<{ id: string; name: string }>;
  }>;
  directReports: Array<{
    organisationId: string;
    organisationName: string;
    userId: string;
    fullName: string;
    email: string;
  }>;
};

type EditableMembership = UserDetail["memberships"][number];
type OrganisationEditOptions = {
  departments: Array<{ id: string; name: string }>;
  sites: Array<{ id: string; name: string }>;
  members: Array<{ userId: string; fullName: string; email: string }>;
};

type OrganisationListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

type AdminUserSectionId = "identity" | "memberships" | "direct-reports" | "profile-log";

const adminUserSections: Array<{ id: AdminUserSectionId; label: string; description: string; icon: string }> = [
  { id: "identity", label: "Profile & Access", description: "Emergency profile controls, account security, and current subscription access.", icon: "/icons/account.svg" },
  {
    id: "memberships",
    label: "Organisations",
    description: "Organisation role, status, reporting line, and assignment metadata for this user.",
    icon: "/icons/organisation.svg",
  },
  {
    id: "direct-reports",
    label: "Direct Reports",
    description: "Other users who currently report to this person inside an organisation.",
    icon: "/icons/users.svg",
  },
  {
    id: "profile-log",
    label: "User Profile Log",
    description: "Map, report, PDF, and email activity captured outside the canvas.",
    icon: "/icons/data.svg",
  },
];

const formatDateTime = (value: string | null) =>
  value === "infinity"
    ? "Ongoing"
    : value
    ? new Intl.DateTimeFormat("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Australia/Perth",
      }).format(new Date(value))
    : "-";

const formatAdminRole = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatAccessLabel = (value: string | null) => {
  if (!value) return "No access selected";
  switch (value) {
    case "trial_7d":
      return "Free Account";
    case "pass_30d":
      return "30 Day Access";
    case "subscription_monthly":
      return "Ongoing Subscription";
    default:
      return formatAdminRole(value);
  }
};

const formatInviteStatus = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getUserInitials = (name: string, email: string) => {
  const source = name.trim() || email.trim();
  if (!source) return "IT";

  const parts = source.includes("@")
    ? source.split("@")[0].split(/[._-]+/)
    : source.split(/\s+/);

  return parts
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "IT";
};

const detailPageSize = 7;

function paginateRows<T>(rows: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / detailPageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    safePage,
    rows: rows.slice((safePage - 1) * detailPageSize, safePage * detailPageSize),
  };
}

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminUserSectionId>("identity");
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileDraftFullName, setProfileDraftFullName] = useState("");
  const [profileDraftEmail, setProfileDraftEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordResetSending, setPasswordResetSending] = useState(false);
  const [disableSaving, setDisableSaving] = useState(false);
  const [resendingInviteFor, setResendingInviteFor] = useState<string | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkOptionsLoading, setLinkOptionsLoading] = useState(false);
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSearch, setLinkSearch] = useState("");
  const [linkRole, setLinkRole] = useState<"org_admin" | "general_user">("general_user");
  const [organisationOptions, setOrganisationOptions] = useState<OrganisationListItem[]>([]);
  const [editMembership, setEditMembership] = useState<EditableMembership | null>(null);
  const [editRole, setEditRole] = useState<"org_admin" | "general_user">("general_user");
  const [editStatus, setEditStatus] = useState<"draft" | "invited" | "active" | "suspended">("active");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editSiteId, setEditSiteId] = useState("");
  const [editLeaderUserId, setEditLeaderUserId] = useState("");
  const [editOptions, setEditOptions] = useState<OrganisationEditOptions>({
    departments: [],
    sites: [],
    members: [],
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [membershipsPage, setMembershipsPage] = useState(1);
  const [directReportsPage, setDirectReportsPage] = useState(1);
  const [profileLogPage, setProfileLogPage] = useState(1);
  const [selectedMembershipIds, setSelectedMembershipIds] = useState<string[]>([]);
  const [selectedDirectReportIds, setSelectedDirectReportIds] = useState<string[]>([]);
  const [selectedProfileLogIds, setSelectedProfileLogIds] = useState<string[]>([]);
  const [bulkDeletingSection, setBulkDeletingSection] = useState<AdminUserSectionId | null>(null);

  const loadDetail = useCallback(async (accessToken: string) => {
    const response = await fetch(`/api/admin/users/${params.userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await response.json()) as UserDetail & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load user.");
    }

    setDetail(payload);
    setProfileDraftFullName(payload.user.fullName);
    setProfileDraftEmail(payload.user.email);
    setSelectedMembershipIds((current) => current.filter((id) => payload.memberships.some((membership) => membership.organisationId === id)));
    setSelectedDirectReportIds((current) =>
      current.filter((id) =>
        payload.directReports.some((report) => `${report.organisationId}:${report.userId}` === id)
      )
    );
    setSelectedProfileLogIds((current) => current.filter((id) => payload.activityLogs.some((log) => log.id === id)));
  }, [params.userId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          router.push(`/login?returnTo=%2Fadmin%2Fusers%2F${params.userId}`);
          return;
        }

        setCurrentUserEmail(user.email ?? null);
        const isAdmin = isPlatformAdminEmail(user.email);
        setAuthorized(isAdmin);

        if (!isAdmin) {
          setLoading(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          router.push(`/login?returnTo=%2Fadmin%2Fusers%2F${params.userId}`);
          return;
        }

        await loadDetail(session.access_token);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load user.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadDetail, params.userId, router, supabase]);

  useEffect(() => {
    if (!detail) return;
    setMembershipsPage((current) => Math.min(current, Math.max(1, Math.ceil(detail.memberships.length / detailPageSize))));
    setDirectReportsPage((current) => Math.min(current, Math.max(1, Math.ceil(detail.directReports.length / detailPageSize))));
    setProfileLogPage((current) => Math.min(current, Math.max(1, Math.ceil(detail.activityLogs.length / detailPageSize))));
  }, [detail]);

  const openLinkModal = async () => {
    setLinkModalOpen(true);
    setLinkOptionsLoading(true);
    setLinkError(null);
    setLinkSearch("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch("/api/admin/organisations/list", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json()) as { organisations?: OrganisationListItem[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load organisations.");
      }

      setOrganisationOptions(payload.organisations ?? []);
    } catch (loadError) {
      setLinkError(loadError instanceof Error ? loadError.message : "Unable to load organisations.");
    } finally {
      setLinkOptionsLoading(false);
    }
  };

  const handleLinkOrganisation = async (organisationId: string) => {
    setLinkSubmitting(true);
    setLinkError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(`/api/admin/users/${params.userId}/link-organisations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          organisationId,
          role: linkRole,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to link organisation.");
      }

      await loadDetail(session.access_token);
      setLinkModalOpen(false);
      setOrganisationOptions([]);
    } catch (submitError) {
      setLinkError(submitError instanceof Error ? submitError.message : "Unable to link organisation.");
    } finally {
      setLinkSubmitting(false);
    }
  };

  const eligibleOrganisations = useMemo(() => {
    const membershipIds = new Set(detail?.memberships.map((membership) => membership.organisationId) ?? []);
    const search = linkSearch.trim().toLowerCase();

    return organisationOptions.filter((organisation) => {
      if (membershipIds.has(organisation.id)) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [organisation.name, organisation.slug, organisation.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [detail?.memberships, linkSearch, organisationOptions]);

  const openEditMembershipModal = async (membership: EditableMembership) => {
    setEditMembership(membership);
    setEditRole((membership.role === "org_admin" ? "org_admin" : "general_user"));
    setEditStatus(
      membership.inviteStatus === "draft" ||
        membership.inviteStatus === "invited" ||
        membership.inviteStatus === "suspended"
        ? membership.inviteStatus
        : "active"
    );
    setEditDepartmentId(membership.departmentId || "");
    setEditSiteId(membership.siteId || "");
    setEditLeaderUserId(membership.leaderUserId || "");
    setEditOptions({ departments: membership.departments ?? [], sites: membership.sites ?? [], members: [] });
    setEditError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(`/api/admin/organisations/${membership.organisationId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json()) as
        | (OrganisationEditOptions & { error?: string })
        | {
            departments?: Array<{ id: string; name: string }>;
            sites?: Array<{ id: string; name: string }>;
            members?: Array<{ userId: string; fullName: string; email: string }>;
            error?: string;
          };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load organisation options.");
      }

      setEditOptions({
        departments: payload.departments?.length ? payload.departments : membership.departments ?? [],
        sites: payload.sites?.length ? payload.sites : membership.sites ?? [],
        members: payload.members ?? [],
      });
    } catch (loadError) {
      setEditError(loadError instanceof Error ? loadError.message : "Unable to load organisation options.");
    }
  };

  const handleEditMembership = async () => {
    if (!editMembership) return;

    setEditSubmitting(true);
    setEditError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(
        `/api/admin/organisations/${editMembership.organisationId}/members/${params.userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            role: editRole,
            inviteStatus: editStatus,
            departmentId: editDepartmentId || null,
            siteId: editSiteId || null,
            leaderUserId: editLeaderUserId || null,
          }),
        }
      );

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update membership.");
      }

      await loadDetail(session.access_token);
      setEditMembership(null);
    } catch (submitError) {
      setEditError(submitError instanceof Error ? submitError.message : "Unable to update membership.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleResendInvite = async (membership: EditableMembership) => {
    setResendingInviteFor(membership.organisationId);
    setError(null);
    setStatusMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(
        `/api/admin/organisations/${membership.organisationId}/members/${params.userId}/resend-invite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const payload = (await response.json()) as { email?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to resend invite.");
      }

      await loadDetail(session.access_token);
      setStatusMessage(`Invite resent to ${payload.email || detail?.user.email || "this user"}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to resend invite.");
    } finally {
      setResendingInviteFor(null);
    }
  };

  const saveAdminProfile = async (nextDisabled?: boolean) => {
    if (!detail) return;

    const fullName = profileDraftFullName.trim();
    const email = profileDraftEmail.trim().toLowerCase();

    if (!fullName) {
      setError("Full name is required.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("A valid email is required.");
      return;
    }

    setProfileSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(`/api/admin/users/${params.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName,
          email,
          ...(typeof nextDisabled === "boolean" ? { disabled: nextDisabled } : {}),
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update user.");
      }

      await loadDetail(session.access_token);
      setProfileEditing(false);
      setStatusMessage(typeof nextDisabled === "boolean" ? `Account ${nextDisabled ? "disabled" : "enabled"}.` : "Profile updated.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to update user.");
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleUserDisabled = async () => {
    if (!detail) return;
    setDisableSaving(true);
    try {
      await saveAdminProfile(!detail.user.disabled);
    } finally {
      setDisableSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    setPasswordResetSending(true);
    setError(null);
    setStatusMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(`/api/admin/users/${params.userId}/password-reset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as { email?: string; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to send password reset email.");
      }

      await loadDetail(session.access_token);
      setStatusMessage(`Password reset email sent to ${payload?.email || detail?.user.email || "this user"}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send password reset email.");
    } finally {
      setPasswordResetSending(false);
    }
  };

  const toggleUserDetailSelection = (
    checked: boolean,
    ids: string[],
    setter: Dispatch<SetStateAction<string[]>>
  ) => {
    setter((current) =>
      checked
        ? Array.from(new Set([...current, ...ids]))
        : current.filter((id) => !ids.includes(id))
    );
  };

  const bulkDeleteMemberships = async () => {
    if (!selectedMembershipIds.length || !detail) return;
    if (!window.confirm(`Delete ${selectedMembershipIds.length} selected organisation membership${selectedMembershipIds.length === 1 ? "" : "s"}?`)) return;

    setBulkDeletingSection("memberships");
    setError(null);
    setStatusMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const results = await Promise.all(
        selectedMembershipIds.map(async (organisationId) => {
          const response = await fetch(`/api/admin/organisations/${organisationId}/members/${params.userId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          return { organisationId, ok: response.ok, error: payload?.error || "Unable to delete membership." };
        })
      );

      const failures = results.filter((result) => !result.ok);
      if (failures.length === results.length) {
        throw new Error(failures[0]?.error || "Unable to delete selected memberships.");
      }

      await loadDetail(session.access_token);
      setSelectedMembershipIds([]);
      setStatusMessage(
        failures.length
          ? `Deleted ${results.length - failures.length} memberships. ${failures.length} failed.`
          : `Deleted ${results.length} memberships.`
      );
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete selected memberships.");
    } finally {
      setBulkDeletingSection(null);
    }
  };

  const bulkDeleteDirectReports = async () => {
    if (!selectedDirectReportIds.length || !detail) return;
    if (!window.confirm(`Remove ${selectedDirectReportIds.length} selected direct report link${selectedDirectReportIds.length === 1 ? "" : "s"}?`)) return;

    setBulkDeletingSection("direct-reports");
    setError(null);
    setStatusMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const selectedReports = detail.directReports
        .filter((report) => selectedDirectReportIds.includes(`${report.organisationId}:${report.userId}`))
        .map((report) => ({ organisationId: report.organisationId, userId: report.userId }));

      const response = await fetch(`/api/admin/users/${params.userId}/direct-reports/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reports: selectedReports }),
      });
      const payload = (await response.json().catch(() => null)) as { cleared?: unknown[]; failures?: unknown[]; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to remove direct report links.");
      }

      await loadDetail(session.access_token);
      setSelectedDirectReportIds([]);
      setStatusMessage(`Removed ${(payload?.cleared ?? []).length} direct report link${(payload?.cleared ?? []).length === 1 ? "" : "s"}.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to remove direct report links.");
    } finally {
      setBulkDeletingSection(null);
    }
  };

  const bulkDeleteProfileLogs = async () => {
    if (!selectedProfileLogIds.length) return;
    if (!window.confirm(`Delete ${selectedProfileLogIds.length} selected profile log entr${selectedProfileLogIds.length === 1 ? "y" : "ies"}?`)) return;

    setBulkDeletingSection("profile-log");
    setError(null);
    setStatusMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(`/api/admin/users/${params.userId}/activity-logs/bulk-delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ logIds: selectedProfileLogIds }),
      });
      const payload = (await response.json().catch(() => null)) as { deletedIds?: string[]; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete profile log entries.");
      }

      await loadDetail(session.access_token);
      setSelectedProfileLogIds([]);
      setStatusMessage(`Deleted ${(payload?.deletedIds ?? selectedProfileLogIds).length} profile log entr${selectedProfileLogIds.length === 1 ? "y" : "ies"}.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete profile log entries.");
    } finally {
      setBulkDeletingSection(null);
    }
  };

  if (loading) {
    return (
      <DashboardPageSkeleton
        mode="admin"
        activeNav="admin-users"
        eyebrow="Admin"
        title="User"
        subtitle="Loading user details."
        variant="detail"
      />
    );
  }

  const activeAdminSection = adminUserSections.find((section) => section.id === activeSection) ?? adminUserSections[0];
  const userInitials = detail ? getUserInitials(detail.user.fullName, detail.user.email) : "IT";
  const getMembershipStatusTone = (value: string) => {
    switch (value) {
      case "active":
        return shellStyles.accessStatusPillGood;
      case "draft":
      case "invited":
      case "selection_required":
      case "checkout_required":
      case "pending_activation":
        return shellStyles.accessStatusPillWarn;
      case "suspended":
      case "expired":
      case "payment_failed":
      case "cancelled":
      default:
        return shellStyles.accessStatusPillBad;
    }
  };

  const renderIdentitySection = () => {
    if (!detail) return null;

    return (
      <div className={shellStyles.accountSettingsPanel}>
        <div className={`${shellStyles.accountProfileHero} ${shellStyles.adminUserProfileHero}`}>
          <div className={shellStyles.accountProfileAvatar} aria-hidden="true">
            {userInitials}
          </div>
          <div className={shellStyles.accountProfileIdentity}>
            <strong>{detail.user.fullName || "No name set"}</strong>
            <span>{detail.user.email || "No email saved"}</span>
          </div>
          <div className={shellStyles.adminUserHeroStats} aria-label="User relationship summary">
            <div>
              <span>Organisations</span>
              <strong>{detail.memberships.length}</strong>
            </div>
            <div>
              <span>Reports</span>
              <strong>{detail.directReports.length}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{detail.user.disabled ? "Disabled" : "Active"}</strong>
            </div>
          </div>
        </div>

        <div className={shellStyles.accountSettingsDetailCard}>
          <div className={shellStyles.accountSettingsCardHeader}>
            <div>
              <h3>Profile Information</h3>
              <p>Emergency profile edits update the user profile and auth account.</p>
            </div>
            {!profileEditing ? (
              <button
                type="button"
                className={shellStyles.accountEditButton}
                onClick={() => {
                  setProfileDraftFullName(detail.user.fullName);
                  setProfileDraftEmail(detail.user.email);
                  setProfileEditing(true);
                }}
              >
                <Image src="/icons/edit.svg" alt="" width={15} height={15} />
                <span>Edit</span>
              </button>
            ) : null}
          </div>

          {profileEditing ? (
            <>
              <div className={shellStyles.accountFormGrid}>
                <label className={shellStyles.accountField}>
                  <span>Full Name</span>
                  <input
                    className={shellStyles.input}
                    value={profileDraftFullName}
                    onChange={(event) => setProfileDraftFullName(event.target.value)}
                  />
                </label>
                <label className={shellStyles.accountField}>
                  <span>Email</span>
                  <input
                    className={shellStyles.input}
                    type="email"
                    value={profileDraftEmail}
                    onChange={(event) => setProfileDraftEmail(event.target.value)}
                  />
                </label>
              </div>
              <div className={shellStyles.accountSettingsActionButtons}>
                <button
                  type="button"
                  className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                  onClick={() => {
                    setProfileDraftFullName(detail.user.fullName);
                    setProfileDraftEmail(detail.user.email);
                    setProfileEditing(false);
                  }}
                  disabled={profileSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${shellStyles.button} ${shellStyles.accountPrimaryButton}`}
                  onClick={() => void saveAdminProfile()}
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </>
          ) : (
            <div className={shellStyles.accountInfoGrid}>
              <div className={shellStyles.accountInfoItem}>
                <span>Full Name</span>
                <strong>{detail.user.fullName || "No name set"}</strong>
              </div>
              <div className={shellStyles.accountInfoItem}>
                <span>Email</span>
                <strong>{detail.user.email || "-"}</strong>
              </div>
              <div className={shellStyles.accountInfoItem}>
                <span>User ID</span>
                <strong>{detail.user.id}</strong>
              </div>
              <div className={shellStyles.accountInfoItem}>
                <span>Joined Platform</span>
                <strong>{formatDateTime(detail.user.createdAt)}</strong>
              </div>
              <div className={shellStyles.accountInfoItem}>
                <span>Email Confirmed</span>
                <strong>{formatDateTime(detail.user.emailConfirmedAt)}</strong>
              </div>
              <div className={shellStyles.accountInfoItem}>
                <span>Last Sign In</span>
                <strong>{formatDateTime(detail.user.lastSignInAt)}</strong>
              </div>
            </div>
          )}
        </div>

        <div className={shellStyles.accountSettingsDetailCard}>
          <div className={shellStyles.accountSettingsCardHeader}>
            <div>
              <h3>Subscription Access</h3>
              <p>Current billing and feature access for this user.</p>
            </div>
          </div>
          <div className={shellStyles.accountInfoGrid}>
            <div className={shellStyles.accountInfoItem}>
              <span>Access Type</span>
              <strong>{formatAccessLabel(detail.access?.currentAccessType ?? null)}</strong>
            </div>
            <div className={shellStyles.accountInfoItem}>
              <span>Status</span>
              <strong className={`${shellStyles.accessStatusPill} ${shellStyles.accountStatusPillValue} ${getMembershipStatusTone(detail.access?.currentAccessStatus ?? "")}`}>
                {detail.access?.currentAccessStatus ? formatInviteStatus(detail.access.currentAccessStatus) : "Unknown"}
              </strong>
            </div>
            <div className={shellStyles.accountInfoItem}>
              <span>Period Starts</span>
              <strong>{formatDateTime(detail.access?.currentPeriodStartsAt ?? null)}</strong>
            </div>
            <div className={shellStyles.accountInfoItem}>
              <span>Period Ends</span>
              <strong>{formatDateTime(detail.access?.currentPeriodEndsAt ?? null)}</strong>
            </div>
            <div className={shellStyles.accountInfoItem}>
              <span>Stripe Customer</span>
              <strong>{detail.access?.stripeCustomerId || "-"}</strong>
            </div>
            <div className={shellStyles.accountInfoItem}>
              <span>Subscription ID</span>
              <strong>{detail.access?.currentStripeSubscriptionId || "-"}</strong>
            </div>
          </div>
          {detail.access?.readOnlyReason ? (
            <div className={shellStyles.accountDangerBox}>
              <strong>Access restriction</strong>
              <p>{detail.access.readOnlyReason}</p>
            </div>
          ) : null}
        </div>

        <div className={shellStyles.accountSettingsDetailCard}>
          <div className={shellStyles.accountSettingsCardHeader}>
            <div>
              <h3>Account Security</h3>
              <p>Emergency actions for account recovery or account access control.</p>
            </div>
          </div>
          <div className={shellStyles.accountInfoGrid}>
            <div className={shellStyles.accountInfoItem}>
              <span>Account Status</span>
              <strong className={`${shellStyles.accessStatusPill} ${shellStyles.accountStatusPillValue} ${detail.user.disabled ? shellStyles.accessStatusPillBad : shellStyles.accessStatusPillGood}`}>
                {detail.user.disabled ? "Disabled" : "Active"}
              </strong>
            </div>
            <div className={shellStyles.accountInfoItem}>
              <span>Disabled Until</span>
              <strong>{detail.user.disabled ? formatDateTime(detail.user.disabledUntil) : "-"}</strong>
            </div>
          </div>
          <div className={shellStyles.accountSettingsActionButtons}>
            <button
              type="button"
              className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.adminUserActionButton}`}
              onClick={() => void sendPasswordReset()}
              disabled={passwordResetSending}
            >
              {passwordResetSending ? "Sending..." : "Send Password Reset"}
            </button>
            <button
              type="button"
              className={`${detail.user.disabled ? shellStyles.button : shellStyles.buttonDanger} ${shellStyles.adminUserActionButton}`}
              onClick={() => void toggleUserDisabled()}
              disabled={disableSaving || profileSaving}
            >
              {disableSaving ? "Saving..." : detail.user.disabled ? "Enable Account" : "Disable Account"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMembershipsSection = () => {
    if (!detail) return null;
    const { safePage, rows } = paginateRows(detail.memberships, membershipsPage);
    const visibleIds = rows.map((membership) => membership.organisationId);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedMembershipIds.includes(id));

    return (
      <div className={shellStyles.accountSettingsPanel}>
        <button
          type="button"
          className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.adminUserMobileSectionAction}`}
          onClick={() => void bulkDeleteMemberships()}
          disabled={!selectedMembershipIds.length || bulkDeletingSection === "memberships"}
        >
          Bulk Delete
        </button>
        <button
          type="button"
          className={`${shellStyles.button} ${shellStyles.buttonAccent} ${shellStyles.adminUserMobileSectionAction}`}
          onClick={() => void openLinkModal()}
        >
          Link organisation
        </button>
        <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
          <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
            <thead>
              <tr>
                <th>
                  <input
                    className={shellStyles.tableCheckbox}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => toggleUserDetailSelection(event.target.checked, visibleIds, setSelectedMembershipIds)}
                    aria-label="Select visible memberships"
                  />
                </th>
                <th>#</th>
                <th>Organisation</th>
                <th>Role</th>
                <th>Department</th>
                <th>Site</th>
                <th>Leader</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {detail.memberships.length === 0 ? (
                <tr>
                  <td colSpan={9} className={shellStyles.tableStateCell}>
                    <div className={shellStyles.tableEmptyState}>This user is not assigned to an organisation yet.</div>
                  </td>
                </tr>
              ) : (
                rows.map((membership, index) => (
                  <tr
                    key={membership.organisationId}
                    className={shellStyles.clickableRow}
                    tabIndex={0}
                    onClick={() => router.push(`/admin/organisations/${membership.organisationId}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/admin/organisations/${membership.organisationId}`);
                      }
                    }}
                  >
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        className={shellStyles.tableCheckbox}
                        type="checkbox"
                        checked={selectedMembershipIds.includes(membership.organisationId)}
                        onChange={(event) => toggleUserDetailSelection(event.target.checked, [membership.organisationId], setSelectedMembershipIds)}
                        aria-label={`Select ${membership.organisationName || membership.organisationId}`}
                      />
                    </td>
                    <td><span className={shellStyles.tableValue}>{(safePage - 1) * detailPageSize + index + 1}</span></td>
                    <td>
                      <div className={shellStyles.mapCell}>
                        <div className={shellStyles.mapCellText}>
                          <strong className={shellStyles.tableClamp}>{membership.organisationName || "Unknown organisation"}</strong>
                          {membership.organisationSlug ? (
                            <span className={shellStyles.tableClamp}>{membership.organisationSlug}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td><span className={shellStyles.tableValue}>{formatAdminRole(membership.role)}</span></td>
                    <td><span className={shellStyles.tableValue}>{membership.departmentName || "-"}</span></td>
                    <td><span className={shellStyles.tableValue}>{membership.siteName || "-"}</span></td>
                    <td><span className={shellStyles.tableWrapText}>{membership.leaderName || membership.leaderEmail || "-"}</span></td>
                    <td>
                      <span className={`${shellStyles.accessStatusPill} ${shellStyles.adminStatusPillValue} ${getMembershipStatusTone(membership.inviteStatus)}`}>
                        {formatInviteStatus(membership.inviteStatus)}
                      </span>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className={shellStyles.actionButtons}>
                        <button
                          type="button"
                          className={shellStyles.actionButton}
                          onClick={() => void openEditMembershipModal(membership)}
                          aria-label="Edit membership"
                          title="Edit membership"
                        >
                          <Image src="/icons/edit.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                        </button>
                        {membership.inviteStatus === "invited" || membership.inviteStatus === "draft" ? (
                          <button
                            type="button"
                            className={shellStyles.actionButton}
                            onClick={() => void handleResendInvite(membership)}
                            disabled={resendingInviteFor === membership.organisationId}
                            aria-label="Resend invite email"
                            title="Resend invite email"
                          >
                            <Image src="/icons/send.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={shellStyles.adminUserMobileList}>
          {detail.memberships.length === 0 ? (
            <div className={shellStyles.adminUserMobileState}>This user is not assigned to an organisation yet.</div>
          ) : (
            rows.map((membership, index) => (
              <div key={`mobile-${membership.organisationId}`} className={shellStyles.adminUserMobileCard}>
                <div className={shellStyles.adminUserMobileCardHeader}>
                  <input
                    className={shellStyles.tableCheckbox}
                    type="checkbox"
                    checked={selectedMembershipIds.includes(membership.organisationId)}
                    onChange={(event) => toggleUserDetailSelection(event.target.checked, [membership.organisationId], setSelectedMembershipIds)}
                    aria-label={`Select ${membership.organisationName || membership.organisationId}`}
                  />
                  <span className={shellStyles.adminUserMobileTitleBlock}>
                    <strong>{(safePage - 1) * detailPageSize + index + 1}. {membership.organisationName || "Unknown organisation"}</strong>
                    <small>{membership.organisationSlug || "No slug set"}</small>
                  </span>
                  <span className={`${shellStyles.accessStatusPill} ${shellStyles.adminStatusPillValue} ${getMembershipStatusTone(membership.inviteStatus)}`}>
                    {formatInviteStatus(membership.inviteStatus)}
                  </span>
                </div>
                <dl className={shellStyles.adminUserMobileMeta}>
                  <div>
                    <dt>Role</dt>
                    <dd>{formatAdminRole(membership.role)}</dd>
                  </div>
                  <div>
                    <dt>Department</dt>
                    <dd>{membership.departmentName || "-"}</dd>
                  </div>
                  <div>
                    <dt>Site</dt>
                    <dd>{membership.siteName || "-"}</dd>
                  </div>
                  <div>
                    <dt>Leader</dt>
                    <dd>{membership.leaderName || membership.leaderEmail || "-"}</dd>
                  </div>
                </dl>
                <div className={shellStyles.adminUserMobileActions}>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={() => void openEditMembershipModal(membership)}
                  >
                    Edit
                  </button>
                  {membership.inviteStatus === "invited" || membership.inviteStatus === "draft" ? (
                    <button
                      type="button"
                      className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                      onClick={() => void handleResendInvite(membership)}
                      disabled={resendingInviteFor === membership.organisationId}
                    >
                      {resendingInviteFor === membership.organisationId ? "Sending..." : "Resend Invite"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
        <DashboardTableFooter
          total={detail.memberships.length}
          page={safePage}
          pageSize={detailPageSize}
          onPageChange={setMembershipsPage}
          label="memberships"
        />
      </div>
    );
  };

  const renderDirectReportsSection = () => {
    if (!detail) return null;
    const { safePage, rows } = paginateRows(detail.directReports, directReportsPage);
    const rowKey = (report: UserDetail["directReports"][number]) => `${report.organisationId}:${report.userId}`;
    const visibleIds = rows.map(rowKey);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedDirectReportIds.includes(id));

    return (
      <div className={shellStyles.accountSettingsPanel}>
        <button
          type="button"
          className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.adminUserMobileSectionAction}`}
          onClick={() => void bulkDeleteDirectReports()}
          disabled={!selectedDirectReportIds.length || bulkDeletingSection === "direct-reports"}
        >
          Bulk Delete
        </button>
        <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
          <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
            <thead>
              <tr>
                <th>
                  <input
                    className={shellStyles.tableCheckbox}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => toggleUserDetailSelection(event.target.checked, visibleIds, setSelectedDirectReportIds)}
                    aria-label="Select visible direct reports"
                  />
                </th>
                <th>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Organisation</th>
              </tr>
            </thead>
            <tbody>
              {detail.directReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className={shellStyles.tableStateCell}>
                    <div className={shellStyles.tableEmptyState}>No direct reports linked to this user yet.</div>
                  </td>
                </tr>
              ) : (
                rows.map((report, index) => (
                  <tr
                    key={`${report.organisationId}-${report.userId}`}
                    className={shellStyles.clickableRow}
                    tabIndex={0}
                    onClick={() => router.push(`/admin/users/${report.userId}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/admin/users/${report.userId}`);
                      }
                    }}
                  >
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        className={shellStyles.tableCheckbox}
                        type="checkbox"
                        checked={selectedDirectReportIds.includes(rowKey(report))}
                        onChange={(event) => toggleUserDetailSelection(event.target.checked, [rowKey(report)], setSelectedDirectReportIds)}
                        aria-label={`Select ${report.fullName || report.email || report.userId}`}
                      />
                    </td>
                    <td><span className={shellStyles.tableValue}>{(safePage - 1) * detailPageSize + index + 1}</span></td>
                    <td><span className={shellStyles.tableWrapText}>{report.fullName || "No name set"}</span></td>
                    <td><span className={shellStyles.tableWrapText}>{report.email || "-"}</span></td>
                    <td><span className={shellStyles.tableWrapText}>{report.organisationName || "-"}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={shellStyles.adminUserMobileList}>
          {detail.directReports.length === 0 ? (
            <div className={shellStyles.adminUserMobileState}>No direct reports linked to this user yet.</div>
          ) : (
            rows.map((report, index) => (
              <div
                key={`mobile-${report.organisationId}-${report.userId}`}
                className={shellStyles.adminUserMobileCard}
              >
                <span className={shellStyles.adminUserMobileCardHeader}>
                  <input
                    className={shellStyles.tableCheckbox}
                    type="checkbox"
                    checked={selectedDirectReportIds.includes(rowKey(report))}
                    onChange={(event) => toggleUserDetailSelection(event.target.checked, [rowKey(report)], setSelectedDirectReportIds)}
                    aria-label={`Select ${report.fullName || report.email || report.userId}`}
                  />
                  <span className={shellStyles.adminUserMobileTitleBlock}>
                    <strong>{(safePage - 1) * detailPageSize + index + 1}. {report.fullName || "No name set"}</strong>
                    <small>{report.email || "-"}</small>
                  </span>
                </span>
                <span className={shellStyles.adminUserMobileMeta}>
                  <span>
                    <strong>Organisation</strong>
                    <small>{report.organisationName || "-"}</small>
                  </span>
                </span>
                <span className={shellStyles.adminUserMobileActions}>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={() => router.push(`/admin/users/${report.userId}`)}
                  >
                    View user
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
        <DashboardTableFooter
          total={detail.directReports.length}
          page={safePage}
          pageSize={detailPageSize}
          onPageChange={setDirectReportsPage}
          label="direct reports"
        />
      </div>
    );
  };

  const renderProfileLogSection = () => {
    if (!detail) return null;
    const { safePage, rows } = paginateRows(detail.activityLogs, profileLogPage);
    const visibleIds = rows.map((log) => log.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProfileLogIds.includes(id));

    return (
      <div className={shellStyles.accountSettingsPanel}>
        <button
          type="button"
          className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.adminUserMobileSectionAction}`}
          onClick={() => void bulkDeleteProfileLogs()}
          disabled={!selectedProfileLogIds.length || bulkDeletingSection === "profile-log"}
        >
          Bulk Delete
        </button>
        <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
          <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
            <thead>
              <tr>
                <th>
                  <input
                    className={shellStyles.tableCheckbox}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => toggleUserDetailSelection(event.target.checked, visibleIds, setSelectedProfileLogIds)}
                    aria-label="Select visible profile logs"
                  />
                </th>
                <th>Date / Time</th>
                <th>Status</th>
                <th>Activity</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {detail.activityLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className={shellStyles.tableStateCell}>
                    <div className={shellStyles.tableEmptyState}>No profile activity has been logged yet.</div>
                  </td>
                </tr>
              ) : (
                rows.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <input
                        className={shellStyles.tableCheckbox}
                        type="checkbox"
                        checked={selectedProfileLogIds.includes(log.id)}
                        onChange={(event) => toggleUserDetailSelection(event.target.checked, [log.id], setSelectedProfileLogIds)}
                        aria-label={`Select ${formatInviteStatus(log.action)}`}
                      />
                    </td>
                    <td><span className={shellStyles.tableDate}>{formatDateTime(log.createdAt)}</span></td>
                    <td>
                      <span
                        className={`${shellStyles.accessStatusPill} ${shellStyles.adminStatusPillValue} ${
                          log.status === "success"
                            ? shellStyles.accessStatusPillGood
                            : log.status === "failed"
                              ? shellStyles.accessStatusPillBad
                              : shellStyles.accessStatusPillWarn
                        }`}
                      >
                        {formatInviteStatus(log.status)}
                      </span>
                    </td>
                    <td><span className={shellStyles.tableValue}>{formatInviteStatus(log.action)}</span></td>
                    <td><span className={shellStyles.tableWrapText}>{log.summary}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={shellStyles.adminUserMobileList}>
          {detail.activityLogs.length === 0 ? (
            <div className={shellStyles.adminUserMobileState}>No profile activity has been logged yet.</div>
          ) : (
            rows.map((log) => (
              <div key={`mobile-${log.id}`} className={shellStyles.adminUserMobileCard}>
                <div className={shellStyles.adminUserMobileCardHeader}>
                  <input
                    className={shellStyles.tableCheckbox}
                    type="checkbox"
                    checked={selectedProfileLogIds.includes(log.id)}
                    onChange={(event) => toggleUserDetailSelection(event.target.checked, [log.id], setSelectedProfileLogIds)}
                    aria-label={`Select ${formatInviteStatus(log.action)}`}
                  />
                  <span
                    className={`${shellStyles.accessStatusPill} ${shellStyles.adminStatusPillValue} ${
                      log.status === "success"
                        ? shellStyles.accessStatusPillGood
                        : log.status === "failed"
                          ? shellStyles.accessStatusPillBad
                          : shellStyles.accessStatusPillWarn
                    }`}
                  >
                    {formatInviteStatus(log.status)}
                  </span>
                  <span className={shellStyles.adminUserMobileTitleBlock}>
                    <strong>{formatInviteStatus(log.action)}</strong>
                    <small>{formatDateTime(log.createdAt)}</small>
                  </span>
                </div>
                <p className={shellStyles.adminUserLogSummary}>{log.summary}</p>
              </div>
            ))
          )}
        </div>
        <DashboardTableFooter
          total={detail.activityLogs.length}
          page={safePage}
          pageSize={detailPageSize}
          onPageChange={setProfileLogPage}
          label="logs"
        />
      </div>
    );
  };

  const renderAdminUserSection = (sectionId: AdminUserSectionId) => {
    switch (sectionId) {
      case "identity":
        return renderIdentitySection();
      case "memberships":
        return renderMembershipsSection();
      case "direct-reports":
        return renderDirectReportsSection();
      case "profile-log":
        return renderProfileLogSection();
      default:
        return null;
    }
  };

  return (
    <DashboardShell
      mode="admin"
      activeNav="admin-users"
      eyebrow="Admin"
      title={detail?.user.fullName || detail?.user.email || "User"}
      subtitle="Membership, organisation assignment, and reporting relationships."
      headerLead={
        <button
          type="button"
          className={shellStyles.reportBackButton}
          onClick={() => router.push("/admin/users")}
          aria-label="Back to users"
        >
          <Image src="/icons/back.svg" alt="" width={18} height={18} className={shellStyles.reportBackIcon} />
          <span>Back</span>
        </button>
      }
      headerRight={
        currentUserEmail ? (
          <div className={shellStyles.accountSummary}>
            <div className={shellStyles.accountSummaryText}>
              <div className={shellStyles.accountSummaryPrimary}>
                <span className={shellStyles.accountSummaryLabel}>Admin account</span>
                <strong>{currentUserEmail}</strong>
              </div>
            </div>
          </div>
        ) : undefined
      }
    >
      <section className={shellStyles.accountCard}>
        {error ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p> : null}
        {statusMessage ? <p className={`${shellStyles.message} ${shellStyles.messageSuccess}`}>{statusMessage}</p> : null}
        {!authorized ? (
          <p className={`${shellStyles.message} ${shellStyles.messageError}`}>This page is restricted to the admin account.</p>
        ) : detail ? (
          <div className={shellStyles.accountSettingsSurface}>
            <aside className={shellStyles.accountSettingsSidebar} aria-label="Admin user menu">
              <div className={shellStyles.accountSettingsSidebarHeader}>
                <span>Admin</span>
                <strong>User</strong>
              </div>
              <div className={shellStyles.accountSettingsNav} role="tablist" aria-label="Admin user sections">
                {adminUserSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    role="tab"
                    aria-selected={activeSection === section.id}
                    className={`${shellStyles.accountSettingsNavItem} ${activeSection === section.id ? shellStyles.accountSettingsNavItemActive : ""}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span className={shellStyles.accountSettingsNavIcon} aria-hidden="true">
                      <Image src={section.icon} alt="" width={18} height={18} />
                    </span>
                    <span className={shellStyles.accountSettingsNavCopy}>
                      <strong>{section.label}</strong>
                      <small>{section.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <div className={shellStyles.accountSettingsMobileAccordion} aria-label="Admin user sections">
              {adminUserSections.map((section) => {
                const isOpen = activeSection === section.id;
                const panelId = `admin-user-mobile-panel-${section.id}`;

                return (
                  <div
                    key={section.id}
                    className={`${shellStyles.accountSettingsAccordionItem} ${isOpen ? shellStyles.accountSettingsAccordionItemOpen : ""}`}
                  >
                    <button
                      type="button"
                      className={shellStyles.accountSettingsAccordionButton}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <span className={shellStyles.accountSettingsNavIcon} aria-hidden="true">
                        <Image src={section.icon} alt="" width={18} height={18} />
                      </span>
                      <span className={shellStyles.accountSettingsNavCopy}>
                        <strong>{section.label}</strong>
                        <small>{section.description}</small>
                      </span>
                      <span className={shellStyles.accountSettingsAccordionChevron} aria-hidden="true" />
                    </button>
                    {isOpen ? (
                      <div id={panelId} className={shellStyles.accountSettingsMobilePanel}>
                        {renderAdminUserSection(section.id)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className={shellStyles.accountSettingsContent}>
              <div className={shellStyles.accountSettingsContentHeader}>
                <div>
                  <h2>{activeAdminSection.label}</h2>
                  <p>{activeAdminSection.description}</p>
                </div>
                {activeSection === "memberships" ? (
                  <div className={shellStyles.headerButtons}>
                    <button
                      type="button"
                      className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.adminUserActionButton}`}
                      onClick={() => void bulkDeleteMemberships()}
                      disabled={!selectedMembershipIds.length || bulkDeletingSection === "memberships"}
                    >
                      Bulk Delete
                    </button>
                    <button
                      type="button"
                      className={`${shellStyles.button} ${shellStyles.buttonAccent} ${shellStyles.adminUserActionButton}`}
                      onClick={() => void openLinkModal()}
                    >
                      Link organisation
                    </button>
                  </div>
                ) : activeSection === "direct-reports" ? (
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.adminUserActionButton}`}
                    onClick={() => void bulkDeleteDirectReports()}
                    disabled={!selectedDirectReportIds.length || bulkDeletingSection === "direct-reports"}
                  >
                    Bulk Delete
                  </button>
                ) : activeSection === "profile-log" ? (
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.adminUserActionButton}`}
                    onClick={() => void bulkDeleteProfileLogs()}
                    disabled={!selectedProfileLogIds.length || bulkDeletingSection === "profile-log"}
                  >
                    Bulk Delete
                  </button>
                ) : null}
              </div>
              {renderAdminUserSection(activeSection)}
            </div>
          </div>
        ) : null}
      </section>

      {linkModalOpen ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            <div className={shellStyles.dashboardModalHeader}>
              <div className={shellStyles.dashboardModalBrand}>
                <Image
                  src="/images/investigation-tool.png"
                  alt="Investigation Tool"
                  width={40}
                  height={40}
                  className={shellStyles.dashboardModalLogo}
                />
                <div className={shellStyles.dashboardModalBrandCopy}>
                  <span className={shellStyles.dashboardModalEyebrow}>Admin</span>
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>Link organisation</h3>
                </div>
              </div>
              <button
                type="button"
                className={shellStyles.adminWizardClose}
                onClick={() => setLinkModalOpen(false)}
                aria-label="Close link organisation modal"
              >
                x
              </button>
            </div>
            <p className={shellStyles.modalText}>Search eligible organisations and link one directly to this user.</p>
            <div className={shellStyles.modalListWrap}>
              <div className={shellStyles.adminModalStack}>
                <label className={shellStyles.accountField}>
                  <span>Role</span>
                  <select className={shellStyles.input} value={linkRole} onChange={(event) => setLinkRole(event.target.value as "org_admin" | "general_user")}>
                    <option value="general_user">General user</option>
                    <option value="org_admin">Org admin</option>
                  </select>
                </label>
                <label className={shellStyles.accountField}>
                  <span>Search organisations</span>
                  <input
                    className={shellStyles.input}
                    value={linkSearch}
                    onChange={(event) => setLinkSearch(event.target.value)}
                    placeholder="Search by name, slug, or description"
                  />
                </label>
              </div>
            </div>
            {linkError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{linkError}</p> : null}
            <div className={shellStyles.modalListWrap}>
              <div className={shellStyles.adminSearchResults}>
                {linkOptionsLoading ? (
                  <div className={shellStyles.adminSearchState}>Loading organisations...</div>
                ) : eligibleOrganisations.length === 0 ? (
                  <div className={shellStyles.adminSearchState}>No eligible organisations match this search.</div>
                ) : (
                  eligibleOrganisations.map((organisation) => (
                    <div key={organisation.id} className={shellStyles.adminSearchResultRow}>
                      <div className={shellStyles.adminSearchResultCopy}>
                        <strong>{organisation.name}</strong>
                        <span>{organisation.slug || organisation.description || organisation.id}</span>
                      </div>
                      <button
                        type="button"
                        className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                        onClick={() => void handleLinkOrganisation(organisation.id)}
                        disabled={linkSubmitting}
                      >
                        {linkSubmitting ? "Linking..." : "Link"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setLinkModalOpen(false)}
                disabled={linkSubmitting}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editMembership ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            <div className={shellStyles.dashboardModalHeader}>
              <div className={shellStyles.dashboardModalBrand}>
                <Image
                  src="/images/investigation-tool.png"
                  alt="Investigation Tool"
                  width={40}
                  height={40}
                  className={shellStyles.dashboardModalLogo}
                />
                <div className={shellStyles.dashboardModalBrandCopy}>
                  <span className={shellStyles.dashboardModalEyebrow}>Admin</span>
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>Edit membership</h3>
                </div>
              </div>
              <button
                type="button"
                className={shellStyles.adminWizardClose}
                onClick={() => setEditMembership(null)}
                aria-label="Close edit membership modal"
              >
                x
              </button>
            </div>
            <p className={shellStyles.modalText}>
              Update this user&apos;s role and membership status for <strong>{editMembership.organisationName}</strong>.
            </p>
            <div className={shellStyles.modalListWrap}>
              <div className={shellStyles.adminModalStack}>
                <label className={shellStyles.accountField}>
                  <span>Role</span>
                  <select className={shellStyles.input} value={editRole} onChange={(event) => setEditRole(event.target.value as "org_admin" | "general_user")}>
                    <option value="general_user">General user</option>
                    <option value="org_admin">Org admin</option>
                  </select>
                </label>
                <label className={shellStyles.accountField}>
                  <span>Status</span>
                  <select className={shellStyles.input} value={editStatus} onChange={(event) => setEditStatus(event.target.value as "draft" | "invited" | "active" | "suspended")}>
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                    <option value="draft">Draft</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
                <label className={shellStyles.accountField}>
                  <span>Department</span>
                  <select className={shellStyles.input} value={editDepartmentId} onChange={(event) => setEditDepartmentId(event.target.value)}>
                    <option value="">No department</option>
                    {editOptions.departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={shellStyles.accountField}>
                  <span>Site</span>
                  <select className={shellStyles.input} value={editSiteId} onChange={(event) => setEditSiteId(event.target.value)}>
                    <option value="">No site</option>
                    {editOptions.sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={shellStyles.accountField}>
                  <span>Leader</span>
                  <select className={shellStyles.input} value={editLeaderUserId} onChange={(event) => setEditLeaderUserId(event.target.value)}>
                    <option value="">No leader</option>
                    {editOptions.members
                      .filter((member) => member.userId !== params.userId)
                      .map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.fullName || member.email}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            </div>
            {editError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{editError}</p> : null}
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setEditMembership(null)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => void handleEditMembership()}
                disabled={editSubmitting}
              >
                {editSubmitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
