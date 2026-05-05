import { NextResponse } from "next/server";
import {
  DEFAULT_REPORT_SECTION_HEADING_COLOR,
  DEFAULT_REPORT_TABLE_HEADING_COLOR,
  normalizeHexColor,
  slugifyOrganisationName,
} from "@/lib/organisationBranding";
import { requirePlatformAdmin } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";

type CreateOrganisationBody = {
  name?: string;
  slug?: string;
  description?: string;
  billingPlanName?: string;
  billingNotes?: string;
  departmentNames?: string[];
  siteNames?: string[];
  sectionHeadingColor?: string;
  tableHeadingColor?: string;
};

const normalizeOptional = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

const normalizeList = (value: unknown) =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean))]
    : [];

const parseTextareaList = (value: FormDataEntryValue | null) =>
  [...new Set(
    String(value ?? "")
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean),
  )];

async function buildUniqueSlug(baseSlug: string, supabase: ReturnType<typeof createServiceRoleClient>) {
  let candidate = baseSlug;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const { data, error } = await supabase.from("organisations").select("id").eq("slug", candidate).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
    candidate = `${baseSlug}-${attempt + 2}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const { user, response } = await requirePlatformAdmin(request);
    if (response || !user) return response;

    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");
    const body = isMultipart ? null : ((await request.json().catch(() => null)) as CreateOrganisationBody | null);
    const formData = isMultipart ? await request.formData() : null;

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : typeof formData?.get("name") === "string"
          ? String(formData.get("name")).trim()
          : "";

    const requestedSlug =
      normalizeOptional(body?.slug)?.toLowerCase() ??
      (typeof formData?.get("slug") === "string" ? normalizeOptional(formData.get("slug"))?.toLowerCase() ?? null : null);

    const description =
      normalizeOptional(body?.description) ??
      (typeof formData?.get("description") === "string" ? normalizeOptional(formData.get("description")) : null);

    const billingPlanName =
      normalizeOptional(body?.billingPlanName) ??
      (typeof formData?.get("billingPlanName") === "string" ? normalizeOptional(formData.get("billingPlanName")) : null);

    const billingNotes =
      normalizeOptional(body?.billingNotes) ??
      (typeof formData?.get("billingNotes") === "string" ? normalizeOptional(formData.get("billingNotes")) : null);

    const departmentNames = isMultipart ? parseTextareaList(formData?.get("departmentNames") ?? null) : normalizeList(body?.departmentNames);
    const siteNames = isMultipart ? parseTextareaList(formData?.get("siteNames") ?? null) : normalizeList(body?.siteNames);

    const sectionHeadingColor = normalizeHexColor(
      typeof body?.sectionHeadingColor === "string" ? body.sectionHeadingColor : String(formData?.get("sectionHeadingColor") ?? ""),
      DEFAULT_REPORT_SECTION_HEADING_COLOR,
    );

    const tableHeadingColor = normalizeHexColor(
      typeof body?.tableHeadingColor === "string" ? body.tableHeadingColor : String(formData?.get("tableHeadingColor") ?? ""),
      DEFAULT_REPORT_TABLE_HEADING_COLOR,
    );

    const logoFile = formData?.get("logo");

    if (!name) {
      return NextResponse.json({ error: "Organisation name is required." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const slug = await buildUniqueSlug(requestedSlug || slugifyOrganisationName(name), supabase);

    const { data: organisation, error: organisationError } = await supabase
      .from("organisations")
      .insert({
        name,
        slug,
        description,
        billing_plan_name: billingPlanName,
        billing_notes: billingNotes,
        section_heading_color: sectionHeadingColor,
        table_heading_color: tableHeadingColor,
        account_owner_user_id: user.userId,
      })
      .select("id,name,slug,description,status,billing_plan_name,billing_notes,logo_storage_path,section_heading_color,table_heading_color,created_at")
      .single();

    if (organisationError) {
      throw new Error(organisationError.message);
    }

    let logoStoragePath = organisation.logo_storage_path ?? "";

    if (logoFile instanceof File && logoFile.size > 0) {
      const extension = (logoFile.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      logoStoragePath = `organisations/${organisation.id}/logo-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage.from("reportlogo").upload(logoStoragePath, logoFile, {
        upsert: true,
        contentType: logoFile.type || undefined,
      });
      if (uploadError) throw new Error(uploadError.message || "Unable to upload organisation logo.");

      const { error: updateError } = await supabase
        .from("organisations")
        .update({ logo_storage_path: logoStoragePath })
        .eq("id", organisation.id);
      if (updateError) throw new Error(updateError.message);
    }

    if (departmentNames.length) {
      const { error } = await supabase.from("organisation_departments").insert(
        departmentNames.map((departmentName) => ({
          organisation_id: organisation.id,
          name: departmentName,
        })),
      );
      if (error) throw new Error(error.message);
    }

    if (siteNames.length) {
      const { error } = await supabase.from("organisation_sites").insert(
        siteNames.map((siteName) => ({
          organisation_id: organisation.id,
          name: siteName,
        })),
      );
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({
      organisation: {
        ...organisation,
        logo_storage_path: logoStoragePath,
      },
    });
  } catch (error) {
    console.error("Organisation create failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create organisation." },
      { status: 500 },
    );
  }
}
