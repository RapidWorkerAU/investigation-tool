"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import { isPlatformAdminEmail } from "@/lib/platformAdmin";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";

type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  organisations: string[];
};

type OrganisationOption = {
  id: string;
  name: string;
};

type OrganisationDetailOption = {
  id: string;
  name: string;
};

type OrganisationMemberOption = {
  userId: string;
  fullName: string;
  email: string;
};

type OrganisationDetailPayload = {
  departments: OrganisationDetailOption[];
  sites: OrganisationDetailOption[];
  members: OrganisationMemberOption[];
};

type BulkDeleteUsersResponse = {
  deletedIds?: string[];
  failures?: Array<{ userId: string; error: string }>;
  error?: string;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Australia/Perth",
  }).format(new Date(value));

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [organisationOptions, setOrganisationOptions] = useState<OrganisationOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState("");
  const [organisationDetail, setOrganisationDetail] = useState<OrganisationDetailPayload>({
    departments: [],
    sites: [],
    members: [],
  });
  const [loadingOrganisationDetail, setLoadingOrganisationDetail] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"org_admin" | "general_user">("general_user");
  const [departmentId, setDepartmentId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [leaderUserId, setLeaderUserId] = useState("");

  const allSelected = users.length > 0 && selectedUserIds.length === users.length;

  const loadUsers = async (accessToken: string) => {
    const response = await fetch("/api/admin/users/list", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await response.json()) as { users?: AdminUserRow[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load users.");
    }

    const nextUsers = payload.users ?? [];
    setUsers(nextUsers);
    setSelectedUserIds((current) => current.filter((userId) => nextUsers.some((user) => user.id === userId)));
  };

  const loadOrganisations = async (accessToken: string) => {
    const response = await fetch("/api/admin/organisations/list", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await response.json()) as {
      organisations?: Array<{ id: string; name: string }>;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load organisations.");
    }

    setOrganisationOptions((payload.organisations ?? []).map((organisation) => ({
      id: organisation.id,
      name: organisation.name,
    })));
  };

  const loadOrganisationDetail = async (organisationId: string, accessToken: string) => {
    if (!organisationId) {
      setOrganisationDetail({ departments: [], sites: [], members: [] });
      return;
    }

    setLoadingOrganisationDetail(true);
    try {
      const response = await fetch(`/api/admin/organisations/${organisationId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = (await response.json()) as {
        departments?: OrganisationDetailOption[];
        sites?: OrganisationDetailOption[];
        members?: OrganisationMemberOption[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load organisation details.");
      }

      setOrganisationDetail({
        departments: payload.departments ?? [],
        sites: payload.sites ?? [],
        members: payload.members ?? [],
      });
    } finally {
      setLoadingOrganisationDetail(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          router.push("/login?returnTo=%2Fadmin%2Fusers");
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
          router.push("/login?returnTo=%2Fadmin%2Fusers");
          return;
        }

        await Promise.all([loadUsers(session.access_token), loadOrganisations(session.access_token)]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [router, supabase]);

  const resetInviteForm = () => {
    setInviteModalOpen(false);
    setInviteSubmitting(false);
    setInviteError(null);
    setSelectedOrganisationId("");
    setOrganisationDetail({ departments: [], sites: [], members: [] });
    setEmail("");
    setFullName("");
    setRole("general_user");
    setDepartmentId("");
    setSiteId("");
    setLeaderUserId("");
  };

  const handleOrganisationChange = async (organisationId: string) => {
    setSelectedOrganisationId(organisationId);
    setDepartmentId("");
    setSiteId("");
    setLeaderUserId("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return;
    }

    try {
      await loadOrganisationDetail(organisationId, session.access_token);
    } catch (detailError) {
      setInviteError(detailError instanceof Error ? detailError.message : "Unable to load organisation options.");
    }
  };

  const handleInviteUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteSubmitting(true);
    setInviteError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          organisationId: selectedOrganisationId,
          email,
          fullName,
          role,
          departmentId: departmentId || null,
          siteId: siteId || null,
          leaderUserId: leaderUserId || null,
        }),
      });

      const payload = (await response.json()) as { invitedUserId?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to invite user.");
      }

      await loadUsers(session.access_token);
      resetInviteForm();

      if (payload.invitedUserId) {
        router.push(`/admin/users/${payload.invitedUserId}`);
      }
    } catch (submitError) {
      setInviteError(submitError instanceof Error ? submitError.message : "Unable to invite user.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You are no longer signed in.");
      }

      const response = await fetch("/api/admin/users/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userIds: selectedUserIds,
        }),
      });

      const payload = (await response.json()) as BulkDeleteUsersResponse;
      if (!response.ok && !(payload.deletedIds?.length || payload.failures?.length)) {
        throw new Error(payload.error || "Unable to bulk delete users.");
      }

      await loadUsers(session.access_token);
      setSelectedUserIds((current) => current.filter((userId) => !(payload.deletedIds ?? []).includes(userId)));
      setBulkDeleteModalOpen(false);

      if (payload.failures?.length) {
        setError(
          `Deleted ${(payload.deletedIds ?? []).length} user${(payload.deletedIds ?? []).length === 1 ? "" : "s"}. ` +
            `${payload.failures.length} failed: ${payload.failures.map((failure) => failure.userId).join(", ")}`
        );
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to bulk delete users.");
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardPageSkeleton
        mode="admin"
        activeNav="admin-users"
        eyebrow="Admin"
        title="Users"
        subtitle="View all registered users and their organisation assignments."
        rows={6}
        columns="8% 6% 24% 24% 20% 18%"
        showToolbar
      />
    );
  }

  return (
    <DashboardShell
      mode="admin"
      activeNav="admin-users"
      eyebrow="Admin"
      title="Users"
      subtitle="View all registered users and their organisation assignments."
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
        {!authorized ? (
          <p className={`${shellStyles.message} ${shellStyles.messageError}`}>This page is restricted to the admin account.</p>
        ) : (
          <>
            <div className={shellStyles.tableToolbar}>
              <span title={!selectedUserIds.length ? "Select one or more users to bulk delete." : undefined}>
                <button
                  type="button"
                  className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.bulkDeleteButton}`}
                  onClick={() => setBulkDeleteModalOpen(true)}
                  disabled={!selectedUserIds.length || bulkDeleting}
                >
                  <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.buttonIconDanger} />
                  Bulk Delete
                </button>
              </span>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => setInviteModalOpen(true)}
              >
                Invite user
              </button>
            </div>

            <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
              <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                <colgroup>
                  <col style={{ width: "6%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input
                        className={shellStyles.tableCheckbox}
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => setSelectedUserIds(allSelected ? [] : users.map((user) => user.id))}
                        aria-label="Select all users"
                      />
                    </th>
                    <th>#</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Organisations</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={shellStyles.tableStateCell}>
                        <div className={shellStyles.tableEmptyState}>No users have been found yet.</div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr
                        key={user.id}
                        className={shellStyles.clickableRow}
                        tabIndex={0}
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/admin/users/${user.id}`);
                          }
                        }}
                      >
                        <td onClick={(event) => event.stopPropagation()}>
                          <input
                            className={shellStyles.tableCheckbox}
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={(event) =>
                              setSelectedUserIds((current) =>
                                event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id)
                              )
                            }
                            aria-label={`Select ${user.fullName || user.email || user.id}`}
                          />
                        </td>
                        <td><span className={shellStyles.tableValue}>{index + 1}</span></td>
                        <td>
                          <div className={shellStyles.mapCell}>
                            <div className={shellStyles.mapCellText}>
                              <strong className={shellStyles.tableClamp}>{user.fullName || "No name set"}</strong>
                              <span className={shellStyles.tableClamp}>{user.id}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className={shellStyles.tableWrapText}>{user.email || "-"}</span></td>
                        <td>
                          <span className={shellStyles.tableWrapText}>
                            {user.organisations.length ? user.organisations.join(", ") : "Unassigned"}
                          </span>
                        </td>
                        <td><span className={shellStyles.tableDate}>{formatDateTime(user.createdAt)}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={shellStyles.dashboardMobileList}>
              {users.length === 0 ? (
                <div className={shellStyles.dashboardMobileState}>No users have been found yet.</div>
              ) : (
                users.map((user, index) => (
                  <article
                    key={`mobile-${user.id}`}
                    className={shellStyles.dashboardMobileCard}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <div className={shellStyles.dashboardMobileCardHeader}>
                      <label
                        className={shellStyles.dashboardMobileCheckbox}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className={shellStyles.tableCheckbox}
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(event) =>
                            setSelectedUserIds((current) =>
                              event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id)
                            )
                          }
                          aria-label={`Select ${user.fullName || user.email || user.id}`}
                        />
                      </label>
                      <div className={shellStyles.dashboardMobileCardTitleBlock}>
                        <strong>{index + 1}. {user.fullName || "No name set"}</strong>
                        <span>{user.email || "-"}</span>
                      </div>
                    </div>
                    <dl className={shellStyles.dashboardMobileMeta}>
                      <div>
                        <dt>Organisations</dt>
                        <dd>{user.organisations.length ? user.organisations.join(", ") : "Unassigned"}</dd>
                      </div>
                      <div className={shellStyles.dashboardMobileMetaDate}>
                        <dt>Joined</dt>
                        <dd>{formatDateTime(user.createdAt)}</dd>
                      </div>
                    </dl>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </section>

      {inviteModalOpen ? (
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
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>Invite organisation user</h3>
                </div>
              </div>
            </div>
            <p className={shellStyles.modalText}>Create a managed account record and send the invite email used for password setup.</p>
            <form onSubmit={handleInviteUser}>
              <div className={shellStyles.adminModalStack}>
                <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                  <span>Organisation</span>
                  <select
                    className={shellStyles.input}
                    value={selectedOrganisationId}
                    onChange={(event) => void handleOrganisationChange(event.target.value)}
                    required
                  >
                    <option value="">Select organisation</option>
                    {organisationOptions.map((organisation) => (
                      <option key={organisation.id} value={organisation.id}>
                        {organisation.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                  <span>Role</span>
                  <select className={shellStyles.input} value={role} onChange={(event) => setRole(event.target.value as "org_admin" | "general_user")}>
                    <option value="general_user">General user</option>
                    <option value="org_admin">Org admin</option>
                  </select>
                </label>
                <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                  <span>Full name</span>
                  <input className={shellStyles.input} value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                </label>
                <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                  <span>Email</span>
                  <input className={shellStyles.input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
                <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                  <span>Department</span>
                  <select className={shellStyles.input} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} disabled={!selectedOrganisationId || loadingOrganisationDetail}>
                    <option value="">No department</option>
                    {organisationDetail.departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                  <span>Site</span>
                  <select className={shellStyles.input} value={siteId} onChange={(event) => setSiteId(event.target.value)} disabled={!selectedOrganisationId || loadingOrganisationDetail}>
                    <option value="">No site</option>
                    {organisationDetail.sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={`${shellStyles.accountField} ${shellStyles.adminCompactField}`}>
                  <span>Leader</span>
                  <select className={shellStyles.input} value={leaderUserId} onChange={(event) => setLeaderUserId(event.target.value)} disabled={!selectedOrganisationId || loadingOrganisationDetail}>
                    <option value="">No leader</option>
                    {organisationDetail.members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.fullName || member.email}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {inviteError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{inviteError}</p> : null}
              <div className={shellStyles.modalActions}>
                <button type="button" className={`${shellStyles.button} ${shellStyles.buttonSecondary}`} onClick={resetInviteForm} disabled={inviteSubmitting}>
                  Cancel
                </button>
                <button type="submit" className={`${shellStyles.button} ${shellStyles.buttonAccent}`} disabled={inviteSubmitting}>
                  {inviteSubmitting ? "Sending invite..." : "Send invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {bulkDeleteModalOpen ? (
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
                  <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>Bulk delete users</h3>
                </div>
              </div>
            </div>
            <p className={shellStyles.modalText}>
              Delete {selectedUserIds.length} selected user{selectedUserIds.length === 1 ? "" : "s"} and remove their managed account data.
            </p>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={bulkDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonDanger}`}
                onClick={() => void handleBulkDelete()}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? "Deleting..." : "Delete users"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
