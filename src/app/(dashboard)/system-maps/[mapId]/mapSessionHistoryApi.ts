"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import type { MapSessionHistorySnapshot } from "./mapSnapshotUtils";

type InsertHistoryEntryParams = {
  mapId: string;
  userId: string;
  sessionId: string;
  position: number;
  snapshot: MapSessionHistorySnapshot;
  snapshotHash: string;
};

export async function trimFutureMapSessionHistory({
  mapId,
  userId,
  sessionId,
  cursor,
}: {
  mapId: string;
  userId: string;
  sessionId: string;
  cursor: number;
}) {
  const { error } = await supabaseBrowser
    .schema("ms")
    .from("map_session_history")
    .delete()
    .eq("map_id", mapId)
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .gt("position", cursor);

  if (error) throw error;
}

export async function insertMapSessionHistoryEntry({
  mapId,
  userId,
  sessionId,
  position,
  snapshot,
  snapshotHash,
}: InsertHistoryEntryParams) {
  const { data, error } = await supabaseBrowser
    .schema("ms")
    .from("map_session_history")
    .insert({
      map_id: mapId,
      user_id: userId,
      session_id: sessionId,
      position,
      snapshot,
      snapshot_hash: snapshotHash,
    })
    .select("id")
    .single();

  if (error || !data?.id) throw error ?? new Error("Unable to save history snapshot.");
  return data.id as string;
}

export async function restoreMapSessionHistorySnapshot({
  mapId,
  snapshot,
}: {
  mapId: string;
  snapshot: MapSessionHistorySnapshot;
}) {
  const { error } = await supabaseBrowser.rpc("restore_system_map_session_snapshot", {
    p_map_id: mapId,
    p_snapshot: snapshot,
  });

  if (error) throw error;
}
