import { NextRequest, NextResponse } from "next/server";
import {
  fetchLeadAccessCodeById,
  fetchLeadMapCampaignBySlug,
  normalizeLeadAccessSlug,
  readLeadAccessSessionFromCookies,
} from "@/lib/leadAccess";
import {
  cleanLeadMapNoteBody,
  cleanLeadMapNoteDisplayName,
  createLeadMapGuestNote,
  deleteOwnLeadMapGuestNote,
  listLeadMapGuestNotesForViewer,
  updateOwnLeadMapGuestNote,
} from "@/lib/leadMapNotes";

async function getGuestNoteSession(request: NextRequest, rawSlug: string) {
  const slug = normalizeLeadAccessSlug(rawSlug);
  if (!slug) return { error: "Campaign slug is required.", status: 400 as const };

  const campaign = await fetchLeadMapCampaignBySlug(slug);
  if (!campaign || !campaign.is_active) {
    return { error: "This case study is unavailable.", status: 404 as const };
  }

  const session = readLeadAccessSessionFromCookies(request.cookies, campaign.slug);
  if (!session || session.campaignId !== campaign.id || session.mapId !== campaign.map_id) {
    return { error: "Guest access is required.", status: 401 as const };
  }

  const code = await fetchLeadAccessCodeById(session.codeId);
  if (
    !code ||
    code.campaign_id !== campaign.id ||
    code.revoked_at ||
    !code.redeemed_at ||
    !code.redeemed_email ||
    code.redeemed_email !== session.redeemedEmail
  ) {
    return { error: "Guest access is no longer valid.", status: 401 as const };
  }

  return { campaign, session, code };
}

function readFiniteNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function validateNoteText(displayNameRaw: unknown, bodyRaw: unknown) {
  const displayName = cleanLeadMapNoteDisplayName(String(displayNameRaw ?? ""));
  const body = cleanLeadMapNoteBody(String(bodyRaw ?? ""));

  if (displayName.length < 2) {
    return { error: "Enter a visible name or username.", status: 400 as const };
  }
  if (!body) {
    return { error: "Enter a note before submitting.", status: 400 as const };
  }

  return { displayName, body };
}

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug") ?? "";
    const result = await getGuestNoteSession(request, slug);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const notes = await listLeadMapGuestNotesForViewer({
      campaignId: result.campaign.id,
      mapId: result.campaign.map_id,
      accessCodeId: result.session.codeId,
      authorEmail: result.session.redeemedEmail,
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Lead map notes GET failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load notes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      displayName?: string;
      body?: string;
      posX?: number;
      posY?: number;
      targetFlowId?: string | null;
    };
    const result = await getGuestNoteSession(request, String(body.slug ?? ""));
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const text = validateNoteText(body.displayName, body.body);
    if ("error" in text) {
      return NextResponse.json({ error: text.error }, { status: text.status });
    }

    const posX = readFiniteNumber(body.posX);
    const posY = readFiniteNumber(body.posY);
    if (posX === null || posY === null) {
      return NextResponse.json({ error: "Choose where to place the note on the map." }, { status: 400 });
    }

    const note = await createLeadMapGuestNote({
      campaignId: result.campaign.id,
      mapId: result.campaign.map_id,
      accessCodeId: result.session.codeId,
      authorEmail: result.session.redeemedEmail,
      displayName: text.displayName,
      body: text.body,
      posX,
      posY,
      targetFlowId: typeof body.targetFlowId === "string" ? body.targetFlowId : null,
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Lead map notes POST failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save note." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      slug?: string;
      noteId?: string;
      displayName?: string;
      body?: string;
    };
    const result = await getGuestNoteSession(request, String(body.slug ?? ""));
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    if (!body.noteId) {
      return NextResponse.json({ error: "Note ID is required." }, { status: 400 });
    }

    const text = validateNoteText(body.displayName, body.body);
    if ("error" in text) {
      return NextResponse.json({ error: text.error }, { status: text.status });
    }

    const note = await updateOwnLeadMapGuestNote({
      noteId: body.noteId,
      campaignId: result.campaign.id,
      mapId: result.campaign.map_id,
      accessCodeId: result.session.codeId,
      authorEmail: result.session.redeemedEmail,
      displayName: text.displayName,
      body: text.body,
    });

    if (!note) {
      return NextResponse.json({ error: "You can only edit notes you created." }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Lead map notes PATCH failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update note." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { slug?: string; noteId?: string };
    const result = await getGuestNoteSession(request, String(body.slug ?? ""));
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    if (!body.noteId) {
      return NextResponse.json({ error: "Note ID is required." }, { status: 400 });
    }

    await deleteOwnLeadMapGuestNote({
      noteId: body.noteId,
      campaignId: result.campaign.id,
      mapId: result.campaign.map_id,
      accessCodeId: result.session.codeId,
      authorEmail: result.session.redeemedEmail,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lead map notes DELETE failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete note." }, { status: 500 });
  }
}
