import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ organisationId: string; inviteId: string }> }
) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { organisationId, inviteId } = await context.params;
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("organisation_invites")
      .delete()
      .eq("organisation_id", organisationId)
      .eq("id", inviteId);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin delete organisation invite failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete invite." },
      { status: 500 }
    );
  }
}
