"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import { isPlatformAdminEmail } from "@/lib/platformAdmin";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type OrganisationDetail = {
  organisation: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    status: "active" | "inactive";
    billingPlanName: string;
    billingNotes: string;
    created_at: string;
  };
  departments: Array<{ id: string; name: string }>;
  sites: Array<{ id: string; name: string }>;
  members: Array<{
    userId: string;
    role: string;
    inviteStatus: string;
    joinedAt: string | null;
    departmentId: string;
    siteId: string;
    leaderUserId: string;
    fullName: string;
    email: string;
    departmentName: string;
    siteName: string;
    leaderName: string;
    leaderEmail: string;
  }>;
  invites: Array<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    invitedAt: string;
  }>;
};

type EditableMember = OrganisationDetail["members"][number];

type UserListItem = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  organisations: string[];
};

type BulkInviteResponse = {
  invited?: Array<{ email: string; userId: string }>;
  failures?: Array<{ email: string; error: string }>;
  error?: string;
};

type StructureItem = { id: string; name: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Australia/Perth",
      }).format(new Date(value))
    : "-";

const parseBulkCreateRows = (value: string) => {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const angleMatch = line.match(/^(.*)<([^>]+)>$/);
    if (angleMatch) {
      const fullName = angleMatch[1]?.trim();
      const email = angleMatch[2]?.trim().toLowerCase();
      if (email && EMAIL_PATTERN.test(email) && fullName) {
        return { fullName, email };
      }
    }

    const parts = line.split(",").map((part) => part.trim()).filter(Boolean);
    const email = parts.find((part) => EMAIL_PATTERN.test(part.toLowerCase()))?.toLowerCase() ?? "";
    const fullName = parts.filter((part) => part.toLowerCase() !== email).join(" ").trim();

    if (!email || !fullName) {
      throw new Error(`Line ${index + 1} must include a full name and email.`);
    }

    return { fullName, email };
  });
};

const parseStructureNames = (value: string) =>
  Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  );

