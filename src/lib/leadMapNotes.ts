import { createServiceRoleClient } from "@/lib/supabase/server";

export type LeadMapGuestNoteStatus = "pending" | "approved" | "hidden";

type LeadMapGuestNoteRow = {
  id: string;
  campaign_id: string;
  map_id: string;
  access_code_id: string | null;
  author_email: string;
  display_name: string;
  body: string;
  pos_x: number | string;
  pos_y: number | string;
  target_flow_id: string | null;
  status: LeadMapGuestNoteStatus;
  approved_at: string | null;
  approved_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

type LeadMapGuestNoteWithCampaignRow = LeadMapGuestNoteRow & {
  lead_map_campaigns?:
    | {
        slug: string;
        title: string;
      }
    | Array<{
        slug: string;
        title: string;
      }>
    | null;
};

export type LeadMapGuestNotePublic = {
  id: string;
  displayName: string;
  body: string;
  posX: number;
  posY: number;
  targetFlowId: string | null;
  status: LeadMapGuestNoteStatus;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
};

export type LeadMapGuestNoteAdmin = LeadMapGuestNotePublic & {
  campaignId: string;
  campaignSlug: string;
  campaignTitle: string;
  mapId: string;
  authorEmail: string;
  approvedAt: string | null;
};

function normalizeGuestNoteEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeNoteRow(
  row: LeadMapGuestNoteRow,
  editableIdentity?: { accessCodeId?: string | null; authorEmail?: string | null }
): LeadMapGuestNotePublic {
  const viewerEmail = editableIdentity?.authorEmail ? normalizeGuestNoteEmail(editableIdentity.authorEmail) : "";
  const noteEmail = normalizeGuestNoteEmail(row.author_email);
  return {
    id: row.id,
    displayName: row.display_name,
    body: row.body,
    posX: Number(row.pos_x),
    posY: Number(row.pos_y),
    targetFlowId: row.target_flow_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canEdit:
      (!!editableIdentity?.accessCodeId && row.access_code_id === editableIdentity.accessCodeId) ||
      (!!viewerEmail && noteEmail === viewerEmail),
  };
}

function normalizeAdminNoteRow(row: LeadMapGuestNoteWithCampaignRow): LeadMapGuestNoteAdmin {
  const publicNote = normalizeNoteRow(row);
  const campaign = Array.isArray(row.lead_map_campaigns)
    ? row.lead_map_campaigns[0]
    : row.lead_map_campaigns;
  return {
    ...publicNote,
    campaignId: row.campaign_id,
    campaignSlug: campaign?.slug ?? "",
    campaignTitle: campaign?.title ?? "Unknown campaign",
    mapId: row.map_id,
    authorEmail: row.author_email,
    approvedAt: row.approved_at,
  };
}

export function cleanLeadMapNoteDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 60);
}

export function cleanLeadMapNoteBody(value: string) {
  return value.trim().slice(0, 1200);
}

export async function listLeadMapGuestNotesForViewer({
  campaignId,
  mapId,
  accessCodeId,
  authorEmail,
}: {
  campaignId: string;
  mapId: string;
  accessCodeId: string;
  authorEmail: string;
}) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_map_guest_notes")
    .select("id,campaign_id,map_id,access_code_id,author_email,display_name,body,pos_x,pos_y,target_flow_id,status,approved_at,approved_by_user_id,created_at,updated_at")
    .eq("campaign_id", campaignId)
    .eq("map_id", mapId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message || "Unable to load guest notes.");
  }

  const viewerEmail = normalizeGuestNoteEmail(authorEmail);

  return ((data ?? []) as LeadMapGuestNoteRow[])
    .filter((note) => note.status === "approved" || note.access_code_id === accessCodeId || normalizeGuestNoteEmail(note.author_email) === viewerEmail)
    .filter((note) => note.status !== "hidden")
    .map((note) => normalizeNoteRow(note, { accessCodeId, authorEmail: viewerEmail }));
}

export async function createLeadMapGuestNote({
  campaignId,
  mapId,
  accessCodeId,
  authorEmail,
  displayName,
  body,
  posX,
  posY,
  targetFlowId,
}: {
  campaignId: string;
  mapId: string;
  accessCodeId: string;
  authorEmail: string;
  displayName: string;
  body: string;
  posX: number;
  posY: number;
  targetFlowId?: string | null;
}) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_map_guest_notes")
    .insert({
      campaign_id: campaignId,
      map_id: mapId,
      access_code_id: accessCodeId,
      author_email: normalizeGuestNoteEmail(authorEmail),
      display_name: cleanLeadMapNoteDisplayName(displayName),
      body: cleanLeadMapNoteBody(body),
      pos_x: posX,
      pos_y: posY,
      target_flow_id: targetFlowId?.trim() || null,
      status: "pending",
    })
    .select("id,campaign_id,map_id,access_code_id,author_email,display_name,body,pos_x,pos_y,target_flow_id,status,approved_at,approved_by_user_id,created_at,updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Unable to save guest note.");
  }

  return normalizeNoteRow(data as LeadMapGuestNoteRow, { accessCodeId, authorEmail });
}

