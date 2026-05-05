import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ organisationId: string; departmentId: string }> }
) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { organisationId, departmentId } = await context.params;
    const body = (await request.json().catch(() => null)) as { name?: string } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Department name is required." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("organisation_departments")
      .update({ name })
      .eq("organisation_id", organisationId)
      .eq("id", departmentId);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin update department failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update department." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ organisationId: string; departmentId: string }> }
) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { organisationId, departmentId } = await context.params;
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("organisation_departments")
      .delete()
      .eq("organisation_id", organisationId)
      .eq("id", departmentId);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin delete department failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete department." },
      { status: 500 }
    );
  }
}
