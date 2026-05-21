import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type BulkDeleteActivityLogsBody = {
  logIds?: string[];
};

export async function DELETE(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { userId } = await context.params;
    const body = (await request.json().catch(() => null)) as BulkDeleteActivityLogsBody | null;
    const logIds = Array.from(
      new Set((body?.logIds ?? []).map((logId) => (typeof logId === "string" ? logId.trim() : "")).filter(Boolean))
    );

    if (!logIds.length) {
      return NextResponse.json({ error: "Select at least one log entry." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("user_profile_activity_logs")
      .delete()
      .eq("user_id", userId)
      .in("id", logIds);

    if (error) throw new Error(error.message);
    return NextResponse.json({ deletedIds: logIds });
  } catch (error) {
    console.error("Admin delete user activity logs failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete activity logs." },
      { status: 500 },
    );
  }
}
