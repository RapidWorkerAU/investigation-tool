import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { AdminAuthResult } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type {
  CanvasElementRow,
  DocumentNodeRow,
  DocumentTypeRow,
  NodeRelationRow,
  SystemMap,
  SystemMapCanvasSnapshot,
} from "@/app/(dashboard)/system-maps/[mapId]/canvasShared";

export type LeadMapCampaign = {
  id: string;
  slug: string;
  map_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  session_duration_hours: number;
};

export type LeadAccessHistoryRow = {
  id: string;
  campaign_id: string;
  campaign_slug: string;
  campaign_title: string;
  issued_code: string | null;
  code_last4: string | null;
  note: string | null;
  reserved_email: string | null;
  redeemed_email: string | null;
  redeemed_at: string | null;
  revoked_at: string | null;
  generated_at: string | null;
};

type LeadMapAccessCode = {
  id: string;
  campaign_id: string;
  code_hash: string;
  issued_code: string | null;
  code_last4: string | null;
  note?: string | null;
  reserved_email: string | null;
  redeemed_email: string | null;
  redeemed_at: string | null;
  revoked_at: string | null;
  generated_at: string | null;
  generated_by_user_id: string | null;
};

type LeadAccessSessionPayload = {
  v: 1;
  campaignId: string;
  codeId: string;
  mapId: string;
  redeemedEmail: string;
  expiresAt: string | null;
};

export type LeadAccessSession = {
  campaignId: string;
  codeId: string;
  mapId: string;
  redeemedEmail: string;
  expiresAt: string | null;
};

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

const COOKIE_PREFIX = "lead_map_access_";
const CANVAS_ELEMENT_SELECT_COLUMNS =
  "id,map_id,element_type,heading,color_hex,created_by_user_id,element_config,pos_x,pos_y,width,height,created_at,updated_at";
const LEAD_ACCESS_CODE_SELECT_COLUMNS =
  "id,campaign_id,code_hash,issued_code,code_last4,note,reserved_email,redeemed_email,redeemed_at,revoked_at,generated_at,generated_by_user_id";
const LEAD_ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LEAD_ACCESS_INDEFINITE_SESSION_HOURS = 0;
export const LEAD_ACCESS_PERSISTENT_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

function getLeadAccessSecret() {
  const secret = process.env.LEAD_ACCESS_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) {
    throw new Error("Lead access session secret is not configured.");
  }
  return secret;
}

function signLeadAccessPayload(encodedPayload: string) {
  return createHmac("sha256", getLeadAccessSecret()).update(encodedPayload).digest("base64url");
}

function normalizeLeadAccessPayload(payload: LeadAccessSessionPayload): LeadAccessSession {
  return {
    campaignId: payload.campaignId,
    codeId: payload.codeId,
    mapId: payload.mapId,
    redeemedEmail: payload.redeemedEmail,
    expiresAt: payload.expiresAt,
  };
}

export function normalizeLeadAccessSlug(slug: string) {
  return slug.trim().toLowerCase();
}

export function normalizeLeadAccessEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeLeadAccessCode(code: string) {
  return code.trim().toUpperCase().replace(/[\s-]+/g, "");
}

export function hashLeadAccessCode(code: string) {
  return createHash("sha256").update(normalizeLeadAccessCode(code)).digest("hex");
}

export function getLeadAccessCookieName(slug: string) {
  return `${COOKIE_PREFIX}${normalizeLeadAccessSlug(slug).replace(/[^a-z0-9-]/g, "-")}`;
}

export function buildLeadAccessRedeemedMessage(redeemedEmail: string, redeemedAt: string) {
  return `This access code has already been redeemed by ${redeemedEmail} on ${formatLeadAccessDateTime(
    redeemedAt
  )}. Any additional access requests must email ashleigh.phillips@hses.com.au.`;
}

export function isLeadAccessSessionIndefinite(sessionDurationHours: number) {
  return Number.isFinite(sessionDurationHours) && sessionDurationHours <= LEAD_ACCESS_INDEFINITE_SESSION_HOURS;
}

