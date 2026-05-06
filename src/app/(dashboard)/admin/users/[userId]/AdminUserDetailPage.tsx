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

type UserDetail = {
  user: {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
  };
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

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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
          <div className={shellStyles.adminDetailPage}>
            <section className={shellStyles.adminDetailSection}>
              <div className={shellStyles.adminDetailHeader}>
                <div className={shellStyles.adminDetailTitleGroup}>
                  <h2>User identity</h2>
                  <p>Base profile information for this account holder.</p>
                </div>
              </div>
              <dl className={shellStyles.adminDetailMetaGrid}>
                <div className={shellStyles.adminDetailMetaItem}>
                  <dt>Full name</dt>
                  <dd>{detail.user.fullName || "No name set"}</dd>
                </div>
                <div className={shellStyles.adminDetailMetaItem}>
                  <dt>Email</dt>
                  <dd>{detail.user.email || "-"}</dd>
                </div>
                <div className={shellStyles.adminDetailMetaItem}>
                  <dt>User id</dt>
                  <dd>{detail.user.id}</dd>
                </div>
                <div className={shellStyles.adminDetailMetaItem}>
                  <dt>Joined platform</dt>
                  <dd>{formatDateTime(detail.user.createdAt)}</dd>
                </div>
              </dl>
            </section>

            <section className={shellStyles.adminDetailSection}>
              <div className={shellStyles.adminDetailHeader}>
                <div className={shellStyles.adminDetailTitleGroup}>
                  <h2>Organisation memberships</h2>
                  <p>Organisation role, status, reporting line, and assignment metadata for this user.</p>
                </div>
                <button
                  type="button"
                  className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                  onClick={() => void openLinkModal()}
                >
                  Link organisation
                </button>
              </div>
              <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
                <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                  <thead>
                    <tr>
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
                        <td colSpan={8} className={shellStyles.tableStateCell}>
                          <div className={shellStyles.tableEmptyState}>This user is not assigned to an organisation yet.</div>
                        </td>
                      </tr>
                    ) : (
                      detail.memberships.map((membership, index) => (
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
                          <td><span className={shellStyles.tableValue}>{index + 1}</span></td>
                          <td>
                            <div className={shellStyles.mapCell}>
                              <div className={shellStyles.mapCellText}>
                                <strong className={shellStyles.tableClamp}>{membership.organisationName}</strong>
                                <span className={shellStyles.tableClamp}>{membership.organisationSlug || membership.organisationId}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className={shellStyles.tableValue}>{membership.role}</span></td>
                          <td><span className={shellStyles.tableValue}>{membership.departmentName || "-"}</span></td>
                          <td><span className={shellStyles.tableValue}>{membership.siteName || "-"}</span></td>
                          <td><span className={shellStyles.tableWrapText}>{membership.leaderName || membership.leaderEmail || "-"}</span></td>
                          <td><span className={shellStyles.tableValue}>{membership.inviteStatus}</span></td>
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
            </section>

            <section className={shellStyles.adminDetailSection}>
              <div className={shellStyles.adminDetailHeader}>
                <div className={shellStyles.adminDetailTitleGroup}>
                  <h2>Direct reports</h2>
                  <p>Other users who currently report to this person inside an organisation.</p>
                </div>
              </div>
              <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
                <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Organisation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.directReports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={shellStyles.tableStateCell}>
                          <div className={shellStyles.tableEmptyState}>No direct reports linked to this user yet.</div>
                        </td>
                      </tr>
                    ) : (
                      detail.directReports.map((report, index) => (
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
                          <td><span className={shellStyles.tableValue}>{index + 1}</span></td>
                          <td><span className={shellStyles.tableWrapText}>{report.fullName || "No name set"}</span></td>
                          <td><span className={shellStyles.tableWrapText}>{report.email || "-"}</span></td>
                          <td><span className={shellStyles.tableWrapText}>{report.organisationName || "-"}</span></td>
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
