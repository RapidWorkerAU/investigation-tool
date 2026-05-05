import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

const parseNames = (value: unknown) =>
  Array.from(
    new Set(
      Array.isArray(value)
        ? value.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean)
        : []
    )
  );

export async function POST(request: Request, context: { params: Promise<{ organisationId: string }> }) {
  try {
    const { response } = await requirePlatformAdmin(request);
    if (response) return response;

    const { organisationId } = await context.params;
    const body = (await request.json().catch(() => null)) as { names?: unknown } | null;
    const names = parseNames(body?.names);

    if (!names.length) {
      return NextResponse.json({ error: "At least one site name is required." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("organisation_sites")
      .insert(
        names.map((name) => ({
          organisation_id: organisationId,
          name,
          description: null,
        }))
      )
      .select("id,name");

    if (error) throw new Error(error.message);
    return NextResponse.json({ sites: data ?? [] });
  } catch (error) {
    console.error("Admin create site failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create site." },
      { status: 500 }
    );
  }
}
