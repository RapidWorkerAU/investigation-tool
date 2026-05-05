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

    const body = (await request.json()) as { codeIds?: string[] };
    const codeIds = Array.isArray(body?.codeIds)
      ? body.codeIds.map((value) => String(value).trim()).filter(Boolean)
      : [];

    if (!codeIds.length) {
      return NextResponse.json({ error: "At least one code id is required." }, { status: 400 });
    }

    for (const codeId of codeIds) {
      const row = await fetchLeadAccessCodeById(codeId);
      if (!row) {
        return NextResponse.json({ error: "One or more lead access codes could not be found." }, { status: 404 });
      }
    }

    for (const codeId of codeIds) {
      await deleteLeadAccessCode(codeId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead access bulk delete failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to bulk delete lead access codes." }, { status: 500 });
  }
}
