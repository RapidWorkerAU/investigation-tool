import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { deleteLeadAccessCode, fetchLeadAccessCodeById } from "@/lib/leadAccess";

const platformAdminUserId = "420266a0-2087-4f36-8c28-340443dd1a82";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getUserFromAuthHeader(authHeader);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (user.userId !== platformAdminUserId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as { codeId?: string };
    const codeId = String(body?.codeId ?? "").trim();
    if (!codeId) {
      return NextResponse.json({ error: "Code id is required." }, { status: 400 });
    }

    const row = await fetchLeadAccessCodeById(codeId);
    if (!row) {
      return NextResponse.json({ error: "Lead access code not found." }, { status: 404 });
    }

    await deleteLeadAccessCode(codeId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead access delete failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete lead access code." }, { status: 500 });
  }
}