export function getLeadAccessSessionExpiresAt(sessionDurationHours: number) {
  if (isLeadAccessSessionIndefinite(sessionDurationHours)) return null;
  return new Date(Date.now() + sessionDurationHours * 60 * 60 * 1000).toISOString();
}

export function formatLeadAccessDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(new Date(value));
}

export function createLeadAccessSessionCookieValue(session: LeadAccessSession) {
  const payload: LeadAccessSessionPayload = {
    v: 1,
    campaignId: session.campaignId,
    codeId: session.codeId,
    mapId: session.mapId,
    redeemedEmail: session.redeemedEmail,
    expiresAt: session.expiresAt,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signLeadAccessPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function readLeadAccessSessionFromCookies(cookies: CookieReader, slug: string) {
  const raw = cookies.get(getLeadAccessCookieName(slug))?.value;
  if (!raw) return null;
  const [encodedPayload, providedSignature] = raw.split(".");
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = signLeadAccessPayload(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  let parsed: LeadAccessSessionPayload;
  try {
    parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as LeadAccessSessionPayload;
  } catch {
    return null;
  }

  if (
    parsed.v !== 1 ||
    !parsed.campaignId ||
    !parsed.codeId ||
    !parsed.mapId ||
    !parsed.redeemedEmail ||
    !Object.prototype.hasOwnProperty.call(parsed, "expiresAt") ||
    (parsed.expiresAt !== null && typeof parsed.expiresAt !== "string")
  ) {
    return null;
  }

  if (parsed.expiresAt) {
    const expiresAtMs = new Date(parsed.expiresAt).getTime();
    if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
      return null;
    }
  }

  return normalizeLeadAccessPayload(parsed);
}

export async function fetchLeadMapCampaignBySlug(slug: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_map_campaigns")
    .select("id,slug,map_id,title,description,is_active,session_duration_hours")
    .eq("slug", normalizeLeadAccessSlug(slug))
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to load lead access campaign.");
  }

  return (data as LeadMapCampaign | null) ?? null;
}

export async function listActiveLeadMapCampaigns() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_map_campaigns")
    .select("id,slug,map_id,title,description,is_active,session_duration_hours")
    .eq("is_active", true)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message || "Unable to load lead access campaigns.");
  }

  return (data ?? []) as LeadMapCampaign[];
}

export async function listLeadAccessHistory(limit = 24) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_map_access_codes")
    .select("id,campaign_id,issued_code,code_last4,note,reserved_email,redeemed_email,redeemed_at,revoked_at,generated_at")
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "Unable to load lead access history.");
  }

  const rows = (data ?? []) as Array<{
    id: string;
    campaign_id: string;
    issued_code: string | null;
    code_last4: string | null;
    note: string | null;
    reserved_email: string | null;
    redeemed_email: string | null;
    redeemed_at: string | null;
    revoked_at: string | null;
    generated_at: string | null;
  }>;

  const campaignIds = Array.from(new Set(rows.map((row) => row.campaign_id).filter(Boolean)));
  let campaignsById = new Map<string, LeadMapCampaign>();
  if (campaignIds.length > 0) {
    const { data: campaigns, error: campaignError } = await supabase
      .from("lead_map_campaigns")
      .select("id,slug,map_id,title,description,is_active,session_duration_hours")
      .in("id", campaignIds);

    if (campaignError) {
      throw new Error(campaignError.message || "Unable to join lead access campaigns.");
    }

    campaignsById = new Map(((campaigns ?? []) as LeadMapCampaign[]).map((campaign) => [campaign.id, campaign]));
  }

  return rows.map((row) => {
    const campaign = campaignsById.get(row.campaign_id);
    return {
      id: row.id,
      campaign_id: row.campaign_id,
      campaign_slug: campaign?.slug ?? "",
      campaign_title: campaign?.title ?? "Unknown campaign",
      issued_code: row.issued_code,
      code_last4: row.code_last4,
      note: row.note,
      reserved_email: row.reserved_email,
      redeemed_email: row.redeemed_email,
      redeemed_at: row.redeemed_at,
      revoked_at: row.revoked_at,
      generated_at: row.generated_at,
    } satisfies LeadAccessHistoryRow;
  });
}

