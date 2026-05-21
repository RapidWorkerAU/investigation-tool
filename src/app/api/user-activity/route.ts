import { NextRequest, NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { insertUserProfileActivity, type UserProfileActivityStatus } from "@/lib/userProfileActivity";

type UserActivityBody = {
  action?: string;
  status?: UserProfileActivityStatus;
  summary?: string;
  metadata?: Record<string, unknown>;
};

function isStatus(value: unknown): value is UserProfileActivityStatus {
  return value === "success" || value === "failed" || value === "info";
}

export async function POST(request: NextRequest) {
  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as UserActivityBody | null;
  const action = typeof body?.action === "string" ? body.action.trim() : "";
  const summary = typeof body?.summary === "string" ? body.summary.trim() : "";
  const status = isStatus(body?.status) ? body.status : "success";
  const metadata = body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
    ? body.metadata
    : {};

  if (!action || !summary) {
    return NextResponse.json({ error: "Action and summary are required." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  await insertUserProfileActivity(supabase, {
    userId: user.userId,
    actorUserId: user.userId,
    action,
    status,
    summary,
    metadata,
  });

  return NextResponse.json({ ok: true });
}
