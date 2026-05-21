import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type BulkClearDirectReportsBody = {
  reports?: Array<{
    organisationId?: string;
    userId?: string;
  }>;
};

export async function DELETE(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { userId: leaderUserId } = await context.params;
    const body = (await request.json().catch(() => null)) as BulkClearDirectReportsBody | null;
    const reports = (body?.reports ?? [])
      .map((report) => ({
        organisationId: typeof report.organisationId === "string" ? report.organisationId.trim() : "",
        userId: typeof report.userId === "string" ? report.userId.trim() : "",
      }))
      .filter((report) => report.organisationId && report.userId);

    if (!reports.length) {
      return NextResponse.json({ error: "Select at least one direct report." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const cleared: Array<{ organisationId: string; userId: string }> = [];
    const failures: Array<{ organisationId: string; userId: string; error: string }> = [];

    for (const report of reports) {
      const { error } = await supabase
        .from("organisation_memberships")
        .update({ leader_user_id: null })
        .eq("organisation_id", report.organisationId)
        .eq("user_id", report.userId)
        .eq("leader_user_id", leaderUserId);

      if (error) {
        failures.push({ ...report, error: error.message });
      } else {
        cleared.push(report);
      }
    }

    return NextResponse.json({ cleared, failures });
  } catch (error) {
    console.error("Admin clear direct reports failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to clear direct reports." },
      { status: 500 },
    );
  }
}