export async function fetchLeadAccessCodeByHash(campaignId: string, codeHash: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_map_access_codes")
    .select(LEAD_ACCESS_CODE_SELECT_COLUMNS)
    .eq("campaign_id", campaignId)
    .eq("code_hash", codeHash)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to load lead access code.");
  }

  return (data as LeadMapAccessCode | null) ?? null;
}

export async function fetchLeadAccessCodeById(codeId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_map_access_codes")
    .select(LEAD_ACCESS_CODE_SELECT_COLUMNS)
    .eq("id", codeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to validate lead access code.");
  }

  return (data as LeadMapAccessCode | null) ?? null;
}

export async function revokeLeadAccessCode(codeId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("lead_map_access_codes")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", codeId)
    .select(LEAD_ACCESS_CODE_SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to revoke lead access code.");
  }

  return (data as LeadMapAccessCode | null) ?? null;
}

export async function deleteLeadAccessCode(codeId: string) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("lead_map_access_codes")
    .delete()
    .eq("id", codeId);

  if (error) {
    throw new Error(error.message || "Unable to delete lead access code.");
  }
}

export async function redeemLeadAccessCode(codeId: string, email: string) {
  const supabase = createServiceRoleClient();
  const normalizedEmail = normalizeLeadAccessEmail(email);
  const redeemedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("lead_map_access_codes")
    .update({
      redeemed_email: normalizedEmail,
      redeemed_at: redeemedAt,
    })
    .eq("id", codeId)
    .is("redeemed_at", null)
    .is("revoked_at", null)
    .select(LEAD_ACCESS_CODE_SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to redeem lead access code.");
  }

  return (data as LeadMapAccessCode | null) ?? null;
}

