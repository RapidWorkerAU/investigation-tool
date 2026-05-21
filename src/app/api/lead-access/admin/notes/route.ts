import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import {
  countLeadMapGuestNotesForAdmin,
  deleteLeadMapGuestNoteForAdmin,
  listLeadMapGuestNotesForAdmin,
  setLeadMapGuestNoteStatusForAdmin,
  type LeadMapGuestNoteStatus,
} from "@/lib/leadMapNotes";

const platformAdminUserId = "420266a0-2087-4f36-8c28-340443dd1a82";
const allowedStatuses = new Set<LeadMapGuestNoteStatus>(["pending", "approved", "hidden"]);

async function getPlatformAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const user = await getUserFromAuthHeader(authHeader);

  if (!user) return { error: "Unauthorized.", status: 401 as const };
  if (user.userId !== platformAdminUserId) return { error: "Forbidden.", status: 403 as const };
  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getPlatformAdmin(request);
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const pendingCount = await countLeadMapGuestNotesForAdmin("pending");
    if (request.nextUrl.searchParams.get("summary") === "1") {
      return NextResponse.json({ pendingCount });
    }

    const notes = await listLeadMapGuestNotesForAdmin(80);
    return NextResponse.json({ notes, pendingCount });
  } catch (error) {
    console.error("Lead map admin notes GET failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load guest notes." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getPlatformAdmin(request);
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = (await request.json()) as { noteId?: string; status?: LeadMapGuestNoteStatus };
    if (!body.noteId || !body.status || !allowedStatuses.has(body.status)) {
      return NextResponse.json({ error: "Note ID and a valid status are required." }, { status: 400 });
    }

    const note = await setLeadMapGuestNoteStatusForAdmin({
      noteId: body.noteId,
      status: body.status,
      adminUserId: admin.user.userId,
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Lead map admin notes PATCH failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update guest note." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getPlatformAdmin(request);
    if ("error" in admin) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = (await request.json()) as { noteId?: string };
    if (!body.noteId) {
      return NextResponse.json({ error: "Note ID is required." }, { status: 400 });
    }

    await deleteLeadMapGuestNoteForAdmin(body.noteId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lead map admin notes DELETE failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete guest note." }, { status: 500 });
  }
}