export async function updateOwnLeadMapGuestNote({
  noteId,
  campaignId,
  mapId,
  accessCodeId,
  authorEmail,
  displayName,
  body,
}: {
  noteId: string;
  campaignId: string;
  mapId: string;
  accessCodeId: string;
  authorEmail: string;
  displayName: string;
  body: string;
}) {
  const supabase = createServiceRoleClient();
  const normalizedAuthorEmail = normalizeGuestNoteEmail(authorEmail);
  const { data, error } = await supabase
    .from("lead_map_guest_notes")
    .update({
      display_name: cleanLeadMapNoteDisplayName(displayName),
      body: cleanLeadMapNoteBody(body),
      status: "pending",
      approved_at: null,
      approved_by_user_id: null,
    })
    .eq("id", noteId)
    .eq("campaign_id", campaignId)
    .eq("map_id", mapId)
    .eq("author_email", normalizedAuthorEmail)
    .select("id,campaign_id,map_id,access_code_id,author_email,display_name,body,pos_x,pos_y,target_flow_id,status,approved_at,approved_by_user_id,created_at,updated_at")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to update guest note.");
  }
  if (!data) return null;

  return normalizeNoteRow(data as LeadMapGuestNoteRow, { accessCodeId, authorEmail: normalizedAuthorEmail });
}

export async function deleteOwnLeadMapGuestNote({
  noteId,
  campaignId,
  mapId,
  accessCodeId,
  authorEmail,
}: {
  noteId: string;
  campaignId: string;
  mapId: string;
  accessCodeId: string;
  authorEmail: string;
}) {
  const supabase = createServiceRoleClient();
  const normalizedAuthorEmail = normalizeGuestNoteEmail(authorEmail);
  const { error } = await supabase
    .from("lead_map_guest_notes")
    .delete()
    .eq("id", noteId)
    .eq("campaign_id", campaignId)
    .eq("map_id", mapId)
    .eq("author_email", normalizedAuthorEmail);

  if (error) {
    throw new Error(error.message || "Unable to delete guest note.");
  }
}

export async function listLeadMapGuestNotesForAdmin(limit = 50) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_map_guest_notes")
    .select("id,campaign_id,map_id,access_code_id,author_email,display_name,body,pos_x,pos_y,target_flow_id,status,approved_at,approved_by_user_id,created_at,updated_at,lead_map_campaigns(slug,title)")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "Unable to load guest map notes.");
  }

  return ((data ?? []) as unknown as LeadMapGuestNoteWithCampaignRow[]).map(normalizeAdminNoteRow);
}

export async function countLeadMapGuestNotesForAdmin(status?: LeadMapGuestNoteStatus) {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("lead_map_guest_notes")
    .select("id", { count: "exact", head: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(error.message || "Unable to count guest map notes.");
  }

  return count ?? 0;
}

export async function setLeadMapGuestNoteStatusForAdmin({
  noteId,
  status,
  adminUserId,
}: {
  noteId: string;
  status: LeadMapGuestNoteStatus;
  adminUserId: string;
}) {
  const supabase = createServiceRoleClient();
  const update =
    status === "approved"
      ? { status, approved_at: new Date().toISOString(), approved_by_user_id: adminUserId }
      : { status, approved_at: null, approved_by_user_id: null };

  const { data, error } = await supabase
    .from("lead_map_guest_notes")
    .update(update)
    .eq("id", noteId)
    .select("id,campaign_id,map_id,access_code_id,author_email,display_name,body,pos_x,pos_y,target_flow_id,status,approved_at,approved_by_user_id,created_at,updated_at,lead_map_campaigns(slug,title)")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to update guest map note.");
  }
  return data ? normalizeAdminNoteRow(data as unknown as LeadMapGuestNoteWithCampaignRow) : null;
}

export async function deleteLeadMapGuestNoteForAdmin(noteId: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("lead_map_guest_notes").delete().eq("id", noteId);
  if (error) {
    throw new Error(error.message || "Unable to delete guest map note.");
  }
}
