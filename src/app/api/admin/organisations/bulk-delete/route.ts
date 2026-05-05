import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type BulkDeleteOrganisationsBody = {
  organisationIds?: string[];
};

export async function DELETE(request: Request) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const body = (await request.json().catch(() => null)) as BulkDeleteOrganisationsBody | null;
    const organisationIds = Array.from(
      new Set(
        (body?.organisationIds ?? []).filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      )
    );

    if (!organisationIds.length) {
      return NextResponse.json({ error: "Select at least one organisation to delete." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("organisations").delete().in("id", organisationIds);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, deletedIds: organisationIds });
  } catch (error) {
    console.error("Admin bulk organisation delete failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to bulk delete organisations." },
      { status: 500 }
    );
  }
}
