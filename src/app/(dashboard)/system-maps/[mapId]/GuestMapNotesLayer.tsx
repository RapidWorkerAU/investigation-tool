"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type RefObject, type SetStateAction, type SyntheticEvent } from "react";
import { useViewport, ViewportPortal, type Node } from "@xyflow/react";
import { createPortal } from "react-dom";
import { boxesOverlap, minorGridSize, type FlowData } from "./canvasShared";

type GuestMapNoteStatus = "pending" | "approved" | "hidden";

type GuestMapNote = {
  id: string;
  displayName: string;
  body: string;
  posX: number;
  posY: number;
  targetFlowId: string | null;
  status: GuestMapNoteStatus;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
};

type GuestMapNotesLayerProps = {
  enabled: boolean;
  campaignSlug: string | null;
  guestSessionEmail: string | null;
  canvasRef: RefObject<HTMLDivElement | null>;
  screenToFlowPosition: ((point: { x: number; y: number }) => { x: number; y: number }) | null;
  setViewport: ((viewport: { x: number; y: number; zoom: number }, options?: { duration?: number }) => void) | null;
  flowNodes: Node<FlowData>[];
  showNotesPanel: boolean;
  setShowNotesPanel: Dispatch<SetStateAction<boolean>>;
};

type NotesSortOrder = "newest" | "oldest";

type EditorState =
  | {
      mode: "create";
      note: null;
      posX: number;
      posY: number;
      displayName: string;
      body: string;
    }
  | {
      mode: "edit";
      note: GuestMapNote;
      posX: number;
      posY: number;
      displayName: string;
      body: string;
    };

type NotesApiResponse = {
  notes?: GuestMapNote[];
  note?: GuestMapNote;
  error?: string;
};

const displayNameStorageKey = "lead-map-note-display-name";
const noteMarkerFlowSize = minorGridSize * 3;
const noteListPageSize = 20;
const textCapableShapeKinds = new Set<FlowData["entityKind"]>([
  "shape_rectangle",
  "shape_circle",
  "shape_pill",
  "shape_pentagon",
  "shape_chevron_left",
]);

function shouldIgnorePlacementNode(node: Node<FlowData>) {
  if (node.data.entityKind === "grouping_container" || node.data.entityKind === "shape_arrow") return true;
  if (textCapableShapeKinds.has(node.data.entityKind)) {
    return !String(node.data.title ?? "").trim();
  }
  return false;
}

