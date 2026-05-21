"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardTableLoadingState";
import shellStyles from "@/components/dashboard/DashboardShell.module.css";
import { fetchAccessState } from "@/lib/access";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { ensurePortalSupabaseUser } from "@/lib/supabase/portalSession";
import type { LeadMapGuestNoteAdmin, LeadMapGuestNoteStatus } from "@/lib/leadMapNotes";

const platformAdminUserId = "420266a0-2087-4f36-8c28-340443dd1a82";

type AdminNotesResponse = {
  notes: LeadMapGuestNoteAdmin[];
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

export default function LeadAccessNotesAdminPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [notes, setNotes] = useState<LeadMapGuestNoteAdmin[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteActionId, setNoteActionId] = useState<string | null>(null);

  const loadNotes = useCallback(async (accessToken: string) => {
    const response = await fetch("/api/lead-access/admin/notes", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await response.json()) as AdminNotesResponse;
    if (!response.ok) throw new Error(data.error || "Unable to load guest map notes.");
    setNotes(data.notes ?? []);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = await ensurePortalSupabaseUser();
        if (!user) {
          router.push("/login?returnTo=%2Flead-access%2Fnotes");
          return;
        }

        setCurrentUserEmail(user.email ?? null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          router.push("/login?returnTo=%2Flead-access%2Fnotes");
          return;
        }

        const nextAccessState = await fetchAccessState(session.access_token);
        const isAdmin = user.id === platformAdminUserId || nextAccessState.userId === platformAdminUserId;
        setAuthorized(isAdmin);

        if (isAdmin) {
          await loadNotes(session.access_token);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load guest map notes.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [loadNotes, router, supabase]);

  async function withAccessToken<T>(callback: (accessToken: string) => Promise<T>) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push("/login?returnTo=%2Flead-access%2Fnotes");
      throw new Error("You are no longer signed in.");
    }
    return callback(session.access_token);
  }

  async function handleSetGuestNoteStatus(note: LeadMapGuestNoteAdmin, status: LeadMapGuestNoteStatus) {
    setNoteActionId(note.id);
    setError(null);

    try {
      await withAccessToken(async (accessToken) => {
        const response = await fetch("/api/lead-access/admin/notes", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ noteId: note.id, status }),
        });

        const payload = (await response.json()) as { note?: LeadMapGuestNoteAdmin } & ApiErrorResponse;
        if (!response.ok) throw new Error(payload.error || "Unable to update guest note.");
        if (payload.note) {
          setNotes((current) => current.map((item) => (item.id === payload.note?.id ? payload.note : item)));
          window.dispatchEvent(new Event("lead-access-notes-updated"));
        }
      });
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Unable to update guest note.");
    } finally {
      setNoteActionId(null);
    }
  }

  async function handleDeleteGuestNote(note: LeadMapGuestNoteAdmin) {
    const confirmed = window.confirm("Delete this guest note?");
    if (!confirmed) return;
    setNoteActionId(note.id);
    setError(null);

    try {
      await withAccessToken(async (accessToken) => {
        const response = await fetch("/api/lead-access/admin/notes", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ noteId: note.id }),
        });

        const payload = (await response.json()) as ApiErrorResponse;
        if (!response.ok) throw new Error(payload.error || "Unable to delete guest note.");
        setNotes((current) => current.filter((item) => item.id !== note.id));
        window.dispatchEvent(new Event("lead-access-notes-updated"));
      });
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : "Unable to delete guest note.");
    } finally {
      setNoteActionId(null);
    }
  }

  if (loading) {
    return (
      <DashboardPageSkeleton
        mode="admin"
        activeNav="lead-access-notes"
        eyebrow="Platform Admin"
        title="Guest Map Notes"
        subtitle="Review and moderate guest comments left on case study maps."
        rows={5}
        columns="15% 13% 17% 10% 25% 10% 10%"
        showToolbar
      />
    );
  }

  return (
    <DashboardShell
      mode="admin"
      activeNav="lead-access-notes"
      eyebrow="Platform Admin"
      title="Guest Map Notes"
      subtitle="Approve, hide, or delete guest comments left on case study maps."
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
        {!loading && !authorized ? (
          <p className={`${shellStyles.message} ${shellStyles.messageError}`}>This page is restricted to the platform admin account.</p>
        ) : null}

        {!loading && authorized ? (
          <>
            <div className={`${shellStyles.tableWrap} ${shellStyles.reportDataTableWrap}`}>
              <table className={`${shellStyles.table} ${shellStyles.reportDataTable}`}>
                <colgroup>
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Visible name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Note</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={shellStyles.tableStateCell}>
                        <div className={shellStyles.tableEmptyState}>No guest map notes have been submitted yet.</div>
                      </td>
                    </tr>
                  ) : (
                    notes.map((note) => (
                      <tr key={note.id}>
                        <td>
                          <div className={shellStyles.mapCellText}>
                            <strong className={shellStyles.tableClamp}>{note.campaignTitle}</strong>
                            <span className={shellStyles.tableClamp}>{note.campaignSlug}</span>
                          </div>
                        </td>
                        <td><span className={shellStyles.tableValue}>{note.displayName}</span></td>
                        <td><span className={shellStyles.tableClamp}>{note.authorEmail}</span></td>
                        <td><span className={shellStyles.tableValue}>{note.status}</span></td>
                        <td><span className={shellStyles.tableClamp}>{note.body}</span></td>
                        <td><span className={shellStyles.tableValue}>{formatDateTime(note.updatedAt)}</span></td>
                        <td>
                          <div className={shellStyles.actionButtons}>
                            {note.status !== "approved" ? (
                              <button
                                type="button"
                                className={shellStyles.actionButton}
                                onClick={() => void handleSetGuestNoteStatus(note, "approved")}
                                disabled={noteActionId === note.id}
                                aria-label="Approve guest note"
                                title="Approve"
                              >
                                <Image src="/icons/save.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                              </button>
                            ) : null}
                            {note.status !== "hidden" ? (
                              <button
                                type="button"
                                className={shellStyles.actionButton}
                                onClick={() => void handleSetGuestNoteStatus(note, "hidden")}
                                disabled={noteActionId === note.id}
                                aria-label="Hide guest note"
                                title="Hide"
                              >
                                <Image src="/icons/deletecomponent.svg" alt="" width={16} height={16} className={shellStyles.actionIcon} />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className={`${shellStyles.actionButton} ${shellStyles.actionButtonDanger}`}
                              onClick={() => void handleDeleteGuestNote(note)}
                              disabled={noteActionId === note.id}
                              aria-label="Delete guest note"
                              title="Delete"
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
              {notes.length === 0 ? (
                <div className={shellStyles.dashboardMobileState}>No guest map notes have been submitted yet.</div>
              ) : (
                notes.map((note) => (
                  <article key={`note-mobile-${note.id}`} className={shellStyles.dashboardMobileCard}>
                    <div className={shellStyles.dashboardMobileCardHeader}>
                      <div className={shellStyles.dashboardMobileCardTitleBlock}>
                        <strong>{note.displayName}</strong>
                        <span>{note.campaignTitle} - {note.status}</span>
                      </div>
                    </div>
                    <p className={shellStyles.modalText}>{note.body}</p>
                    <dl className={shellStyles.dashboardMobileMeta}>
                      <div>
                        <dt>Email</dt>
                        <dd>{note.authorEmail}</dd>
                      </div>
                      <div className={shellStyles.dashboardMobileMetaDate}>
                        <dt>Updated</dt>
                        <dd>{formatDateTime(note.updatedAt)}</dd>
                      </div>
                    </dl>
                    <div className={shellStyles.dashboardMobileActions}>
                      {note.status !== "approved" ? (
                        <button
                          type="button"
                          className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.dashboardMobileActionButton}`}
                          onClick={() => void handleSetGuestNoteStatus(note, "approved")}
                          disabled={noteActionId === note.id}
                        >
                          Approve
                        </button>
                      ) : null}
                      {note.status !== "hidden" ? (
                        <button
                          type="button"
                          className={`${shellStyles.button} ${shellStyles.buttonSecondary} ${shellStyles.dashboardMobileActionButton}`}
                          onClick={() => void handleSetGuestNoteStatus(note, "hidden")}
                          disabled={noteActionId === note.id}
                        >
                          Hide
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`${shellStyles.button} ${shellStyles.buttonDanger} ${shellStyles.dashboardMobileActionButton}`}
                        onClick={() => void handleDeleteGuestNote(note)}
                        disabled={noteActionId === note.id}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}
