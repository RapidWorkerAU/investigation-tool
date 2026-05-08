"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import DashboardTableFooter from "@/components/dashboard/DashboardTableFooter";
import { fetchAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import type { LeadAccessHistoryRow, LeadMapCampaign } from "@/lib/leadAccess";

const platformAdminUserId = "420266a0-2087-4f36-8c28-340443dd1a82";
const pageSize = 7;

type GeneratedCodeResult = {
  campaignTitle: string;
  accessLink: string;
  code: string;
  email: string;
  generatedAt: string | null;
};

type AdminListResponse = {
  campaigns: LeadMapCampaign[];
  history: LeadAccessHistoryRow[];
  error?: string;
};

type ApiErrorResponse = {
  error?: string;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function LeadAccessAdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [portalReady, setPortalReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [campaigns, setCampaigns] = useState<LeadMapCampaign[]>([]);
  const [history, setHistory] = useState<LeadAccessHistoryRow[]>([]);
  const [page, setPage] = useState(1);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCodeIds, setSelectedCodeIds] = useState<string[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createCampaignSlug, setCreateCampaignSlug] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createNote, setCreateNote] = useState("");
  const [createModalError, setCreateModalError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<GeneratedCodeResult | null>(null);

  const [pendingDeleteRow, setPendingDeleteRow] = useState<LeadAccessHistoryRow | null>(null);
  const [deleteSubmittingId, setDeleteSubmittingId] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [pendingResetRow, setPendingResetRow] = useState<LeadAccessHistoryRow | null>(null);
  const [resetSubmittingId, setResetSubmittingId] = useState<string | null>(null);
  const [resetModalError, setResetModalError] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<GeneratedCodeResult | null>(null);

  const [copied, setCopied] = useState<"create-link" | "create-code" | "reset-link" | "reset-code" | null>(null);

  const loadAdminData = useCallback(async (accessToken: string) => {
    const response = await fetch("/api/lead-access/admin/list", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await response.json()) as AdminListResponse;
    if (!response.ok) {
      throw new Error(data.error || "Unable to load lead access data.");
    }

    setCampaigns(data.campaigns);
    setHistory(data.history);
    setSelectedCodeIds((current) => current.filter((id) => data.history.some((row) => row.id === id)));
    setCreateCampaignSlug((current) => current || data.campaigns[0]?.slug || "");
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          router.push("/login?returnTo=%2Flead-access");
          return;
        }

        setCurrentUserEmail(user.email ?? null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          router.push("/login?returnTo=%2Flead-access");
          return;
        }

        const nextAccessState = await fetchAccessState(session.access_token);

        const isAdmin = user.id === platformAdminUserId || nextAccessState.userId === platformAdminUserId;
        setAuthorized(isAdmin);

        if (isAdmin) {
          await loadAdminData(session.access_token);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load lead access codes.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadAdminData, router, supabase]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
    setPage((current) => Math.min(current, totalPages));
  }, [history.length]);

  const totalPages = Math.max(1, Math.ceil(history.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = history.slice((safePage - 1) * pageSize, safePage * pageSize);

  const selectedCampaign = campaigns.find((campaign) => campaign.slug === createCampaignSlug) ?? null;
  const selectedRows = useMemo(
    () => history.filter((row) => selectedCodeIds.includes(row.id)),
    [history, selectedCodeIds]
  );
  const allSelected = history.length > 0 && selectedCodeIds.length === history.length;

  const renderViewportModal = (content: ReactNode) =>
    portalReady && content ? createPortal(content, document.body) : null;

  const renderBrandedModalHeader = (
    title: string,
    eyebrow = "Investigation Tool",
    onClose?: () => void
  ) => (
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
          <span className={shellStyles.dashboardModalEyebrow}>{eyebrow}</span>
          <h3 className={`${shellStyles.modalTitle} ${shellStyles.dashboardModalTitle}`}>{title}</h3>
        </div>
      </div>
      {onClose ? (
        <button
          type="button"
          className={shellStyles.mobileModalClose}
          onClick={onClose}
        >
          Close
        </button>
      ) : null}
    </div>
  );

  async function withAccessToken<T>(callback: (accessToken: string) => Promise<T>) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push("/login?returnTo=%2Flead-access");
      throw new Error("You are no longer signed in.");
    }
    return callback(session.access_token);
  }

  async function handleGenerateCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateSubmitting(true);
    setCreateModalError(null);

    try {
      const data = await withAccessToken(async (accessToken) => {
        const response = await fetch("/api/lead-access/admin/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            slug: createCampaignSlug,
            email: createEmail,
            note: createNote,
          }),
        });

        const payload = (await response.json()) as GeneratedCodeResult & ApiErrorResponse;
        if (!response.ok) {
          throw new Error(payload.error || "Unable to generate a lead access code.");
        }

        await loadAdminData(accessToken);
        return payload;
      });

      setCreateResult({
        campaignTitle: data.campaignTitle,
        accessLink: data.accessLink,
        code: data.code,
        email: data.email,
        generatedAt: data.generatedAt,
      });
    } catch (submitError) {
      setCreateModalError(submitError instanceof Error ? submitError.message : "Unable to generate a lead access code.");
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleDeleteCode(row: LeadAccessHistoryRow) {
    setDeleteSubmittingId(row.id);
    setError(null);

    try {
      await withAccessToken(async (accessToken) => {
        const response = await fetch("/api/lead-access/admin/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ codeId: row.id }),
        });

        const payload = (await response.json()) as ApiErrorResponse;
        if (!response.ok) {
          throw new Error(payload.error || "Unable to delete lead access code.");
        }

        await loadAdminData(accessToken);
      });

      setSelectedCodeIds((current) => current.filter((id) => id !== row.id));
      setPendingDeleteRow(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete lead access code.");
    } finally {
      setDeleteSubmittingId(null);
    }
  }

  async function handleResetCode() {
    if (!pendingResetRow) return;

    setResetSubmittingId(pendingResetRow.id);
    setResetModalError(null);

    try {
      const data = await withAccessToken(async (accessToken) => {
        const response = await fetch("/api/lead-access/admin/reset", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ codeId: pendingResetRow.id }),
        });

        const payload = (await response.json()) as GeneratedCodeResult & ApiErrorResponse;
        if (!response.ok) {
          throw new Error(payload.error || "Unable to reset this lead access code.");
        }

        await loadAdminData(accessToken);
        return payload;
      });

      setResetResult({
        campaignTitle: data.campaignTitle,
        accessLink: data.accessLink,
        code: data.code,
        email: data.email,
        generatedAt: data.generatedAt,
      });
    } catch (resetError) {
      setResetModalError(resetError instanceof Error ? resetError.message : "Unable to reset this lead access code.");
    } finally {
      setResetSubmittingId(null);
    }
  }

  async function handleBulkDelete() {
    if (!selectedRows.length) return;

    setBulkDeleting(true);
    setError(null);

    try {
      await withAccessToken(async (accessToken) => {
        const response = await fetch("/api/lead-access/admin/bulk-delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ codeIds: selectedRows.map((row) => row.id) }),
        });

        const payload = (await response.json()) as ApiErrorResponse;
        if (!response.ok) {
          throw new Error(payload.error || "Unable to delete selected lead access codes.");
        }

        await loadAdminData(accessToken);
      });

      setSelectedCodeIds([]);
      setShowBulkDeleteModal(false);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete selected lead access codes.");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleCopy(kind: "create-link" | "create-code" | "reset-link" | "reset-code", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => {
        setCopied((current) => (current === kind ? null : current));
      }, 1500);
    } catch {
      setError("Unable to copy to clipboard.");
    }
  }

  function getStatusLabel(row: LeadAccessHistoryRow) {
    if (row.redeemed_at) return "Redeemed";
    if (row.revoked_at) return "Revoked";
    return "Pending";
  }

  function resetCreateModal() {
    setShowCreateModal(false);
    setCreateSubmitting(false);
    setCreateModalError(null);
    setCreateResult(null);
    setCreateEmail("");
    setCreateNote("");
    setCopied((current) => (current?.startsWith("create") ? null : current));
  }

  function openCreateModal() {
    setCreateModalError(null);
    setCreateResult(null);
    setCreateEmail("");
    setCreateNote("");
    setShowCreateModal(true);
  }

  if (loading) {
    return (
      <DashboardPageSkeleton
        mode="admin"
        activeNav="lead-access"
        eyebrow="Platform Admin"
        title="Lead Access Codes"
        subtitle="Create, reset, and remove guest access codes tied to a specific email."
        rows={5}
        columns="4% 18% 22% 10% 10% 13% 13% 11%"
        showToolbar
      />
    );
  }

  return (
    <DashboardShell
      mode="admin"
      activeNav="lead-access"
      eyebrow="Platform Admin"
      title="Lead Access Codes"
      subtitle="Create, reset, and remove guest access codes tied to a specific email."
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
        <div className={shellStyles.tableToolbar}>
          <span title={!selectedRows.length ? "Select one or more access codes to bulk delete." : undefined}>
            <button
              type="button"
              className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.bulkDeleteButton}`}
              disabled={!selectedRows.length || bulkDeleting}
              onClick={() => setShowBulkDeleteModal(true)}
            >
              <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.buttonIconDanger} />
              Bulk Delete
            </button>
          </span>
          <button
            type="button"
            className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
            onClick={openCreateModal}
            disabled={loading || !authorized || campaigns.length === 0}
          >
            <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={`${shellStyles.actionIcon} ${shellStyles.actionIconWhite}`} />
            Add Access Code
          </button>
        </div>

        {error ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p> : null}
        {!loading && !authorized ? (
          <p className={`${shellStyles.message} ${shellStyles.messageError}`}>This page is restricted to the platform admin account.</p>
        ) : null}

        {!loading && authorized ? (
          <>
            <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
              <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                <colgroup>
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input
                        className={shellStyles.tableCheckbox}
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => setSelectedCodeIds(allSelected ? [] : history.map((row) => row.id))}
                        aria-label="Select all access codes"
                      />
                    </th>
                    <th>Campaign</th>
                    <th>Email</th>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Generated date</th>
                    <th>Redeemed date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={shellStyles.tableStateCell}>
                        <div className={shellStyles.tableEmptyState}>No lead access codes have been generated yet.</div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            className={shellStyles.tableCheckbox}
                            type="checkbox"
                            checked={selectedCodeIds.includes(row.id)}
                            onChange={() =>
                              setSelectedCodeIds((current) =>
                                current.includes(row.id) ? current.filter((id) => id !== row.id) : [...current, row.id]
                              )
                            }
                            aria-label={`Select ${row.reserved_email || row.redeemed_email || row.id}`}
                          />
                        </td>
                        <td>
                          <div className={shellStyles.mapCell}>
                            <div className={shellStyles.mapCellText}>
                              <strong className={shellStyles.tableClamp}>{row.campaign_title}</strong>
                              <span className={shellStyles.tableClamp}>{row.campaign_slug}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={shellStyles.mapCell}>
                            <div className={shellStyles.mapCellText}>
                              <strong className={shellStyles.tableClamp}>{row.reserved_email || row.redeemed_email || "-"}</strong>
                              <span className={shellStyles.tableClamp}>{row.note?.trim() || "No note provided"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={shellStyles.tableValue}>****{row.code_last4 || "----"}</span>
                        </td>
                        <td>
                          <span className={shellStyles.tableValue}>{getStatusLabel(row)}</span>
                        </td>
                        <td>
                          <span className={shellStyles.tableDate}>{formatDateTime(row.generated_at)}</span>
                        </td>
                        <td>
                          <span className={shellStyles.tableDate}>{row.redeemed_at ? formatDateTime(row.redeemed_at) : "-"}</span>
                        </td>
                        <td>
                          <div className={shellStyles.actionButtons}>
                            <button
                              type="button"
                              className={shellStyles.actionButton}
                              onClick={() => {
                                setResetModalError(null);
                                setResetResult(null);
                                setPendingResetRow(row);
                              }}
                              aria-label="Reset lead access code"
                              title="Reset lead access code"
                            >
                              <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                            </button>
                            <button
                              type="button"
                              className={`${shellStyles.actionButton} ${shellStyles.actionButtonDanger}`}
                              onClick={() => setPendingDeleteRow(row)}
                              aria-label="Delete lead access code"
                              title="Delete lead access code"
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

            <div className={shellStyles.dashboardMobileList}>
              {history.length === 0 ? (
                <div className={shellStyles.dashboardMobileState}>No lead access codes have been generated yet.</div>
              ) : (
                paginatedRows.map((row) => (
                  <article key={`mobile-${row.id}`} className={shellStyles.dashboardMobileCard}>
                    <div className={shellStyles.dashboardMobileCardHeader}>
                      <label className={shellStyles.dashboardMobileCheckbox}>
                        <input
                          type="checkbox"
                          className={shellStyles.tableCheckbox}
                          aria-label={`Select ${row.reserved_email || row.redeemed_email || row.id}`}
                          checked={selectedCodeIds.includes(row.id)}
                          onChange={(event) => {
                            setSelectedCodeIds((current) =>
                              event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id)
                            );
                          }}
                        />
                      </label>
                      <div className={shellStyles.dashboardMobileCardTitleBlock}>
                        <strong>{row.reserved_email || row.redeemed_email || "-"}</strong>
                        <span>{row.campaign_title}</span>
                      </div>
                      <span className={shellStyles.dashboardMobileChevron} aria-hidden="true">
                        ****{row.code_last4 || "----"}
                      </span>
                    </div>
                    <dl className={shellStyles.dashboardMobileMeta}>
                      <div>
                        <dt>Status</dt>
                        <dd>{getStatusLabel(row)}</dd>
                      </div>
                      <div className={shellStyles.dashboardMobileMetaDate}>
                        <dt>Generated</dt>
                        <dd>{formatDateTime(row.generated_at)}</dd>
                      </div>
                      <div className={shellStyles.dashboardMobileMetaDate}>
                        <dt>Redeemed</dt>
                        <dd>{row.redeemed_at ? formatDateTime(row.redeemed_at) : "-"}</dd>
                      </div>
                    </dl>
                    <div className={shellStyles.dashboardMobileActions}>
                      <button
                        type="button"
                        className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.dashboardMobileActionButton}`}
                        onClick={() => {
                          setResetModalError(null);
                          setResetResult(null);
                          setPendingResetRow(row);
                        }}
                      >
                        <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                        Reset
                      </button>
                      <button
                        type="button"
                        className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.dashboardMobileActionButton}`}
                        onClick={() => setPendingDeleteRow(row)}
                      >
                        <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <DashboardTableFooter
              total={history.length}
              page={safePage}
              pageSize={pageSize}
              onPageChange={setPage}
              label="access codes"
            />
          </>
        ) : null}
      </section>

      {renderViewportModal(showCreateModal ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader(
              createResult ? "Access code generated" : "Add access code",
              "Investigation Tool",
              () => {
                if (createSubmitting) return;
                resetCreateModal();
              }
            )}
            {!createResult ? (
              <form onSubmit={handleGenerateCode}>
                <p className={shellStyles.modalText}>
                  Create a unique lead access code for a specific email address. The generated code will only redeem for that email.
                </p>
                <div className={`${shellStyles.modalListWrap} ${shellStyles.reportScopeForm}`}>
                  <label className={shellStyles.accountField}>
                    <span>Campaign</span>
                    <select
                      value={createCampaignSlug}
                      onChange={(event) => setCreateCampaignSlug(event.target.value)}
                      className={shellStyles.input}
                      required
                    >
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.slug}>
                          {campaign.title} ({campaign.slug})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={shellStyles.accountField}>
                    <span>Email</span>
                    <input
                      type="email"
                      value={createEmail}
                      onChange={(event) => setCreateEmail(event.target.value)}
                      className={shellStyles.input}
                      placeholder="person@example.com"
                      required
                    />
                  </label>
                  <label className={`${shellStyles.accountField} ${shellStyles.reportScopeFieldFull}`}>
                    <span>Note</span>
                    <textarea
                      value={createNote}
                      onChange={(event) => setCreateNote(event.target.value)}
                      className={`${shellStyles.input} ${shellStyles.reportScopeTextarea}`}
                      placeholder="Optional note about the requester or source"
                      rows={4}
                    />
                  </label>
                  {selectedCampaign ? (
                    <p className={shellStyles.modalText}>
                      Link: <strong>/case-study/{selectedCampaign.slug}</strong>
                    </p>
                  ) : null}
                </div>
                {createModalError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{createModalError}</p> : null}
                <div className={shellStyles.modalActions}>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={resetCreateModal}
                    disabled={createSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                    disabled={createSubmitting}
                  >
                    {createSubmitting ? "Generating..." : "Generate code"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className={shellStyles.modalText}>
                  Share the access link and this code with <strong>{createResult.email}</strong>. The plaintext code is shown only here.
                </p>
                <div className="px-6 pb-2 pt-1 text-sm text-slate-700">
                  <div className="space-y-4">
                    <div>
                      <div className="text-[0.73rem] font-bold uppercase tracking-[0.08em] text-slate-500">Campaign</div>
                      <div className="mt-1 font-semibold text-slate-900">{createResult.campaignTitle}</div>
                    </div>
                    <div>
                      <div className="text-[0.73rem] font-bold uppercase tracking-[0.08em] text-slate-500">Access Link</div>
                      <div className="mt-1 break-all text-slate-800">{createResult.accessLink}</div>
                    </div>
                    <div>
                      <div className="text-[0.73rem] font-bold uppercase tracking-[0.08em] text-slate-500">Access Code</div>
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-xl font-semibold tracking-[0.08em] text-slate-950">
                        {createResult.code}
                      </div>
                    </div>
                    <div>
                      <div className="text-[0.73rem] font-bold uppercase tracking-[0.08em] text-slate-500">Generated</div>
                      <div className="mt-1 text-slate-800">{formatDateTime(createResult.generatedAt)}</div>
                    </div>
                  </div>
                </div>
                <div className={shellStyles.modalActions}>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={() => void handleCopy("create-link", `${window.location.origin}${createResult.accessLink}`)}
                  >
                    {copied === "create-link" ? "Link copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={() => void handleCopy("create-code", createResult.code)}
                  >
                    {copied === "create-code" ? "Code copied" : "Copy code"}
                  </button>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                    onClick={resetCreateModal}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null)}

      {renderViewportModal(pendingDeleteRow ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader("Delete access code?", "Investigation Tool", () => {
              if (deleteSubmittingId === pendingDeleteRow.id) return;
              setPendingDeleteRow(null);
            })}
            <p className={shellStyles.modalText}>
              You are about to permanently delete the code assigned to <strong>{pendingDeleteRow.reserved_email || pendingDeleteRow.redeemed_email || "this recipient"}</strong>.
            </p>
            <p className={shellStyles.modalText}>
              This removes the code row completely. Any active guest session tied to this code will stop working on the next server check.
            </p>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setPendingDeleteRow(null)}
                disabled={deleteSubmittingId === pendingDeleteRow.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonDanger}`}
                onClick={() => void handleDeleteCode(pendingDeleteRow)}
                disabled={deleteSubmittingId === pendingDeleteRow.id}
              >
                {deleteSubmittingId === pendingDeleteRow.id ? "Deleting..." : "Delete code"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}

      {renderViewportModal(pendingResetRow ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader(
              resetResult ? "Access code reset" : "Reset access code?",
              "Investigation Tool",
              () => {
                if (resetSubmittingId === pendingResetRow.id) return;
                setPendingResetRow(null);
                setResetModalError(null);
                setResetResult(null);
                setCopied((current) => (current?.startsWith("reset") ? null : current));
              }
            )}
            {!resetResult ? (
              <>
                <p className={shellStyles.modalText}>
                  Resetting this code will revoke the current code and issue a new one for <strong>{pendingResetRow.reserved_email || pendingResetRow.redeemed_email || "this recipient"}</strong>.
                </p>
                <p className={shellStyles.modalText}>
                  Use this when the recipient needs another session or you want to invalidate the previous code.
                </p>
                {resetModalError ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{resetModalError}</p> : null}
                <div className={shellStyles.modalActions}>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={() => {
                      setPendingResetRow(null);
                      setResetModalError(null);
                    }}
                    disabled={resetSubmittingId === pendingResetRow.id}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                    onClick={() => void handleResetCode()}
                    disabled={resetSubmittingId === pendingResetRow.id}
                  >
                    {resetSubmittingId === pendingResetRow.id ? "Resetting..." : "Reset code"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={shellStyles.modalText}>
                  A new code has been generated for <strong>{resetResult.email}</strong>. Share the new code and link with them to allow another session.
                </p>
                <div className="px-6 pb-2 pt-1 text-sm text-slate-700">
                  <div className="space-y-4">
                    <div>
                      <div className="text-[0.73rem] font-bold uppercase tracking-[0.08em] text-slate-500">Campaign</div>
                      <div className="mt-1 font-semibold text-slate-900">{resetResult.campaignTitle}</div>
                    </div>
                    <div>
                      <div className="text-[0.73rem] font-bold uppercase tracking-[0.08em] text-slate-500">Access Link</div>
                      <div className="mt-1 break-all text-slate-800">{resetResult.accessLink}</div>
                    </div>
                    <div>
                      <div className="text-[0.73rem] font-bold uppercase tracking-[0.08em] text-slate-500">New Access Code</div>
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-xl font-semibold tracking-[0.08em] text-slate-950">
                        {resetResult.code}
                      </div>
                    </div>
                    <div>
                      <div className="text-[0.73rem] font-bold uppercase tracking-[0.08em] text-slate-500">Generated</div>
                      <div className="mt-1 text-slate-800">{formatDateTime(resetResult.generatedAt)}</div>
                    </div>
                  </div>
                </div>
                <div className={shellStyles.modalActions}>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={() => void handleCopy("reset-link", `${window.location.origin}${resetResult.accessLink}`)}
                  >
                    {copied === "reset-link" ? "Link copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                    onClick={() => void handleCopy("reset-code", resetResult.code)}
                  >
                    {copied === "reset-code" ? "Code copied" : "Copy code"}
                  </button>
                  <button
                    type="button"
                    className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                    onClick={() => {
                      setPendingResetRow(null);
                      setResetModalError(null);
                      setResetResult(null);
                      setCopied((current) => (current?.startsWith("reset") ? null : current));
                    }}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null)}

      {renderViewportModal(showBulkDeleteModal ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader("Delete selected access codes?", "Investigation Tool", () => {
              if (bulkDeleting) return;
              setShowBulkDeleteModal(false);
            })}
            <p className={shellStyles.modalText}>
              This will permanently delete {selectedRows.length} access code{selectedRows.length === 1 ? "" : "s"} from the lead access table.
            </p>
            <p className={shellStyles.modalText}>
              Any active guest session tied to those codes will stop working on the next server check.
            </p>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setShowBulkDeleteModal(false)}
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
                {bulkDeleting ? "Deleting..." : "Delete access codes"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}
    </DashboardShell>
  );
}
