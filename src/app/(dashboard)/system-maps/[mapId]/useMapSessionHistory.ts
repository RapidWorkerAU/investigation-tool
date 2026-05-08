"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CanvasElementRow,
  DocumentNodeRow,
  DocumentTypeRow,
  NodeRelationRow,
  OutlineItemRow,
  SystemMap,
} from "./canvasShared";
import {
  insertMapSessionHistoryEntry,
  restoreMapSessionHistorySnapshot,
  trimFutureMapSessionHistory,
} from "./mapSessionHistoryApi";
import { buildMapSessionHistorySnapshot, type MapSessionHistorySnapshot } from "./mapSnapshotUtils";

type MapSessionHistoryEntry = {
  id: string;
  position: number;
  snapshotHash: string;
  snapshot: MapSessionHistorySnapshot;
};

type UseMapSessionHistoryParams = {
  canWriteMap: boolean;
  loading: boolean;
  mapId: string;
  userId: string | null;
  map: SystemMap | null;
  types: DocumentTypeRow[];
  nodes: DocumentNodeRow[];
  elements: CanvasElementRow[];
  relations: NodeRelationRow[];
  outlineItems: OutlineItemRow[];
  applyHistorySnapshotLocally: (snapshot: MapSessionHistorySnapshot) => void;
  setError: (message: string | null) => void;
};

export function useMapSessionHistory({
  canWriteMap,
  loading,
  mapId,
  userId,
  map,
  types,
  nodes,
  elements,
  relations,
  outlineItems,
  applyHistorySnapshotLocally,
  setError,
}: UseMapSessionHistoryParams) {
  const historySessionIdRef = useRef(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
  const historyPersistTimerRef = useRef<number | null>(null);
  const historyApplyingRef = useRef(false);
  const historyInitializedRef = useRef(false);

  const [historyEntries, setHistoryEntries] = useState<MapSessionHistoryEntry[]>([]);
  const [historyCursor, setHistoryCursor] = useState(-1);
  const [isApplyingHistory, setIsApplyingHistory] = useState(false);

  const canUndoSessionMapChanges = canWriteMap && historyCursor > 0 && !isApplyingHistory;
  const canRedoSessionMapChanges =
    canWriteMap && historyCursor >= 0 && historyCursor < historyEntries.length - 1 && !isApplyingHistory;

  const buildCurrentHistorySnapshot = useCallback(
    () => buildMapSessionHistorySnapshot(map, { types, nodes, elements, relations, outlineItems }),
    [elements, map, nodes, outlineItems, relations, types]
  );

  const persistHistorySnapshot = useCallback(
    async (snapshot: MapSessionHistorySnapshot, forceInitial = false) => {
      if (!canWriteMap || !userId) return;

      const snapshotHash = JSON.stringify(snapshot);
      const activeEntries = historyEntries.slice(0, historyCursor + 1);
      const currentEntry = historyCursor >= 0 ? historyEntries[historyCursor] : null;

      if (!forceInitial && currentEntry?.snapshotHash === snapshotHash) return;
      if (forceInitial && historyInitializedRef.current) return;

      const nextPosition = forceInitial ? 0 : activeEntries.length;

      try {
        if (!forceInitial && historyCursor < historyEntries.length - 1) {
          await trimFutureMapSessionHistory({
            mapId,
            userId,
            sessionId: historySessionIdRef.current,
            cursor: historyCursor,
          });
        }

        const insertedId = await insertMapSessionHistoryEntry({
          mapId,
          userId,
          sessionId: historySessionIdRef.current,
          position: nextPosition,
          snapshot,
          snapshotHash,
        });

        const nextEntry: MapSessionHistoryEntry = {
          id: insertedId,
          position: nextPosition,
          snapshotHash,
          snapshot,
        };

        const nextEntries = forceInitial ? [nextEntry] : [...activeEntries, nextEntry];
        historyInitializedRef.current = true;
        setHistoryEntries(nextEntries);
        setHistoryCursor(nextEntries.length - 1);
      } catch (historyError) {
        setError(historyError instanceof Error ? historyError.message : "Unable to save undo history.");
      }
    },
    [canWriteMap, historyCursor, historyEntries, mapId, setError, userId]
  );

  const handleUndoSessionChanges = useCallback(async () => {
    if (!canUndoSessionMapChanges) return;
    const targetEntry = historyEntries[historyCursor - 1];
    if (!targetEntry) return;

    try {
      setIsApplyingHistory(true);
      historyApplyingRef.current = true;
      await restoreMapSessionHistorySnapshot({ mapId, snapshot: targetEntry.snapshot });
      applyHistorySnapshotLocally(targetEntry.snapshot);
      setHistoryCursor((prev) => Math.max(0, prev - 1));
    } catch (undoError) {
      setError(undoError instanceof Error ? undoError.message : "Unable to undo the last change.");
    } finally {
      window.setTimeout(() => {
        historyApplyingRef.current = false;
        setIsApplyingHistory(false);
      }, 60);
    }
  }, [applyHistorySnapshotLocally, canUndoSessionMapChanges, historyCursor, historyEntries, mapId, setError]);

  const handleRedoSessionChanges = useCallback(async () => {
    if (!canRedoSessionMapChanges) return;
    const targetEntry = historyEntries[historyCursor + 1];
    if (!targetEntry) return;

    try {
      setIsApplyingHistory(true);
      historyApplyingRef.current = true;
      await restoreMapSessionHistorySnapshot({ mapId, snapshot: targetEntry.snapshot });
      applyHistorySnapshotLocally(targetEntry.snapshot);
      setHistoryCursor((prev) => Math.min(historyEntries.length - 1, prev + 1));
    } catch (redoError) {
      setError(redoError instanceof Error ? redoError.message : "Unable to redo the change.");
    } finally {
      window.setTimeout(() => {
        historyApplyingRef.current = false;
        setIsApplyingHistory(false);
      }, 60);
    }
  }, [applyHistorySnapshotLocally, canRedoSessionMapChanges, historyCursor, historyEntries, mapId, setError]);

  useEffect(() => {
    if (!canWriteMap || loading || historyInitializedRef.current || !userId) return;
    const snapshot = buildCurrentHistorySnapshot();
    if (!snapshot) return;
    void persistHistorySnapshot(snapshot, true);
  }, [buildCurrentHistorySnapshot, canWriteMap, loading, persistHistorySnapshot, userId]);

  useEffect(() => {
    if (!canWriteMap || loading || !historyInitializedRef.current || historyApplyingRef.current) return;
    const snapshot = buildCurrentHistorySnapshot();
    if (!snapshot) return;

    if (historyPersistTimerRef.current) {
      window.clearTimeout(historyPersistTimerRef.current);
    }

    historyPersistTimerRef.current = window.setTimeout(() => {
      void persistHistorySnapshot(snapshot);
    }, 900);

    return () => {
      if (historyPersistTimerRef.current) {
        window.clearTimeout(historyPersistTimerRef.current);
        historyPersistTimerRef.current = null;
      }
    };
  }, [
    buildCurrentHistorySnapshot,
    canWriteMap,
    elements,
    historyCursor,
    historyEntries,
    loading,
    map?.description,
    map?.map_code,
    map?.map_category,
    map?.title,
    nodes,
    outlineItems,
    persistHistorySnapshot,
    relations,
    types,
  ]);

  return {
    canUndoSessionMapChanges,
    canRedoSessionMapChanges,
    handleUndoSessionChanges,
    handleRedoSessionChanges,
  };
}