function generateLeadAccessCodeValue() {
  const bytes = randomBytes(9);
  let raw = "";
  for (const byte of bytes) {
    raw += LEAD_ACCESS_CODE_ALPHABET[byte % LEAD_ACCESS_CODE_ALPHABET.length];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 9)}${LEAD_ACCESS_CODE_ALPHABET[randomBytes(1)[0] % LEAD_ACCESS_CODE_ALPHABET.length]}${LEAD_ACCESS_CODE_ALPHABET[randomBytes(1)[0] % LEAD_ACCESS_CODE_ALPHABET.length]}${LEAD_ACCESS_CODE_ALPHABET[randomBytes(1)[0] % LEAD_ACCESS_CODE_ALPHABET.length]}`;
}

export async function createLeadAccessCodeForEmail({
  campaign,
  email,
  note,
  generatedBy,
}: {
  campaign: LeadMapCampaign;
  email: string;
  note?: string | null;
  generatedBy: AdminAuthResult;
}) {
  const supabase = createServiceRoleClient();
  const reservedEmail = normalizeLeadAccessEmail(email);

  const { error: revokeError } = await supabase
    .from("lead_map_access_codes")
    .update({ revoked_at: new Date().toISOString() })
    .eq("campaign_id", campaign.id)
    .eq("reserved_email", reservedEmail)
    .is("redeemed_at", null)
    .is("revoked_at", null);

  if (revokeError) {
    throw new Error(revokeError.message || "Unable to rotate an existing pending lead code.");
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateLeadAccessCodeValue();
    const normalizedCode = normalizeLeadAccessCode(code);
    const codeHash = hashLeadAccessCode(normalizedCode);
    const { data, error } = await supabase
      .from("lead_map_access_codes")
      .insert({
        campaign_id: campaign.id,
        code_hash: codeHash,
        issued_code: code,
        code_last4: normalizedCode.slice(-4),
        reserved_email: reservedEmail,
        note: note?.trim() || null,
        generated_by_user_id: generatedBy.userId,
      })
      .select(LEAD_ACCESS_CODE_SELECT_COLUMNS)
      .single();

    if (!error && data) {
      return {
        code,
        normalizedCode,
        row: data as LeadMapAccessCode,
      };
    }

    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message || "Unable to create lead access code.");
    }
  }

  throw new Error("Unable to generate a unique lead access code after multiple attempts.");
}

export async function fetchLeadMapSnapshot(mapId: string): Promise<SystemMapCanvasSnapshot | null> {
  const supabase = createServiceRoleClient();
  const [mapRes, typeRes, nodeRes, elementRes, relationRes, anchorLinkRes] = await Promise.all([
    supabase
      .schema("ms")
      .from("system_maps")
      .select("id,title,description,owner_id,updated_by_user_id,map_code,map_category,updated_at,created_at")
      .eq("id", mapId)
      .maybeSingle(),
    supabase
      .schema("ms")
      .from("document_types")
      .select("id,map_id,name,level_rank,band_y_min,band_y_max,is_active")
      .eq("is_active", true)
      .or(`map_id.eq.${mapId},map_id.is.null`)
      .order("level_rank", { ascending: true }),
    supabase
      .schema("ms")
      .from("document_nodes")
      .select("id,map_id,type_id,title,document_number,discipline,owner_user_id,owner_name,user_group,pos_x,pos_y,width,height,is_archived")
      .eq("map_id", mapId)
      .eq("is_archived", false),
    supabase
      .schema("ms")
      .from("canvas_elements")
      .select(CANVAS_ELEMENT_SELECT_COLUMNS)
      .eq("map_id", mapId)
      .order("created_at", { ascending: true }),
    supabase
      .schema("ms")
      .from("node_relations")
      .select("*")
      .eq("map_id", mapId),
    supabase
      .schema("ms")
      .from("canvas_anchor_links")
      .select("*")
      .eq("map_id", mapId)
      .order("sort_order", { ascending: true }),
  ]);

  if (mapRes.error) throw new Error(mapRes.error.message || "Unable to load map.");
  if (!mapRes.data) return null;
  if (typeRes.error) throw new Error(typeRes.error.message || "Unable to load map structure.");
  if (nodeRes.error) throw new Error(nodeRes.error.message || "Unable to load map documents.");
  if (elementRes.error) throw new Error(elementRes.error.message || "Unable to load map elements.");
  if (relationRes.error) throw new Error(relationRes.error.message || "Unable to load map relationships.");
  if (anchorLinkRes.error && anchorLinkRes.error.code !== "42501") {
    throw new Error(anchorLinkRes.error.message || "Unable to load map anchor links.");
  }

  const elements = (elementRes.data ?? []) as CanvasElementRow[];
  const imageUrlsByElementId = await createLeadMapSignedUrls(elements);

  return {
    map: mapRes.data as SystemMap,
    types: (typeRes.data ?? []) as DocumentTypeRow[],
    nodes: (nodeRes.data ?? []) as DocumentNodeRow[],
    elements,
    relations: (relationRes.data ?? []) as NodeRelationRow[],
    anchorLinks: (anchorLinkRes.error ? [] : anchorLinkRes.data ?? []),
    imageUrlsByElementId,
  };
}

async function createLeadMapSignedUrls(elements: CanvasElementRow[]) {
  const pairs = elements
    .filter((element) => element.element_type === "image_asset" || element.element_type === "incident_evidence")
    .map((element) => {
      const config = (element.element_config as Record<string, unknown> | null) ?? {};
      const key = element.element_type === "incident_evidence" ? "media_storage_path" : "storage_path";
      return {
        id: element.id,
        path: typeof config[key] === "string" ? String(config[key]) : "",
      };
    })
    .filter((pair) => pair.path);

  if (!pairs.length) return {};

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from("systemmap").createSignedUrls(
    pairs.map((pair) => pair.path),
    3600
  );

  if (error || !data) return {};

  const urlByPath = new Map<string, string>();
  data.forEach((row) => {
    if (row.path && row.signedUrl) {
      urlByPath.set(row.path, row.signedUrl);
    }
  });

  const next: Record<string, string> = {};
  pairs.forEach((pair) => {
    const url = urlByPath.get(pair.path);
    if (url) next[pair.id] = url;
  });
  return next;
}