function getNumericDimension(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function statusLabel(status: GuestMapNoteStatus) {
  if (status === "approved") return "Approved";
  if (status === "pending") return "Pending review";
  return "Hidden";
}

function formatNoteDate(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMarkerTimestamp(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const displayHours = String(hours % 12 || 12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${day}/${month}/${year} ${displayHours}:${minutes} ${suffix}`;
}

export function GuestMapNotesLayer({
  enabled,
  campaignSlug,
  guestSessionEmail,
  canvasRef,
  screenToFlowPosition,
  setViewport,
  flowNodes,
  showNotesPanel,
  setShowNotesPanel,
}: GuestMapNotesLayerProps) {
  const viewport = useViewport();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [notes, setNotes] = useState<GuestMapNote[]>([]);
  const [placementMode, setPlacementMode] = useState(false);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [placementPointer, setPlacementPointer] = useState<{ clientX: number; clientY: number; blocked: boolean } | null>(null);
  const [notesSearchQuery, setNotesSearchQuery] = useState("");
  const [notesSortOrder, setNotesSortOrder] = useState<NotesSortOrder>("newest");
  const [showNotesSortMenu, setShowNotesSortMenu] = useState(false);
  const [visibleNoteCount, setVisibleNoteCount] = useState(noteListPageSize);

  const stopMapInteraction = (event: SyntheticEvent) => {
    event.stopPropagation();
  };

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const savedDisplayName = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(displayNameStorageKey) || "";
  }, []);

  const loadNotes = useCallback(async () => {
    if (!enabled || !campaignSlug) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/lead-map-notes?slug=${encodeURIComponent(campaignSlug)}`);
      const payload = (await response.json()) as NotesApiResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to load map notes.");
      setNotes(payload.notes ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load map notes.");
    } finally {
      setLoading(false);
    }
  }, [campaignSlug, enabled]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const visibleNotes = useMemo(
    () => notes.filter((note) => note.status !== "hidden" && (note.status !== "pending" || note.canEdit)),
    [notes]
  );
  const openNote = openNoteId ? visibleNotes.find((note) => note.id === openNoteId) ?? null : null;
  const confirmingDelete = !!openNote && confirmDeleteNoteId === openNote.id;
  const canvasRect = canvasRef.current?.getBoundingClientRect();
  const getNoteScreenPosition = (note: Pick<GuestMapNote, "posX" | "posY">) => ({
    left: canvasRect ? canvasRect.left + note.posX * viewport.zoom + viewport.x : 0,
    top: canvasRect ? canvasRect.top + note.posY * viewport.zoom + viewport.y : 0,
  });
  const openNotePosition = openNote ? getNoteScreenPosition(openNote) : null;
  const noteMarkerScreenSize = noteMarkerFlowSize * viewport.zoom;
  const popupLeft =
    openNotePosition && typeof window !== "undefined"
      ? Math.min(Math.max(openNotePosition.left + noteMarkerScreenSize / 2 + 8, 12), window.innerWidth - 292)
      : 12;
  const popupTop =
    openNotePosition && typeof window !== "undefined"
      ? Math.min(Math.max(openNotePosition.top + noteMarkerScreenSize / 2 + 8, 12), window.innerHeight - 240)
      : 12;
  const normalizedNotesSearch = notesSearchQuery.trim().toLowerCase();
  const panelNotes = useMemo(() => {
    const filtered = visibleNotes.filter((note) => {
      if (!normalizedNotesSearch) return true;
      return `${note.displayName} ${note.body}`.toLowerCase().includes(normalizedNotesSearch);
    });
    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime() || 0;
      const bTime = new Date(b.createdAt).getTime() || 0;
      return notesSortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [normalizedNotesSearch, notesSortOrder, visibleNotes]);
  const visiblePanelNotes = useMemo(() => panelNotes.slice(0, visibleNoteCount), [panelNotes, visibleNoteCount]);

  const focusNoteOnMap = useCallback(
    (note: GuestMapNote) => {
      setOpenNoteId(note.id);
      setConfirmDeleteNoteId(null);
      setShowNotesPanel(false);
      if (!setViewport || !canvasRef.current) return;
      const viewportWidth = canvasRef.current.clientWidth || window.innerWidth;
      const viewportHeight = canvasRef.current.clientHeight || window.innerHeight;
      const zoom = 1;
      setViewport(
        {
          x: viewportWidth / 2 - note.posX * zoom,
          y: viewportHeight / 2 - note.posY * zoom,
          zoom,
        },
        { duration: 420 }
      );
    },
    [canvasRef, setShowNotesPanel, setViewport]
  );
  const handleNotesListScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      if (target.scrollTop + target.clientHeight < target.scrollHeight - 80) return;
      setVisibleNoteCount((current) => Math.min(panelNotes.length, current + noteListPageSize));
    },
    [panelNotes.length]
  );

  const openCreateEditor = (posX: number, posY: number) => {
    setEditor({
      mode: "create",
      note: null,
      posX,
      posY,
      displayName: savedDisplayName,
      body: "",
    });
    setPlacementMode(false);
    setPlacementPointer(null);
    setOpenNoteId(null);
    setConfirmDeleteNoteId(null);
  };

  const placementBlockerRects = useMemo(
    () =>
      flowNodes
        .filter((node) => !shouldIgnorePlacementNode(node))
        .map((node) => {
          const width = getNumericDimension(node.width) || getNumericDimension(node.style?.width);
          const height = getNumericDimension(node.height) || getNumericDimension(node.style?.height);
          if (width <= 0 || height <= 0) return null;
          return {
            x: node.position.x,
            y: node.position.y,
            width,
            height,
          };
        })
        .filter((rect): rect is { x: number; y: number; width: number; height: number } => !!rect),
    [flowNodes]
  );

  const getNotePlacementRect = useCallback(
    (point: { x: number; y: number }) => ({
      x: Math.round(point.x) - noteMarkerFlowSize / 2,
      y: Math.round(point.y) - noteMarkerFlowSize / 2,
      width: noteMarkerFlowSize,
      height: noteMarkerFlowSize,
    }),
    []
  );

  const isNotePlacementBlocked = useCallback(
    (point: { x: number; y: number }) => {
      const candidateRect = getNotePlacementRect(point);
      return placementBlockerRects.some((rect) => boxesOverlap(candidateRect, rect));
    },
    [getNotePlacementRect, placementBlockerRects]
  );

  const updatePlacementPointer = (event: React.PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!screenToFlowPosition) {
      setPlacementPointer(null);
      return;
    }
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setPlacementPointer({
      clientX: event.clientX,
      clientY: event.clientY,
      blocked: isNotePlacementBlocked(point),
    });
  };

  const cancelPlacementMode = useCallback(() => {
    setPlacementMode(false);
    setPlacementPointer(null);
  }, []);

  useEffect(() => {
    if (enabled && campaignSlug) return;
    setShowNotesPanel(false);
  }, [campaignSlug, enabled, setShowNotesPanel]);

  useEffect(() => {
    if (!showNotesPanel) return;
    cancelPlacementMode();
    setOpenNoteId(null);
    setConfirmDeleteNoteId(null);
    setEditor(null);
    setShowNotesSortMenu(false);
    void loadNotes();
  }, [cancelPlacementMode, loadNotes, showNotesPanel]);

  useEffect(() => {
    setVisibleNoteCount(noteListPageSize);
  }, [normalizedNotesSearch, notesSortOrder, showNotesPanel]);

  useEffect(() => {
    if (!placementMode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      cancelPlacementMode();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelPlacementMode, placementMode]);

  if (!enabled || !campaignSlug) return null;

  const handlePlacementClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!screenToFlowPosition) {
      setError("The map is still loading. Try again in a moment.");
      return;
    }
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    if (isNotePlacementBlocked(point)) {
      setPlacementPointer({
        clientX: event.clientX,
        clientY: event.clientY,
        blocked: true,
      });
      return;
    }
    openCreateEditor(Math.round(point.x), Math.round(point.y));
  };

  const handleSubmitEditor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    setSubmitting(true);
    setError(null);

    try {
      const displayName = editor.displayName.trim();
      const body = editor.body.trim();
      const response = await fetch("/api/lead-map-notes", {
        method: editor.mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: campaignSlug,
          noteId: editor.mode === "edit" ? editor.note.id : undefined,
          displayName,
          body,
          posX: editor.posX,
          posY: editor.posY,
        }),
      });
      const payload = (await response.json()) as NotesApiResponse;
      if (!response.ok || !payload.note) throw new Error(payload.error || "Unable to save note.");

      window.localStorage.setItem(displayNameStorageKey, displayName);
      setNotes((current) => {
        const exists = current.some((note) => note.id === payload.note?.id);
        if (!exists) return [...current, payload.note as GuestMapNote];
        return current.map((note) => (note.id === payload.note?.id ? (payload.note as GuestMapNote) : note));
      });
      setEditor(null);
      setOpenNoteId(payload.note.id);
      setConfirmDeleteNoteId(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save note.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (note: GuestMapNote) => {
    if (!note.canEdit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/lead-map-notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: campaignSlug, noteId: note.id }),
      });
      const payload = (await response.json()) as NotesApiResponse;
      if (!response.ok) throw new Error(payload.error || "Unable to delete note.");
      setNotes((current) => current.filter((item) => item.id !== note.id));
      setOpenNoteId(null);
      setConfirmDeleteNoteId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete note.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {canvasRect ? (
        <ViewportPortal>
          {visibleNotes.map((note) => {
          const pending = note.status === "pending";
          const markerTitleFontSize = noteMarkerFlowSize * 0.15;
          const markerNameFontSize = noteMarkerFlowSize * 0.12;
          const markerTimestampFontSize = noteMarkerFlowSize * 0.075;
          const markerHintFontSize = noteMarkerFlowSize * 0.095;
          const foldSize = noteMarkerFlowSize * 0.18;
          return (
            <div key={note.id}>
              <button
                type="button"
                className={`nodrag nopan absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-start justify-start overflow-hidden rounded-[2px] border p-1 text-left leading-tight shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition ${
                  pending
                    ? "border-pink-700 bg-pink-200 text-pink-950 ring-2 ring-pink-400/40"
                    : "border-pink-600 bg-pink-200 text-pink-950"
                }`}
                style={{
                  left: note.posX,
                  top: note.posY,
                  width: noteMarkerFlowSize,
                  height: noteMarkerFlowSize,
                  padding: noteMarkerFlowSize * 0.1,
                  pointerEvents: "auto",
                  zIndex: 20,
                }}
                aria-label={`Open note from ${note.displayName}`}
                title={`${note.displayName}: ${statusLabel(note.status)}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setConfirmDeleteNoteId(null);
                  setOpenNoteId((current) => (current === note.id ? null : note.id));
                }}
                onMouseDown={stopMapInteraction}
                onClick={stopMapInteraction}
                onDoubleClick={stopMapInteraction}
              >
                <span aria-hidden="true" className="relative z-10 block max-w-full truncate font-bold uppercase" style={{ fontSize: markerTitleFontSize }}>
                  Note
                </span>
                <span aria-hidden="true" className="relative z-10 mt-0.5 block max-w-full truncate font-normal normal-case opacity-90" style={{ fontSize: markerNameFontSize }}>
                  {note.displayName}
                </span>
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-auto block max-w-[88%] truncate font-normal opacity-80"
                  style={{ fontSize: markerTimestampFontSize }}
                >
                  {formatMarkerTimestamp(note.createdAt)}
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 right-0 h-0 w-0"
                  style={{
                    borderBottom: `${foldSize}px solid rgba(255, 255, 255, 0.72)`,
                    borderLeft: `${foldSize}px solid #f9a8d4`,
                  }}
                />
              </button>
              <div
                className="pointer-events-none absolute truncate text-right font-semibold uppercase tracking-[0.04em] text-pink-950/75"
                style={{
                  left: note.posX - noteMarkerFlowSize / 2,
                  top: note.posY + noteMarkerFlowSize / 2 + noteMarkerFlowSize * 0.05,
                  width: noteMarkerFlowSize,
                  fontSize: markerHintFontSize,
                  zIndex: 20,
                }}
              >
                Click to view
              </div>
            </div>
          );
        })}
        </ViewportPortal>
      ) : null}

      {portalRoot && openNote ? createPortal(
        <div
          className="nodrag nopan nowheel fixed z-[165] w-[280px] rounded border border-slate-300 bg-white p-3 text-left text-sm text-slate-900 shadow-2xl"
          style={{ left: popupLeft, top: popupTop }}
          onPointerDown={stopMapInteraction}
          onMouseDown={stopMapInteraction}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {confirmingDelete ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-rose-800">Delete note?</div>
                  <div className="text-[11px] uppercase tracking-[0.06em] text-slate-500">
                    {openNote.displayName} - {formatNoteDate(openNote.updatedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-50"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmDeleteNoteId(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                This will remove the note from the map. This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmDeleteNoteId(null);
                  }}
                  disabled={submitting}
                >
                  Keep note
                </button>
                <button
                  type="button"
                  className="rounded border border-rose-600 bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDeleteNote(openNote);
                  }}
                  disabled={submitting}
                >
                  {submitting ? "Deleting..." : "Delete note"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{openNote.displayName}</div>
                  <div className="text-[11px] uppercase tracking-[0.06em] text-slate-500">
                    {statusLabel(openNote.status)} - {formatNoteDate(openNote.updatedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-50"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenNoteId(null);
                    setConfirmDeleteNoteId(null);
                  }}
                >
                  Close
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-slate-700">{openNote.body}</p>
              {openNote.canEdit ? (
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmDeleteNoteId(null);
                      setEditor({
                        mode: "edit",
                        note: openNote,
                        posX: openNote.posX,
                        posY: openNote.posY,
                        displayName: openNote.displayName,
                        body: openNote.body,
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded border border-rose-300 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmDeleteNoteId(openNote.id);
                    }}
                    disabled={submitting}
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>,
        portalRoot
      ) : null}

      <div className="pointer-events-none absolute right-4 top-4 z-[95] flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded border border-slate-300 bg-white/95 px-2 py-2 shadow-lg">
          <button
            type="button"
            className={`inline-flex h-10 items-center gap-2 rounded border px-3 text-sm font-semibold shadow-sm ${
              placementMode
                ? "border-amber-500 bg-amber-100 text-amber-950"
                : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            }`}
            onClick={() => {
              setPlacementMode((current) => !current);
              setPlacementPointer(null);
              setEditor(null);
              setOpenNoteId(null);
              setConfirmDeleteNoteId(null);
              setShowNotesPanel(false);
            }}
          >
            <span
              aria-hidden="true"
              className="h-4 w-4 bg-current"
              style={{
                WebkitMaskImage: "url('/icons/comments.svg')",
                maskImage: "url('/icons/comments.svg')",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
            {placementMode ? "Click map" : "Add note"}
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center rounded border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            onClick={() => void loadNotes()}
            disabled={loading}
          >
            {loading ? "Loading" : "Refresh"}
          </button>
        </div>
        {error ? (
          <div className="pointer-events-auto max-w-[320px] rounded border border-rose-300 bg-white px-3 py-2 text-sm text-rose-700 shadow-lg">
            {error}
          </div>
        ) : null}
      </div>

      {showNotesPanel ? (
        <div
          className="nodrag nopan nowheel fixed inset-0 z-[160] md:bottom-[20px] md:left-[98px] md:right-auto md:top-[82px] md:w-[390px] md:max-w-[calc(100vw-132px)]"
          onPointerDown={stopMapInteraction}
          onMouseDown={stopMapInteraction}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onWheel={stopMapInteraction}
        >
          <div className="flex h-full w-full flex-col overflow-hidden border border-white/45 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] text-slate-900 shadow-[0_28px_64px_rgba(15,23,42,0.24)] md:rounded-[28px]">
            <div className="border-b border-slate-200/80 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Notes</p>
                  <h2 className="mt-1 text-[1.4rem] font-semibold text-slate-950">Map Comments</h2>
                  <p className="mt-1.5 text-sm leading-5 text-slate-600">
                    Review comments and jump to their location on the map.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close notes"
                  className="inline-flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-black shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#102a43] hover:text-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
                  onClick={() => setShowNotesPanel(false)}
                >
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 bg-current"
                    style={{ WebkitMaskImage: "url('/icons/close.svg')", maskImage: "url('/icons/close.svg')", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }}
                  />
                </button>
              </div>
              <input
                type="text"
                value={notesSearchQuery}
                onChange={(event) => setNotesSearchQuery(event.target.value)}
                placeholder="Search username or comment"
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden px-5 pb-5 pt-4">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>
                  {panelNotes.length} comment{panelNotes.length === 1 ? "" : "s"}
                  {notesSearchQuery.trim() ? ` for "${notesSearchQuery.trim()}"` : ""}
                </span>
                <div className="relative flex shrink-0 items-center gap-2">
                  {loading ? <span>Refreshing...</span> : null}
                  <button
                    type="button"
                    className="rounded px-1 py-0.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-800"
                    onClick={() => setShowNotesSortMenu((current) => !current)}
                  >
                    {notesSortOrder === "newest" ? "Newest first" : "Oldest first"}
                  </button>
                  {showNotesSortMenu ? (
                    <div className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-xs shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
                      {(["newest", "oldest"] as NotesSortOrder[]).map((order) => (
                        <button
                          key={order}
                          type="button"
                          className={`block w-full px-3 py-1.5 text-left hover:bg-slate-50 ${
                            notesSortOrder === order ? "font-semibold text-slate-950" : "text-slate-600"
                          }`}
                          onClick={() => {
                            setNotesSortOrder(order);
                            setShowNotesSortMenu(false);
                          }}
                        >
                          {order === "newest" ? "Newest first" : "Oldest first"}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex-1 overflow-y-auto pr-1" onScroll={handleNotesListScroll}>
                {visiblePanelNotes.length ? (
                  visiblePanelNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      className="mb-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-800 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:bg-slate-50"
                      onClick={() => focusNoteOnMap(note)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-950" title={note.displayName}>
                            {note.displayName}
                          </div>
                          <div className="mt-0.5 text-xs uppercase tracking-[0.06em] text-slate-500">
                            {formatNoteDate(note.createdAt)}
                          </div>
                        </div>
                        {note.status === "pending" ? (
                          <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-800">
                            Pending
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm leading-5 text-slate-700" title={note.body}>
                        {note.body}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
                    {notesSearchQuery.trim() ? "No comments match your search." : "No comments yet."}
                  </div>
                )}
                {visiblePanelNotes.length < panelNotes.length ? (
                  <div className="py-2 text-center text-xs text-slate-400">Scroll to load more</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {placementMode ? (
        <div
          className={`nodrag nopan absolute inset-0 z-[90] ${
            placementPointer?.blocked ? "cursor-not-allowed bg-rose-950/10" : "cursor-crosshair bg-sky-950/10"
          }`}
          onPointerMove={updatePlacementPointer}
          onPointerLeave={() => setPlacementPointer(null)}
          onClick={handlePlacementClick}
        >
          <div className="pointer-events-auto absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-3 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg">
            <span>Click the map where this note should appear.</span>
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                cancelPlacementMode();
              }}
            >
              Cancel
            </button>
          </div>
          {placementPointer?.blocked && canvasRect ? (
            <div
              className="pointer-events-none absolute z-[95] rounded border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-lg"
              style={{
                left: Math.min(
                  Math.max(placementPointer.clientX - canvasRect.left + 14, 12),
                  Math.max(12, canvasRect.width - 180)
                ),
                top: Math.min(
                  Math.max(placementPointer.clientY - canvasRect.top + 14, 12),
                  Math.max(12, canvasRect.height - 40)
                ),
              }}
            >
              Note cannot overlap node
            </div>
          ) : null}
        </div>
      ) : null}

      {portalRoot && editor ? createPortal(
        <div className="nodrag nopan fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/45 px-4">
          <form
            className="w-full max-w-[480px] rounded border border-slate-300 bg-white p-5 text-slate-900 shadow-2xl"
            onSubmit={handleSubmitEditor}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{editor.mode === "create" ? "Add map note" : "Edit map note"}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Your name or username is visible to all map viewers. Your email ({guestSessionEmail || "your redeemed email"}) is only visible to Investigation Tool admin.
                </p>
              </div>
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                onClick={() => setEditor(null)}
                disabled={submitting}
              >
                Close
              </button>
            </div>

            <label className="mt-4 block text-sm font-semibold">
              Visible name or username
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 font-normal text-slate-900"
                value={editor.displayName}
                onChange={(event) => setEditor((current) => (current ? { ...current, displayName: event.target.value } : current))}
                placeholder="e.g. Safety reviewer"
                minLength={2}
                maxLength={60}
                required
              />
            </label>

            <label className="mt-4 block text-sm font-semibold">
              Note
              <textarea
                className="mt-1 min-h-[120px] w-full resize-y rounded border border-slate-300 px-3 py-2 font-normal text-slate-900"
                value={editor.body}
                onChange={(event) => setEditor((current) => (current ? { ...current, body: event.target.value } : current))}
                placeholder="Add a comment or question about this part of the map."
                maxLength={1200}
                required
              />
            </label>

            {editor.mode === "edit" && editor.note.status === "approved" ? (
              <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Editing an approved note will move it back to pending review.
              </p>
            ) : (
              <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                New notes are visible to you immediately and become visible to all map viewers after admin approval.
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => setEditor(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded border border-[#102a43] bg-[#102a43] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save note"}
              </button>
            </div>
          </form>
        </div>,
        portalRoot
      ) : null}
    </>
  );
}
