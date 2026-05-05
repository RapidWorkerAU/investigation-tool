import { NextResponse } from "next/server";
import { deleteManagedUser } from "@/lib/adminUsers";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type BulkDeleteUsersBody = {
  userIds?: string[];
};

export async function DELETE(request: Request) {
  try {
    const { user, response } = await requirePlatformAdmin(request);
    if (response || !user) return response;

    const body = (await request.json().catch(() => null)) as BulkDeleteUsersBody | null;
    const userIds = Array.from(
      new Set((body?.userIds ?? []).filter((value): value is string => typeof value === "string" && value.trim().length > 0))
    );

    if (!userIds.length) {
      return NextResponse.json({ error: "Select at least one user to delete." }, { status: 400 });
    }

    if (userIds.includes(user.userId)) {
      return NextResponse.json({ error: "The current admin account cannot be bulk deleted." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const deletedIds: string[] = [];
    const failures: Array<{ userId: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        await deleteManagedUser(supabase, userId);
        deletedIds.push(userId);
      } catch (error) {
        failures.push({
          userId,
          error: error instanceof Error ? error.message : "Unable to delete user.",
        });
      }
    }

    return NextResponse.json(
      {
        ok: failures.length === 0,
        deletedIds,
        failures,
      },
      { status: failures.length ? 207 : 200 }
    );
  } catch (error) {
    console.error("Admin bulk user delete failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to bulk delete users." },
      { status: 500 }
    );
  }
}