export default function AdminOrganisationDetailPage() {
  const params = useParams<{ organisationId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrganisationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resendingInviteFor, setResendingInviteFor] = useState<string | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkOptionsLoading, setLinkOptionsLoading] = useState(false);
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSearch, setLinkSearch] = useState("");
  const [linkRole, setLinkRole] = useState<"org_admin" | "general_user">("general_user");
  const [userOptions, setUserOptions] = useState<UserListItem[]>([]);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [bulkCreateInput, setBulkCreateInput] = useState("");
  const [bulkCreateRole, setBulkCreateRole] = useState<"org_admin" | "general_user">("general_user");
  const [bulkCreateSubmitting, setBulkCreateSubmitting] = useState(false);
  const [bulkCreateError, setBulkCreateError] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<EditableMember | null>(null);
  const [editRole, setEditRole] = useState<"org_admin" | "general_user">("general_user");
  const [editStatus, setEditStatus] = useState<"draft" | "invited" | "active" | "suspended">("active");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editSiteId, setEditSiteId] = useState("");
  const [editLeaderUserId, setEditLeaderUserId] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [structureModalOpen, setStructureModalOpen] = useState<null | { kind: "department" | "site"; mode: "create" | "edit"; item: StructureItem | null }>(null);
  const [structureName, setStructureName] = useState("");
  const [structureNamesInput, setStructureNamesInput] = useState("");
  const [structureSubmitting, setStructureSubmitting] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);

  const loadDetail = useCallback(async (accessToken: string) => {
    const response = await fetch(`/api/admin/organisations/${params.organisationId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await response.json()) as OrganisationDetail & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load organisation.");
    }

    setDetail(payload);
  }, [params.organisationId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          router.push(`/login?returnTo=%2Fadmin%2Forganisations%2F${params.organisationId}`);
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
          router.push(`/login?returnTo=%2Fadmin%2Forganisations%2F${params.organisationId}`);
          return;
        }

        await loadDetail(session.access_token);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load organisation.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadDetail, params.organisationId, router, supabase]);

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

      const response = await fetch("/api/admin/users/list", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const payload = (await response.json()) as { users?: UserListItem[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load users.");
      }

      setUserOptions(payload.users ?? []);
    } catch (loadError) {
      setLinkError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setLinkOptionsLoading(false);
    }
  };

  const handleLinkUser = async (userId: string) => {
    setLinkSubmitting(true);
    setLinkError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(`/api/admin/organisations/${params.organisationId}/link-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          role: linkRole,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to link user.");
      }

      await loadDetail(session.access_token);
      setLinkModalOpen(false);
      setUserOptions([]);
      setStatusMessage("User linked to this organisation.");
    } catch (submitError) {
      setLinkError(submitError instanceof Error ? submitError.message : "Unable to link user.");
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleBulkCreateUsers = async () => {
    setBulkCreateSubmitting(true);
    setBulkCreateError(null);
    setStatusMessage(null);

    try {
      const entries = parseBulkCreateRows(bulkCreateInput).map((entry) => ({
        ...entry,
        role: bulkCreateRole,
      }));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(`/api/admin/organisations/${params.organisationId}/bulk-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ entries }),
      });

      const payload = (await response.json()) as BulkInviteResponse;
      if (!response.ok && !(payload.invited?.length || payload.failures?.length)) {
        throw new Error(payload.error || "Unable to bulk create users.");
      }

      await loadDetail(session.access_token);
      setBulkCreateModalOpen(false);
      setBulkCreateInput("");
      setStatusMessage(
        payload.failures?.length
          ? `Created ${(payload.invited ?? []).length} users. ${payload.failures.length} failed: ${payload.failures.map((failure) => failure.email).join(", ")}`
          : `Created ${(payload.invited ?? []).length} users for this organisation.`
      );
    } catch (submitError) {
      setBulkCreateError(submitError instanceof Error ? submitError.message : "Unable to bulk create users.");
    } finally {
      setBulkCreateSubmitting(false);
    }
  };

  const eligibleUsers = useMemo(() => {
    const memberIds = new Set(detail?.members.map((member) => member.userId) ?? []);
    const search = linkSearch.trim().toLowerCase();

    return userOptions.filter((user) => {
      if (memberIds.has(user.id)) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [user.fullName, user.email, user.organisations.join(", ")]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [detail?.members, linkSearch, userOptions]);

  const openEditMemberModal = (member: EditableMember) => {
    setEditMember(member);
    setEditRole(member.role === "org_admin" ? "org_admin" : "general_user");
    setEditStatus(
      member.inviteStatus === "draft" ||
        member.inviteStatus === "invited" ||
        member.inviteStatus === "suspended"
        ? member.inviteStatus
        : "active"
    );
    setEditDepartmentId(member.departmentId || "");
    setEditSiteId(member.siteId || "");
    setEditLeaderUserId(member.leaderUserId || "");
    setEditError(null);
  };

  const handleEditMember = async () => {
    if (!editMember) return;

    setEditSubmitting(true);
    setEditError(null);
    setStatusMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(
        `/api/admin/organisations/${params.organisationId}/members/${editMember.userId}`,
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
      setEditMember(null);
      setStatusMessage("Membership updated.");
    } catch (submitError) {
      setEditError(submitError instanceof Error ? submitError.message : "Unable to update membership.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleResendInvite = async (member: EditableMember) => {
    setResendingInviteFor(member.userId);
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
        `/api/admin/organisations/${params.organisationId}/members/${member.userId}/resend-invite`,
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
      setStatusMessage(`Invite resent to ${payload.email || member.email || "this user"}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to resend invite.");
    } finally {
      setResendingInviteFor(null);
    }
  };

  const openStructureModal = (kind: "department" | "site", mode: "create" | "edit", item: StructureItem | null = null) => {
    setStructureModalOpen({ kind, mode, item });
    setStructureName(item?.name ?? "");
    setStructureNamesInput("");
    setStructureError(null);
  };

  const handleSaveStructureItem = async () => {
    if (!structureModalOpen) return;

    setStructureSubmitting(true);
    setStructureError(null);
    setStatusMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const basePath = `/api/admin/organisations/${params.organisationId}/${structureModalOpen.kind === "department" ? "departments" : "sites"}`;
      const url =
        structureModalOpen.mode === "create"
          ? basePath
          : `${basePath}/${structureModalOpen.item?.id}`;

      const response = await fetch(url, {
        method: structureModalOpen.mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(
          structureModalOpen.mode === "create"
            ? {
                names: parseStructureNames(structureNamesInput),
              }
            : {
                name: structureName,
              }
        ),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save item.");
      }

      await loadDetail(session.access_token);
      setStructureModalOpen(null);
      setStatusMessage(
        structureModalOpen.mode === "create"
          ? `${structureModalOpen.kind === "department" ? "Departments" : "Sites"} created.`
          : `${structureModalOpen.kind === "department" ? "Department" : "Site"} updated.`
      );
    } catch (submitError) {
      setStructureError(submitError instanceof Error ? submitError.message : "Unable to save item.");
    } finally {
      setStructureSubmitting(false);
    }
  };

  const handleDeleteStructureItem = async (kind: "department" | "site", item: StructureItem) => {
    setStructureSubmitting(true);
    setStructureError(null);
    setStatusMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch(
        `/api/admin/organisations/${params.organisationId}/${kind === "department" ? "departments" : "sites"}/${item.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete item.");
      }

      await loadDetail(session.access_token);
      setStatusMessage(`${kind === "department" ? "Department" : "Site"} deleted.`);
    } catch (submitError) {
      setStructureError(submitError instanceof Error ? submitError.message : "Unable to delete item.");
    } finally {
      setStructureSubmitting(false);
    }
  };

  const editableLeaderOptions = useMemo(() => {
    if (!editMember || !detail) return [];
    return detail.members.filter((member) => member.userId !== editMember.userId);
  }, [detail, editMember]);

  if (loading) {
    return (
      <DashboardPageSkeleton
        mode="admin"
        activeNav="admin-organisations"
        eyebrow="Admin"
        title="Organisation"
        subtitle="Loading organisation details."
        variant="detail"
      />
    );
  }

  return (
    <DashboardShell
      mode="admin"
      activeNav="admin-organisations"
      eyebrow="Admin"
      title={detail?.organisation.name || "Organisation"}
      subtitle={detail?.organisation.description || "Organisation detail and structure."}
      headerLead={
        <button
          type="button"
          className={shellStyles.reportBackButton}
          onClick={() => router.push("/admin/organisations")}
          aria-label="Back to organisations"
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
          <div className={shellStyles.adminDetailPage}>
            <section className={shellStyles.adminDetailSection}>
              <div className={shellStyles.adminDetailHeader}>
                <div className={shellStyles.adminDetailTitleGroup}>
                  <h2>Organisation settings</h2>
                  <p>Core organisation identity, billing reference, and current tenant status.</p>
                </div>
              </div>
              <dl className={shellStyles.adminDetailMetaGrid}>
                <div className={shellStyles.adminDetailMetaItem}>
                  <dt>Name</dt>
                  <dd>{detail.organisation.name}</dd>
                </div>
                <div className={shellStyles.adminDetailMetaItem}>
                  <dt>Slug</dt>
                  <dd>{detail.organisation.slug || "-"}</dd>
                </div>
                <div className={shellStyles.adminDetailMetaItem}>
                  <dt>Status</dt>
                  <dd>{detail.organisation.status}</dd>
                </div>
                <div className={shellStyles.adminDetailMetaItem}>
                  <dt>Created</dt>
                  <dd>{formatDateTime(detail.organisation.created_at)}</dd>
                </div>
              </dl>
            </section>

            <section className={shellStyles.adminDetailSection}>
              <div className={shellStyles.adminDetailHeader}>
                <div className={shellStyles.adminDetailTitleGroup}>
                  <h2>Structure</h2>
                  <p>Departments, sites, and active membership count for this organisation.</p>
                </div>
              </div>
              <div className={shellStyles.adminDetailSummary}>
                <div className={shellStyles.adminDetailSummaryItem}>
                  <span>Departments</span>
                  <strong>{detail.departments.length}</strong>
                </div>
                <div className={shellStyles.adminDetailSummaryItem}>
                  <span>Sites</span>
                  <strong>{detail.sites.length}</strong>
                </div>
                <div className={shellStyles.adminDetailSummaryItem}>
                  <span>Members</span>
                  <strong>{detail.members.length}</strong>
                </div>
              </div>
              <div className={shellStyles.adminDetailNestedGrids}>
                <div className={shellStyles.adminDetailNestedCard}>
                  <div className={shellStyles.adminDetailMiniHeader}>
                    <div className={shellStyles.adminDetailTitleGroup}>
                      <h2>Departments</h2>
                      <p>Manage department options for this organisation.</p>
                    </div>
                    <button
                      type="button"
                      className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                      onClick={() => openStructureModal("department", "create")}
                    >
                      Add department
                    </button>
                  </div>
                  <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
                    <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.departments.length === 0 ? (
                          <tr>
                            <td colSpan={3} className={shellStyles.tableStateCell}>
                              <div className={shellStyles.tableEmptyState}>No departments added yet.</div>
                            </td>
                          </tr>
                        ) : (
                          detail.departments.map((department, index) => (
                            <tr key={department.id}>
                              <td><span className={shellStyles.tableValue}>{index + 1}</span></td>
                              <td><span className={shellStyles.tableWrapText}>{department.name}</span></td>
                              <td>
                                <div className={shellStyles.actionButtons}>
                                  <button
                                    type="button"
                                    className={shellStyles.actionButton}
                                    onClick={() => openStructureModal("department", "edit", department)}
                                    aria-label="Edit department"
                                  >
                                    <Image src="/icons/edit.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${shellStyles.actionButton} ${shellStyles.actionButtonDanger}`}
                                    onClick={() => void handleDeleteStructureItem("department", department)}
                                    aria-label="Delete department"
                                    disabled={structureSubmitting}
                                  >
                                    <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={shellStyles.adminDetailNestedCard}>
                  <div className={shellStyles.adminDetailMiniHeader}>
                    <div className={shellStyles.adminDetailTitleGroup}>
                      <h2>Sites</h2>
                      <p>Manage site options for this organisation.</p>
                    </div>
                    <button
                      type="button"
                      className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                      onClick={() => openStructureModal("site", "create")}
                    >
                      Add site
                    </button>
                  </div>
                  <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
                    <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.sites.length === 0 ? (
                          <tr>
                            <td colSpan={3} className={shellStyles.tableStateCell}>
                              <div className={shellStyles.tableEmptyState}>No sites added yet.</div>
                            </td>
                          </tr>
                        ) : (
                          detail.sites.map((site, index) => (
                            <tr key={site.id}>
                              <td><span className={shellStyles.tableValue}>{index + 1}</span></td>
                              <td><span className={shellStyles.tableWrapText}>{site.name}</span></td>
                              <td>
                                <div className={shellStyles.actionButtons}>
                                  <button
                                    type="button"
                                    className={shellStyles.actionButton}
                                    onClick={() => openStructureModal("site", "edit", site)}
                                    aria-label="Edit site"
                                  >
                                    <Image src="/icons/edit.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${shellStyles.actionButton} ${shellStyles.actionButtonDanger}`}
                                    onClick={() => void handleDeleteStructureItem("site", site)}
                                    aria-label="Delete site"
                                    disabled={structureSubmitting}
                                  >
                                    <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            <section className={shellStyles.adminDetailSection}>
              <div className={shellStyles.adminDetailHeader}>
                <div className={shellStyles.adminDetailTitleGroup}>
                  <h2>Members</h2>
                  <p>Organisation users, their role, reporting line, and assignment metadata.</p>
                </div>
                <div className={shellStyles.headerButtons}>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={() => setBulkCreateModalOpen(true)}
                  >
                    Bulk create users
                  </button>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                    onClick={() => void openLinkModal()}
                  >
                    Link existing user
                  </button>
                </div>
              </div>
              <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
                <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Site</th>
                      <th>Leader</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.members.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={shellStyles.tableStateCell}>
                          <div className={shellStyles.tableEmptyState}>No organisation members yet.</div>
                        </td>
                      </tr>
                    ) : (
                      detail.members.map((member, index) => (
                        <tr
                          key={member.userId}
                          className={shellStyles.clickableRow}
                          tabIndex={0}
                          onClick={() => router.push(`/admin/users/${member.userId}`)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              router.push(`/admin/users/${member.userId}`);
                            }
                          }}
                        >
                          <td><span className={shellStyles.tableValue}>{index + 1}</span></td>
                          <td>
                            <div className={shellStyles.mapCell}>
                              <div className={shellStyles.mapCellText}>
                                <strong className={shellStyles.tableClamp}>{member.fullName || "No name set"}</strong>
                                <span className={shellStyles.tableClamp}>{member.email || "-"}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className={shellStyles.tableValue}>{member.role}</span></td>
                          <td><span className={shellStyles.tableValue}>{member.departmentName || "-"}</span></td>
                          <td><span className={shellStyles.tableValue}>{member.siteName || "-"}</span></td>
                          <td><span className={shellStyles.tableWrapText}>{member.leaderName || member.leaderEmail || "-"}</span></td>
                          <td><span className={shellStyles.tableValue}>{member.inviteStatus}</span></td>
                          <td onClick={(event) => event.stopPropagation()}>
                            <div className={shellStyles.actionButtons}>
                              <button
                                type="button"
                                className={shellStyles.actionButton}
                                onClick={() => openEditMemberModal(member)}
                                aria-label="Edit member"
                                title="Edit member"
                              >
                                <Image src="/icons/edit.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                              </button>
                              {member.inviteStatus === "invited" || member.inviteStatus === "draft" ? (
                                <button
                                  type="button"
                                  className={shellStyles.actionButton}
                                  onClick={() => void handleResendInvite(member)}
                                  disabled={resendingInviteFor === member.userId}
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
            </section>

            <section className={shellStyles.adminDetailSection}>
              <div className={shellStyles.adminDetailHeader}>
                <div className={shellStyles.adminDetailTitleGroup}>
                  <h2>Pending and historical invites</h2>
                  <p>Invite lifecycle records linked to this organisation.</p>
                </div>
              </div>
              <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
                <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Invited</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.invites.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={shellStyles.tableStateCell}>
                          <div className={shellStyles.tableEmptyState}>No invite records yet.</div>
                        </td>
                      </tr>
                    ) : (
                      detail.invites.map((invite, index) => (
                        <tr key={invite.id}>
                          <td><span className={shellStyles.tableValue}>{index + 1}</span></td>
                          <td><span className={shellStyles.tableWrapText}>{invite.fullName || "-"}</span></td>
                          <td><span className={shellStyles.tableWrapText}>{invite.email}</span></td>
                          <td><span className={shellStyles.tableValue}>{invite.role}</span></td>
                          <td><span className={shellStyles.tableValue}>{invite.status}</span></td>
                          <td><span className={shellStyles.tableDate}>{formatDateTime(invite.invitedAt)}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
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
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>Link existing user</h3>
                </div>
              </div>
              <button
                type="button"
                className={shellStyles.adminWizardClose}
                onClick={() => setLinkModalOpen(false)}
                aria-label="Close link existing user modal"
              >
                x
              </button>
            </div>
            <p className={shellStyles.modalText}>Search users that are not already linked to this organisation, then attach them directly.</p>
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
                  <span>Search users</span>
                  <input
                    className={shellStyles.input}
                    value={linkSearch}
                    onChange={(event) => setLinkSearch(event.target.value)}
                    placeholder="Search by name, email, or existing organisations"
                  />
                </label>
              </div>
            </div>
            {linkError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{linkError}</p> : null}
            <div className={shellStyles.modalListWrap}>
              <div className={shellStyles.adminSearchResults}>
                {linkOptionsLoading ? (
                  <div className={shellStyles.adminSearchState}>Loading users...</div>
                ) : eligibleUsers.length === 0 ? (
                  <div className={shellStyles.adminSearchState}>No eligible users match this search.</div>
                ) : (
                  eligibleUsers.map((user) => (
                    <div key={user.id} className={shellStyles.adminSearchResultRow}>
                      <div className={shellStyles.adminSearchResultCopy}>
                        <strong>{user.fullName || "No name set"}</strong>
                        <span>{user.email || user.id}</span>
                      </div>
                      <button
                        type="button"
                        className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                        onClick={() => void handleLinkUser(user.id)}
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

      {editMember ? (
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
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>Edit member</h3>
                </div>
              </div>
              <button
                type="button"
                className={shellStyles.adminWizardClose}
                onClick={() => setEditMember(null)}
                aria-label="Close edit member modal"
              >
                x
              </button>
            </div>
            <p className={shellStyles.modalText}>
              Update <strong>{editMember.fullName || editMember.email || "this user"}</strong> for this organisation.
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
                    {detail?.departments.map((department) => (
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
                    {detail?.sites.map((site) => (
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
                    {editableLeaderOptions.map((member) => (
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
                onClick={() => setEditMember(null)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => void handleEditMember()}
                disabled={editSubmitting}
              >
                {editSubmitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkCreateModalOpen ? (
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
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>Bulk create users</h3>
                </div>
              </div>
              <button
                type="button"
                className={shellStyles.adminWizardClose}
                onClick={() => setBulkCreateModalOpen(false)}
                aria-label="Close bulk create users modal"
              >
                x
              </button>
            </div>
            <p className={shellStyles.modalText}>
              Add one person per line using <strong>Full Name, email@example.com</strong> or <strong>Full Name &lt;email@example.com&gt;</strong>.
            </p>
            <div className={shellStyles.modalListWrap}>
              <div className={shellStyles.adminModalStack}>
                <label className={shellStyles.accountField}>
                  <span>Role</span>
                  <select className={shellStyles.input} value={bulkCreateRole} onChange={(event) => setBulkCreateRole(event.target.value as "org_admin" | "general_user")}>
                    <option value="general_user">General user</option>
                    <option value="org_admin">Org admin</option>
                  </select>
                </label>
                <label className={shellStyles.accountField}>
                  <span>Users</span>
                  <textarea
                    className={`${shellStyles.input} ${shellStyles.reportScopeTextarea}`}
                    rows={10}
                    value={bulkCreateInput}
                    onChange={(event) => setBulkCreateInput(event.target.value)}
                    placeholder={"Jane Citizen, jane@example.com\nAlex Example <alex@example.com>"}
                  />
                </label>
              </div>
            </div>
            {bulkCreateError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{bulkCreateError}</p> : null}
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setBulkCreateModalOpen(false)}
                disabled={bulkCreateSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => void handleBulkCreateUsers()}
                disabled={bulkCreateSubmitting}
              >
                {bulkCreateSubmitting ? "Creating..." : "Create users"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {structureModalOpen ? (
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
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>
                    {structureModalOpen.mode === "create" ? "Add" : "Edit"} {structureModalOpen.kind}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className={shellStyles.adminWizardClose}
                onClick={() => setStructureModalOpen(null)}
                aria-label="Close structure modal"
              >
                x
              </button>
            </div>
            <p className={shellStyles.modalText}>
              {structureModalOpen.mode === "create"
                ? `Add multiple ${structureModalOpen.kind}s at once using one name per line or comma separated values.`
                : `Rename this ${structureModalOpen.kind}.`}
            </p>
            <div className={shellStyles.modalListWrap}>
              <div className={shellStyles.adminModalStack}>
                <label className={shellStyles.accountField}>
                  <span>{structureModalOpen.mode === "create" ? "Names" : "Name"}</span>
                  {structureModalOpen.mode === "create" ? (
                    <textarea
                      className={`${shellStyles.input} ${shellStyles.reportScopeTextarea}`}
                      rows={6}
                      value={structureNamesInput}
                      onChange={(event) => setStructureNamesInput(event.target.value)}
                      placeholder={
                        structureModalOpen.kind === "department"
                          ? "Operations\nField Team\nQuality"
                          : "Perth Office\nWarehouse\nRemote"
                      }
                    />
                  ) : (
                    <input className={shellStyles.input} value={structureName} onChange={(event) => setStructureName(event.target.value)} />
                  )}
                </label>
              </div>
            </div>
            {structureError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{structureError}</p> : null}
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setStructureModalOpen(null)}
                disabled={structureSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => void handleSaveStructureItem()}
                disabled={structureSubmitting}
              >
                {structureSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
