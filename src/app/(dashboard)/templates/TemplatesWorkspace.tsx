"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import DashboardTableFooter from "@/components/dashboard/DashboardTableFooter";
import { fetchAccessState, type BillingAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type TemplateRow = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_global: boolean;
  snapshot: Record<string, unknown>;
};

const platformAdminUserId = "420266a0-2087-4f36-8c28-340443dd1a82";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function TemplatesWorkspace() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const pageSize = 7;

  const [loading, setLoading] = useState(true);
  const [openingTemplateId, setOpeningTemplateId] = useState<string | null>(null);
  const [duplicatingTemplateId, setDuplicatingTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [pendingOpenRow, setPendingOpenRow] = useState<TemplateRow | null>(null);
  const [pendingDuplicateRow, setPendingDuplicateRow] = useState<TemplateRow | null>(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<TemplateRow | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<BillingAccessState | null>(null);
  const [expandedMobileTemplateId, setExpandedMobileTemplateId] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [page, setPage] = useState(1);

  const isPlatformAdmin = currentUserId === platformAdminUserId || accessState?.userId === platformAdminUserId;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const loadTemplates = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !session?.access_token) {
      router.push("/login?returnTo=%2Ftemplates");
      return;
    }

    setCurrentUserId(user.id);
    setUserEmail(user.email ?? null);
    const nextAccessState = await fetchAccessState(session.access_token);
    setAccessState(nextAccessState);

    const { data, error: templateError } = await supabase
      .from("investigation_templates")
      .select("id,name,user_id,created_at,updated_at,is_global,snapshot")
      .order("updated_at", { ascending: false });

    if (templateError) throw templateError;

    setRows((data ?? []) as TemplateRow[]);
  }, [router, supabase]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadTemplates();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load templates.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadTemplates]);

  const renderViewportModal = (content: ReactNode) =>
    portalReady && content ? createPortal(content, document.body) : null;

  const renderBrandedModalHeader = (
    title: string,
    eyebrow = "Investigation Tool",
    onClose?: () => void,
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

  const editableRows = useMemo(
    () =>
      rows.filter((row) => {
        if (row.is_global) return isPlatformAdmin;
        return row.user_id === currentUserId;
      }),
    [currentUserId, isPlatformAdmin, rows]
  );

  const selectedEditableRows = useMemo(
    () => editableRows.filter((row) => selectedTemplateIds.includes(row.id)),
    [editableRows, selectedTemplateIds]
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(editableRows.length / pageSize));
    setPage((current) => Math.min(current, totalPages));
  }, [editableRows.length, pageSize]);

  const allSelected = editableRows.length > 0 && selectedEditableRows.length === editableRows.length;
  const totalPages = Math.max(1, Math.ceil(editableRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = editableRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSelected = (templateId: string) => {
    setSelectedTemplateIds((current) =>
      current.includes(templateId) ? current.filter((id) => id !== templateId) : [...current, templateId]
    );
  };

  const buildDuplicateTemplateName = useCallback(
    (name: string, isGlobal: boolean) => {
      const existingNames = new Set(
        rows
          .filter((row) => row.is_global === isGlobal)
          .map((row) => row.name.trim().toLowerCase())
      );
      let attempt = `${name} (Copy)`;
      let counter = 2;
      while (existingNames.has(attempt.trim().toLowerCase())) {
        attempt = `${name} (Copy ${counter})`;
        counter += 1;
      }
      return attempt;
    },
    [rows]
  );

  const handleOpenTemplate = async (row: TemplateRow) => {
    try {
      setOpeningTemplateId(row.id);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc("create_template_editor_map", {
        p_template_id: row.id,
      });

      if (rpcError) throw rpcError;

      const openedRow = Array.isArray(data) ? data[0] : data;
      if (!openedRow?.map_id) {
        throw new Error("Template editor map could not be created.");
      }

      setPendingOpenRow(null);
      router.push(
        `/system-maps/${openedRow.map_id}?templateEditor=1&templateId=${row.id}&templateName=${encodeURIComponent(row.name)}&templateGlobal=${row.is_global ? "1" : "0"}&from=templates`
      );
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "Unable to open template editor.");
    } finally {
      setOpeningTemplateId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedEditableRows.length) return;

    try {
      setDeleting(true);
      setError(null);
      const { data, error: deleteError } = await supabase.rpc("delete_investigation_templates", {
        p_template_ids: selectedEditableRows.map((row) => row.id),
      });

      if (deleteError) throw deleteError;

      const deletedIds = new Set(selectedEditableRows.map((row) => row.id));
      setRows((current) => current.filter((row) => !deletedIds.has(row.id)));
      setSelectedTemplateIds([]);
      setShowBulkDeleteModal(false);
    } catch (deleteErr) {
      setError(deleteErr instanceof Error ? deleteErr.message : "Unable to delete templates.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicateTemplate = async (row: TemplateRow) => {
    try {
      setDuplicatingTemplateId(row.id);
      setError(null);
      const { error: duplicateError } = await supabase.rpc("save_investigation_template", {
        p_name: buildDuplicateTemplateName(row.name, row.is_global),
        p_snapshot: row.snapshot,
        p_template_id: null,
        p_is_global: row.is_global,
      });

      if (duplicateError) throw duplicateError;

      await loadTemplates();
      setPendingDuplicateRow(null);
    } catch (duplicateErr) {
      setError(duplicateErr instanceof Error ? duplicateErr.message : "Unable to duplicate template.");
    } finally {
      setDuplicatingTemplateId(null);
    }
  };

  const handleDeleteTemplate = async (row: TemplateRow) => {
    try {
      setDeletingTemplateId(row.id);
      setError(null);
      const { error: deleteError } = await supabase.rpc("delete_investigation_templates", {
        p_template_ids: [row.id],
      });

      if (deleteError) throw deleteError;

      setRows((current) => current.filter((item) => item.id !== row.id));
      setSelectedTemplateIds((current) => current.filter((id) => id !== row.id));
      setPendingDeleteRow(null);
    } catch (deleteErr) {
      setError(deleteErr instanceof Error ? deleteErr.message : "Unable to delete template.");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  if (loading) {
    return (
      <DashboardPageSkeleton
        activeNav="templates"
        eyebrow="Template Library"
        title="Templates"
        subtitle="Manage saved investigation templates here. Create live investigations from the dashboard when you want to use a template in active work."
        rows={5}
        columns="4% 32% 16% 18% 18% 12%"
      />
    );
  }

  return (
    <DashboardShell
      activeNav="templates"
      eyebrow="Template Library"
      title="Templates"
      subtitle="Manage saved investigation templates here. Create live investigations from the dashboard when you want to use a template in active work."
      headerRight={
        <div className={shellStyles.accountSummary}>
          <div className={shellStyles.accountSummaryText}>
            <div className={shellStyles.accountSummaryPrimary}>
              <span className={shellStyles.accountSummaryLabel}>My account</span>
              <strong>{userEmail ?? "Signed in"}</strong>
            </div>
          </div>
        </div>
      }
    >
      <section className={shellStyles.accountCard}>
        <div className={shellStyles.tableToolbar}>
          <span title={!selectedEditableRows.length ? "Select one or more templates to bulk delete." : undefined}>
            <button
              type="button"
              className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.bulkDeleteButton}`}
              disabled={!selectedEditableRows.length || deleting}
              onClick={() => setShowBulkDeleteModal(true)}
            >
              <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.buttonIconDanger} />
              Bulk Delete
            </button>
          </span>
        </div>

        {error ? <p className={`${shellStyles.message} ${shellStyles.messageError}`}>{error}</p> : null}

        <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
          <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "32%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input
                    className={shellStyles.tableCheckbox}
                    type="checkbox"
                    checked={allSelected}
                    onChange={() =>
                      setSelectedTemplateIds(allSelected ? [] : editableRows.map((row) => row.id))
                    }
                    aria-label="Select all templates"
                  />
                </th>
                <th>Template name</th>
                <th>Library</th>
                <th>Updated date</th>
                <th>Created date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {editableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={shellStyles.tableStateCell}>
                    <div className={shellStyles.tableEmptyState}>Save a template from a canvas map to start building your library.</div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={shellStyles.clickableRow}
                    onClick={() => setPendingOpenRow(row)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPendingOpenRow(row);
                      }
                    }}
                  >
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        className={shellStyles.tableCheckbox}
                        type="checkbox"
                        checked={selectedTemplateIds.includes(row.id)}
                        onChange={() => toggleSelected(row.id)}
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td>
                      <div className={shellStyles.mapCell}>
                        <div className={shellStyles.mapCellText}>
                          <strong className={shellStyles.tableClamp}>{row.name}</strong>
                          <span className={shellStyles.tableClamp}>
                            {row.is_global ? "Global template shared across Investigation Tool." : "Personal template available in your library."}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={shellStyles.tableClamp}>{row.is_global ? "Global" : "My templates"}</span>
                    </td>
                    <td>
                      <span className={shellStyles.tableDate}>{formatDateTime(row.updated_at)}</span>
                    </td>
                    <td>
                      <span className={shellStyles.tableDate}>{formatDateTime(row.created_at)}</span>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className={shellStyles.actionButtons}>
                        <button
                          type="button"
                          className={shellStyles.actionButton}
                          onClick={() => setPendingDuplicateRow(row)}
                          aria-label="Duplicate template"
                          title="Duplicate template"
                        >
                          <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                        </button>
                        <button
                          type="button"
                          className={`${shellStyles.actionButton} ${shellStyles.actionButtonDanger}`}
                          onClick={() => setPendingDeleteRow(row)}
                          aria-label="Delete template"
                          title="Delete template"
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
          {editableRows.length === 0 ? (
            <div className={shellStyles.dashboardMobileState}>Save a template from a canvas map to start building your library.</div>
          ) : (
            paginatedRows.map((row) => {
              const isSelected = selectedTemplateIds.includes(row.id);
              return (
                <article key={`mobile-${row.id}`} className={shellStyles.dashboardMobileCard}>
                  <button
                    type="button"
                    className={shellStyles.dashboardMobileCardToggle}
                    aria-expanded={expandedMobileTemplateId === row.id}
                    onClick={() => setExpandedMobileTemplateId((current) => (current === row.id ? null : row.id))}
                  >
                    <div className={shellStyles.dashboardMobileCardHeader}>
                      <label className={shellStyles.dashboardMobileCheckbox} onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          className={shellStyles.tableCheckbox}
                          aria-label={`Select ${row.name}`}
                          checked={isSelected}
                          onChange={(event) => {
                            setSelectedTemplateIds((current) =>
                              event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id)
                            );
                          }}
                        />
                      </label>
                      <div className={shellStyles.dashboardMobileCardTitleBlock}>
                        <strong>{row.name}</strong>
                        <span>{row.is_global ? "Global template" : "Personal template"}</span>
                      </div>
                      <span className={shellStyles.dashboardMobileChevron} aria-hidden="true">
                        {expandedMobileTemplateId === row.id ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {expandedMobileTemplateId === row.id ? (
                    <>
                      <dl className={shellStyles.dashboardMobileMeta}>
                        <div>
                          <dt>Library</dt>
                          <dd>{row.is_global ? "Global" : "My templates"}</dd>
                        </div>
                        <div className={shellStyles.dashboardMobileMetaDate}>
                          <dt>Updated</dt>
                          <dd>{formatDateTime(row.updated_at)}</dd>
                        </div>
                        <div className={shellStyles.dashboardMobileMetaDate}>
                          <dt>Created</dt>
                          <dd>{formatDateTime(row.created_at)}</dd>
                        </div>
                      </dl>

                      <div className={shellStyles.dashboardMobilePrimaryAction}>
                        <button
                          type="button"
                          className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingOpenRow(row);
                          }}
                        >
                          Edit Template
                        </button>
                      </div>

                      <div className={shellStyles.dashboardMobileActions}>
                        <button
                          type="button"
                          className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.dashboardMobileActionButton}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingDuplicateRow(row);
                          }}
                        >
                          <Image src="/icons/addcomponent.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.dashboardMobileActionButton}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingDeleteRow(row);
                          }}
                        >
                          <Image src="/icons/delete.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                          Delete
                        </button>
                      </div>
                    </>
                  ) : null}
                </article>
              );
            })
          )}
        </div>

        <DashboardTableFooter
          total={editableRows.length}
          page={safePage}
          pageSize={pageSize}
          onPageChange={setPage}
          label="templates"
        />
      </section>

      {renderViewportModal(pendingOpenRow ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader("Edit template in canvas?", "Investigation Tool", () => {
              if (openingTemplateId === pendingOpenRow.id) return;
              setPendingOpenRow(null);
            })}
            <p className={shellStyles.modalText}>
              You are entering <strong>{pendingOpenRow.name}</strong> to edit the saved template.
            </p>
            <p className={shellStyles.modalText}>
              If you want to work on a live investigation map instead, use the dashboard page. Changes made in template editor mode will update this template.
            </p>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setPendingOpenRow(null)}
                disabled={openingTemplateId === pendingOpenRow.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => void handleOpenTemplate(pendingOpenRow)}
                disabled={openingTemplateId === pendingOpenRow.id}
              >
                {openingTemplateId === pendingOpenRow.id ? "Opening..." : "Continue to edit"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}

      {renderViewportModal(pendingDuplicateRow ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader("Duplicate template?", "Investigation Tool", () => {
              if (duplicatingTemplateId === pendingDuplicateRow.id) return;
              setPendingDuplicateRow(null);
            })}
            <p className={shellStyles.modalText}>
              You are about to duplicate <strong>{pendingDuplicateRow.name}</strong>.
            </p>
            <p className={shellStyles.modalText}>
              The copy will keep the same template layout and save into the same library.
            </p>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setPendingDuplicateRow(null)}
                disabled={duplicatingTemplateId === pendingDuplicateRow.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonAccent}`}
                onClick={() => void handleDuplicateTemplate(pendingDuplicateRow)}
                disabled={duplicatingTemplateId === pendingDuplicateRow.id}
              >
                {duplicatingTemplateId === pendingDuplicateRow.id ? "Duplicating..." : "Duplicate template"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}

      {renderViewportModal(pendingDeleteRow ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader("Delete template?", "Investigation Tool", () => {
              if (deletingTemplateId === pendingDeleteRow.id) return;
              setPendingDeleteRow(null);
            })}
            <p className={shellStyles.modalText}>
              You are about to permanently delete <strong>{pendingDeleteRow.name}</strong>.
            </p>
            <p className={shellStyles.modalText}>
              This will remove the saved template and any hidden template editor map created for it. This cannot be undone.
            </p>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setPendingDeleteRow(null)}
                disabled={deletingTemplateId === pendingDeleteRow.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonDanger}`}
                onClick={() => void handleDeleteTemplate(pendingDeleteRow)}
                disabled={deletingTemplateId === pendingDeleteRow.id}
              >
                {deletingTemplateId === pendingDeleteRow.id ? "Deleting..." : "Delete template"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}

      {renderViewportModal(showBulkDeleteModal ? (
        <div className={shellStyles.modalBackdrop}>
          <div className={`${shellStyles.modalCard} ${shellStyles.dashboardModalCard}`}>
            {renderBrandedModalHeader("Delete selected templates?", "Investigation Tool", () => {
              if (deleting) return;
              setShowBulkDeleteModal(false);
            })}
            <p className={shellStyles.modalText}>
              This will permanently delete {selectedEditableRows.length} template{selectedEditableRows.length === 1 ? "" : "s"} from your template library.
            </p>
            <div className={shellStyles.modalActions}>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonSecondary}`}
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shellStyles.button} ${shellStyles.buttonDanger}`}
                onClick={() => void handleBulkDelete()}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete templates"}
              </button>
            </div>
          </div>
        </div>
      ) : null)}
    </DashboardShell>
  );
}
